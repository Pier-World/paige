-- ============================================================================
-- Add Profile-Member Relationship Constraint
-- Purpose: Ensure profiles are properly linked to members when appropriate
-- ============================================================================

-- Step 1: Create a function to check if a profile should exist
-- This allows profiles for email parsing but validates member profiles
CREATE OR REPLACE FUNCTION should_profile_exist(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Profile is valid if:
  -- 1. It exists in members table (actual member)
  -- 2. It exists in auth.users (authenticated user, might not be member yet)
  -- 3. It's referenced in conversations (email parsing context)
  RETURN EXISTS (
    SELECT 1 FROM members WHERE id = profile_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = profile_id
  ) OR EXISTS (
    SELECT 1 FROM conversations WHERE profile_id = profile_id
  );
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a view to easily identify orphaned profiles
CREATE OR REPLACE VIEW orphaned_profiles_view AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM members m WHERE m.id = p.id) THEN 'member'
    WHEN EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id) THEN 'auth_user_only'
    WHEN EXISTS (SELECT 1 FROM conversations c WHERE c.profile_id = p.id) THEN 'referenced'
    ELSE 'orphaned'
  END as status,
  (SELECT COUNT(*) FROM conversations WHERE profile_id = p.id) as conversation_count,
  (SELECT COUNT(*) FROM channels WHERE profile_id = p.id) as channel_count
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM members WHERE id = p.id)
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p.id);

COMMENT ON VIEW orphaned_profiles_view IS 'Shows profiles that are not linked to members or auth.users';

-- Step 3: Add helpful comment to profiles table
COMMENT ON TABLE profiles IS 'User profiles. Should primarily be linked to members table via id. Can also exist for email parsing context.';

