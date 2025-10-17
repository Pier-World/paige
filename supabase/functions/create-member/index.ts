import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique member ID
const generateMemberId = () => {
  const prefix = 'PIER';
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${randomDigits}`;
};

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: corsHeaders
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const { firstName, lastName, email, password, membershipLevel, memberId } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !membershipLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Use provided member ID or generate one
    const finalMemberId = memberId || generateMemberId();

    // Check if email already exists (using .maybeSingle() to avoid error when no rows found)
    const { data: existingUser } = await supabase
      .from('members')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A member with this email already exists' }),
        { 
          status: 409,
          headers: corsHeaders
        }
      );
    }

    // Check if member ID already exists (using .maybeSingle() to avoid error when no rows found)
    const { data: existingMemberId } = await supabase
      .from('members')
      .select('member_id')
      .eq('member_id', finalMemberId)
      .maybeSingle();

    if (existingMemberId) {
      return new Response(
        JSON.stringify({ error: 'This member ID is already in use' }),
        { 
          status: 409,
          headers: corsHeaders
        }
      );
    }

    // Step 1: Create auth user
    const { data: { user }, error: createUserError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (createUserError || !user) {
      throw new Error(createUserError?.message || 'Failed to create auth user');
    }

    console.log('Auth user created:', user.id);

    // Step 2: Create member profile
    const { error: memberError } = await supabase
      .from('members')
      .insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: 'member',
        member_id: finalMemberId,
        membership_level: membershipLevel,
        preferences: {
          preferred_cities: [],
          interests: []
        }
      });

    if (memberError) {
      // Cleanup: delete auth user if member creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw new Error(`Failed to create member profile: ${memberError.message}`);
    }

    // Step 3: Verify member was created
    const { data: verifyMember, error: verifyError } = await supabase
      .from('members')
      .select('*')
      .eq('id', user.id)
      .single();

    if (verifyError || !verifyMember) {
      // Cleanup if verification fails
      await supabase.auth.admin.deleteUser(user.id);
      throw new Error('Member creation verification failed');
    }

    console.log('Member created and verified:', finalMemberId);

    return new Response(
      JSON.stringify({
        message: 'Member account created successfully',
        userId: user.id,
        memberId: finalMemberId,
        member: {
          id: user.id,
          firstName: firstName,
          lastName: lastName,
          email: email,
          memberId: finalMemberId,
          membershipLevel: membershipLevel,
          createdAt: new Date().toISOString()
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in create-member function:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create member account',
        details: error
      }),
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }
});