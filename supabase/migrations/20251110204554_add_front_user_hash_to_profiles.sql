/*
  # Add Front User Hash to Profiles

  1. Changes
    - Add `front_user_hash` column to `profiles` table
    - This column stores the HMAC hash for verified Front identity
    - Optional field, only used if Front Identity Verification is enabled

  2. Notes
    - front_user_hash is generated server-side using HMAC-SHA256
    - Allows Front to verify the identity of users from the portal
    - See: https://dev.frontapp.com/docs/chat-sdk#identity-verification
*/

-- Add front_user_hash column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'front_user_hash'
  ) THEN
    ALTER TABLE profiles ADD COLUMN front_user_hash text;
  END IF;
END $$;