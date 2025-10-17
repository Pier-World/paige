/*
  # Create members table and authentication setup

  1. New Tables
    - `members`
      - `id` (uuid, primary key, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text, nullable)
      - `role` (text, default 'member')
      - `member_id` (text, unique)
      - `preferences` (jsonb, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `members` table
    - Add policies for authenticated users to read and update their own data
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS members;

-- Create the members table
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'member',
  member_id text UNIQUE NOT NULL,
  preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY (id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();