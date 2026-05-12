/*
  # Add RLS policy for membership changes

  1. Security Changes
    - Add RLS policy to allow authenticated users to insert their own membership changes
    - This policy ensures users can only create membership change records for their own account
    - Existing SELECT policy remains unchanged
*/

CREATE POLICY "Users can insert own membership changes"
  ON membership_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);