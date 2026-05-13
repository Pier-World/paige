/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stripeCustomerId: string;
  interests: string[];
  preferredCities: string[];
  cards: string[];
  trialDays: number;
  membershipLevel: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment configuration');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminMember, error: memberError } = await supabaseAdmin
      .from('members')
      .select('role')
      .eq('id', user.id)
      .single();

    if (memberError || adminMember?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const memberData: MemberData = await req.json();

    if (!memberData.email || !memberData.firstName || !memberData.lastName || !memberData.stripeCustomerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!memberData.stripeCustomerId.startsWith('cus_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Stripe customer ID format. Must start with "cus_"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: memberData.email,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Auth user not returned');
    }

    const memberId = `PIER${Math.floor(10000 + Math.random() * 90000)}`;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + (memberData.trialDays ?? 14));

    const frontendUrl = Deno.env.get('VITE_FRONTEND_URL') || 'https://pier.vip';

    // Map form values to DB enum: Standard | Premium | Executive | Founding Member
    const mapMembershipLevel = (level: string): string => {
      const v = level || 'Pro';
      if (v === 'Founding Member') return 'Founding Member';
      if (v === 'Pro') return 'Premium';
      if (v === 'Core') return 'Standard';
      if (['Standard', 'Premium', 'Executive'].includes(v)) return v;
      return 'Premium';
    };

    const { error: insertError } = await supabaseAdmin
      .from('members')
      .insert({
        id: authData.user.id,
        first_name: memberData.firstName,
        last_name: memberData.lastName,
        email: memberData.email,
        phone: memberData.phone || '',
        member_id: memberId,
        stripe_customer_id: memberData.stripeCustomerId,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        membership_level: mapMembershipLevel(memberData.membershipLevel),
        role: 'member',
        preferences: {
          interests: memberData.interests || [],
          preferred_cities: memberData.preferredCities || [],
        },
        cards: memberData.cards || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create member record: ${insertError.message}`);
    }

    // Create profile so onboarding_completed and personal_context exist (id = auth user id)
    const now = new Date().toISOString();
    const fullName = [memberData.firstName, memberData.lastName].filter(Boolean).join(' ') || memberData.email;
    const personalContext = {
      interests: memberData.interests || [],
      preferred_cities: memberData.preferredCities || [],
    };
    const profilePayload = {
      id: authData.user.id,
      full_name: fullName,
      email: memberData.email,
      phone_number: memberData.phone || null,
      onboarding_completed: false,
      personal_context: personalContext,
      time_zone: 'America/New_York',
      travel_preferences: {},
      communication_preferences: {},
      metadata: {},
      created_at: now,
      updated_at: now,
    };
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert failed (message):', profileError.message);
      // Retry with minimal columns in case some columns don't exist
      const { error: profileError2 } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: authData.user.id,
            full_name: fullName,
            email: memberData.email,
            onboarding_completed: false,
            personal_context: personalContext,
            updated_at: now,
          },
          { onConflict: 'id' }
        );
      if (profileError2) {
        console.error('Profile retry failed:', profileError2.message);
      }
    }

    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email: memberData.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${frontendUrl}/`,
      },
    });

    const otpSent = !otpError;
    if (otpError) {
      console.error('Failed to send OTP:', otpError);
    }

    const message = otpSent
      ? `Member created successfully! Access code sent to ${memberData.email}`
      : `Member created (ID ${memberId}), but the sign-in email could not be sent. Send a code manually or check Auth logs. ${otpError?.message ?? ''}`;

    return new Response(
      JSON.stringify({
        success: true,
        memberId,
        otpSent,
        ...(otpError ? { otpError: otpError.message } : {}),
        message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-member function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
