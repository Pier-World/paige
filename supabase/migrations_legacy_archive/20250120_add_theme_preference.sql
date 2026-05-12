-- ============================================================================
-- Add Theme Preference to Profiles
-- Purpose: Store user's theme preference (light/dark) in profiles table
-- ============================================================================

-- Add theme_preference column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));
    COMMENT ON COLUMN profiles.theme_preference IS 'User theme preference: light or dark. Defaults to light for new users.';
    RAISE NOTICE 'Added theme_preference column to profiles';
  END IF;
END $$;


