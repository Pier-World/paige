import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt } from '../_shared/encryption.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/auth-google/callback`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'Location',
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Route 1: Initiate OAuth flow
    if (path.includes('/auth-google') && !path.includes('/callback')) {
      return initiateOAuth(url, corsHeaders);
    }

    // Route 2: OAuth callback (from Google - no auth required)
    if (path.includes('/callback')) {
      return await handleCallback(url, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function initiateOAuth(url: URL, corsHeaders: any) {
  const userId = url.searchParams.get('user_id');
  const provider = url.searchParams.get('provider'); // 'gmail' or 'calendar'

  if (!userId || !provider) {
    return new Response(
      JSON.stringify({ error: 'Missing user_id or provider' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Scopes based on provider
  let scopes: string[];
  if (provider === 'gmail') {
    scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ];
  } else if (provider === 'calendar') {
    scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];
  } else {
    return new Response(
      JSON.stringify({ error: 'Invalid provider' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Build OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', JSON.stringify({ userId, provider }));

  // Redirect to Google OAuth
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': authUrl.toString(),
    },
  });
}

async function handleCallback(url: URL, corsHeaders: any) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors - redirect to frontend
  if (error) {
    console.error('OAuth error from Google:', error);
    const errorRedirectUrl = `${FRONTEND_URL}/oauth-callback?error=${error}&type=oauth`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorRedirectUrl,
      },
    });
  }

  if (!code || !state) {
    const errorRedirectUrl = `${FRONTEND_URL}/oauth-callback?error=missing_params&type=oauth`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorRedirectUrl,
      },
    });
  }

  const { userId, provider } = JSON.parse(state);

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      const errorRedirectUrl = `${FRONTEND_URL}/oauth-callback?error=token_exchange&type=oauth&provider=${provider}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': errorRedirectUrl,
        },
      });
    }

    // Store tokens in integrations table
    const providerNameForDb = provider === 'gmail' ? 'google_gmail' : 'google_calendar';

    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;

    const { error: upsertError } = await supabase.from('integrations').upsert({
      user_id: userId,
      provider: providerNameForDb,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider',
    });

    if (upsertError) {
      console.error('Database error:', upsertError);
      const errorRedirectUrl = `${FRONTEND_URL}/oauth-callback?error=database&type=oauth&provider=${provider}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': errorRedirectUrl,
        },
      });
    }

    // Trigger initial sync (don't wait for it)
    triggerInitialSync(provider, userId).catch(err => {
      console.error('Sync trigger error:', err);
    });

    // Redirect to frontend with success
    const successRedirectUrl = `${FRONTEND_URL}/oauth-callback?success=true&provider=${provider}`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': successRedirectUrl,
      },
    });

  } catch (error) {
    console.error('Callback handler error:', error);
    const errorRedirectUrl = `${FRONTEND_URL}/oauth-callback?error=unknown&type=oauth&provider=${provider}`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorRedirectUrl,
      },
    });
  }
}

async function triggerInitialSync(provider: string, userId: string) {
  if (provider === 'gmail') {
    await fetch(`${SUPABASE_URL}/functions/v1/gmail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ userId, action: 'init' }),
    });
  } else if (provider === 'calendar') {
    await fetch(`${SUPABASE_URL}/functions/v1/calendar-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ userId, action: 'init' }),
    });
  }
}
