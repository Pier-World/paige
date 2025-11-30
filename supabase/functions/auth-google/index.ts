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

    // Route 2: OAuth callback
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

  if (error) {
    console.error('OAuth error from Google:', error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/profile?error=${error}`,
      },
    });
  }

  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: 'Missing code or state' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { userId, provider } = JSON.parse(state);

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
    throw new Error(tokens.error_description || tokens.error);
  }

  // Store tokens in integrations table
  const providerName = provider === 'gmail' ? 'google_gmail' : 'google_calendar';

  const encryptedAccessToken = await encrypt(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;

  const { error: upsertError } = await supabase.from('integrations').upsert({
    user_id: userId,
    provider: providerName,
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
    throw new Error(`Failed to store integration: ${upsertError.message}`);
  }

  // Trigger initial sync
  try {
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
  } catch (syncError) {
    console.error('Sync trigger error:', syncError);
    // Don't fail the OAuth flow if sync fails - we can retry later
  }

  // Redirect back to app with success
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': `${FRONTEND_URL}/profile?connected=${provider}`,
    },
  });
}

