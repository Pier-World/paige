-- ============================================================================
-- Add Profile Fields for Enhanced Profile Page
-- Purpose: Add profile_photo_url and ensure personal_context structure
-- ============================================================================

-- Add profile_photo_url column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo_url TEXT;
    COMMENT ON COLUMN profiles.profile_photo_url IS 'URL to user profile photo (stored in Supabase Storage or external)';
    RAISE NOTICE 'Added profile_photo_url column to profiles';
  END IF;
END $$;

-- Ensure personal_context has preferred_cities and interests structure
DO $$
BEGIN
  -- Update personal_context to include preferred_cities and interests if they don't exist
  UPDATE profiles
  SET personal_context = COALESCE(personal_context, '{}'::jsonb) || 
    jsonb_build_object(
      'preferred_cities', COALESCE(personal_context->'preferred_cities', '[]'::jsonb),
      'interests', COALESCE(personal_context->'interests', '[]'::jsonb)
    )
  WHERE personal_context IS NULL 
     OR NOT (personal_context ? 'preferred_cities')
     OR NOT (personal_context ? 'interests');
END $$;

