/*
  # Add membership changes tracking

  1. New Tables
    - `membership_changes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references members)
      - `previous_level` (text)
      - `new_level` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `membership_changes` table
    - Add policy for authenticated users to read their own changes
*/

CREATE TABLE membership_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  previous_level text NOT NULL,
  new_level text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_previous_level CHECK (previous_level IN ('Standard', 'Premium', 'Executive', 'Founding Member')),
  CONSTRAINT valid_new_level CHECK (new_level IN ('Standard', 'Premium', 'Executive', 'Founding Member'))
);

-- Enable RLS
ALTER TABLE membership_changes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own membership changes"
  ON membership_changes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);