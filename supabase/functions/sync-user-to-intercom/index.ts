/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const INTERCOM_ACCESS_TOKEN = Deno.env.get('INTERCOM_ACCESS_TOKEN') || '';
const INTERCOM_API_VERSION = '2.11';

/**
 * Sync user to Intercom (create or update contact)
 */
async function syncUserToIntercom(supabase: any, userId: string): Promise<string | null> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, members(*)')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.warn('⚠️ Profile not found for sync:', userId);
    return null;
  }

  // Get email from members table if not in profile
  const email = profile.email || profile.members?.email;
  const name = profile.full_name || 
               (profile.members ? `${profile.members.first_name} ${profile.members.last_name}` : null) ||
               email?.split('@')[0] ||
               'Pier Member';

  try {
    // Create or update user in Intercom
    const response = await fetch('https://api.intercom.io/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': INTERCOM_API_VERSION,
      },
      body: JSON.stringify({
        external_id: userId, // Use Supabase user ID as external_id
        email: email,
        name: name,
        phone: profile.phone_number,
        custom_attributes: {
          membership_level: profile.members?.membership_level || 'Standard',
          user_type: 'member',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to sync user to Intercom:', error);
      return null;
    }

    const data = await response.json();

    // Save Intercom user ID back to database
    await supabase
      .from('profiles')
      .update({ intercom_user_id: data.id })
      .eq('id', userId);

    console.log('✅ User synced to Intercom:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error syncing user to Intercom:', error);
    return null;
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const intercomUserId = await syncUserToIntercom(supabase, userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        intercom_user_id: intercomUserId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

