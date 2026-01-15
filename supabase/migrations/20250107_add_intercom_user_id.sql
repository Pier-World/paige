-- Add intercom_user_id column to profiles table
-- This links Supabase users to Intercom contacts

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS intercom_user_id text;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_intercom_user_id 
ON profiles(intercom_user_id);

-- Add comment
COMMENT ON COLUMN profiles.intercom_user_id IS 'Intercom contact ID for this user, used to link Supabase users to Intercom conversations';

