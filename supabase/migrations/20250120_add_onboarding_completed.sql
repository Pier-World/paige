-- ============================================================================
-- Add Onboarding Completed to Profiles
-- Purpose: Track whether user has completed onboarding flow
-- ============================================================================

-- Add onboarding_completed column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding flow. Defaults to false for all existing and new users.';
    RAISE NOTICE 'Added onboarding_completed column to profiles';
    
    -- Set all existing users to false (they need to complete onboarding)
    UPDATE profiles SET onboarding_completed = false WHERE onboarding_completed IS NULL;
  END IF;
END $$;


