-- ============================================================================
-- Cleanup Orphaned Profiles
-- Purpose: Remove profiles that don't correspond to actual members
-- ============================================================================

-- Step 1: Identify orphaned profiles (profiles without corresponding members)
-- These are profiles where the id doesn't exist in the members table
-- AND the id doesn't exist in auth.users

-- First, let's see what we're dealing with (for reference, not executed)
-- SELECT p.id, p.email, p.full_name, p.created_at
-- FROM profiles p
-- LEFT JOIN members m ON p.id = m.id
-- LEFT JOIN auth.users u ON p.id = u.id
-- WHERE m.id IS NULL AND u.id IS NULL;

-- Step 2: Delete orphaned profiles
-- Only delete profiles that:
-- 1. Don't have a corresponding member
-- 2. Don't have a corresponding auth.user
-- 3. Are not referenced by other important tables
-- 4. Are clearly test/system data (emails like noreply@, test@, etc.)

DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Delete orphaned profiles that aren't referenced elsewhere
  WITH orphaned_profiles AS (
    SELECT p.id
    FROM profiles p
    LEFT JOIN members m ON p.id = m.id
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE m.id IS NULL 
      AND u.id IS NULL
      -- Don't delete if referenced in important tables
      AND NOT EXISTS (
        SELECT 1 FROM conversations c WHERE c.profile_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM channels ch WHERE ch.profile_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_context_history uch WHERE uch.profile_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_preferences up WHERE up.profile_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM trips t WHERE t.profile_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM requests r WHERE r.profile_id = p.id
      )
      -- Also check if email looks like system/test data
      AND (
        p.email IS NULL 
        OR p.email LIKE 'noreply@%'
        OR p.email LIKE 'test@%'
        OR p.email LIKE 'support@%'
        OR p.email LIKE 'subscriptions@%'
        OR p.email LIKE '%@luma-mail.com'
        OR p.email LIKE '%@beehiiv.com'
        OR p.email LIKE '%@fora.travel'
        OR p.email LIKE '%@mondee.com'
        OR p.email ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' -- UUID as email
        OR p.full_name = 'Unknown'
        OR p.full_name = 'Guest'
      )
  )
  DELETE FROM profiles
  WHERE id IN (SELECT id FROM orphaned_profiles);
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % orphaned profile(s)', orphaned_count;
END $$;

-- Step 3: Add a constraint to prevent future orphaned profiles
-- We'll add a trigger that warns (but doesn't block) when creating profiles
-- that don't correspond to members, to allow for email parsing use cases
-- but log them for review

-- Create a function to validate profile ownership (warning only, not blocking)
CREATE OR REPLACE FUNCTION validate_profile_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the profile id exists in members table
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = NEW.id) THEN
    -- If not in members, check if it exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
      -- Log a warning but don't block (allows email parsing profiles)
      -- In production, you might want to make this an error instead
      RAISE WARNING 'Profile id % does not correspond to a member or auth user. Email: %, Name: %', 
        NEW.id, NEW.email, NEW.full_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate on insert/update (warning only)
DROP TRIGGER IF EXISTS check_profile_owner ON profiles;
CREATE TRIGGER check_profile_owner
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_owner();

-- Step 4: Add a helpful index for quick lookups
-- Note: Can't use subquery in partial index, so we'll create a regular index
-- The join with members will still be fast with this index
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Step 5: Optional - Add a view for easy querying of valid profiles
CREATE OR REPLACE VIEW valid_profiles AS
SELECT 
  -- Profile columns (explicitly listed to avoid conflicts)
  p.id,
  p.full_name,
  p.email as profile_email,
  p.phone_number,
  p.time_zone,
  p.travel_preferences,
  p.onboarding_completed,
  p.front_user_hash,
  p.personal_context,
  p.communication_preferences,
  p.metadata,
  p.profile_photo_url,
  p.theme_preference,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at,
  -- Member columns
  m.first_name,
  m.last_name,
  m.email as member_email,
  m.member_id,
  m.membership_level,
  m.role as member_role,
  -- Profile type indicator
  CASE 
    WHEN m.id IS NOT NULL THEN 'member'
    WHEN u.id IS NOT NULL THEN 'auth_user'
    ELSE 'orphaned'
  END as profile_type
FROM profiles p
LEFT JOIN members m ON p.id = m.id
LEFT JOIN auth.users u ON p.id = u.id;

COMMENT ON VIEW valid_profiles IS 'Shows all profiles with their member status and type';

