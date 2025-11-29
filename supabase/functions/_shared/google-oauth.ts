import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt, decrypt } from './encryption.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getValidGoogleToken(
  userId: string,
  provider: 'google_gmail' | 'google_calendar'
): Promise<string> {
  // Get integration record
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !integration) {
    throw new Error(`No ${provider} integration found: ${error?.message || 'Not found'}`);
  }

  if (!integration.access_token || !integration.refresh_token) {
    throw new Error(`Invalid ${provider} integration: missing tokens`);
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;

  if (!expiresAt || now >= expiresAt) {
    // Refresh token
    const refreshToken = await decrypt(integration.refresh_token);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to refresh token: ${errorData}`);
    }

    const newTokenData = await response.json();

    // Update stored token
    const encryptedToken = await encrypt(newTokenData.access_token);
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        access_token: encryptedToken,
        expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    if (updateError) {
      console.error('Error updating token:', updateError);
    }

    return newTokenData.access_token;
  }

  return await decrypt(integration.access_token);
}

