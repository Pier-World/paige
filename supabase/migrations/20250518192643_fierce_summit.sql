/*
  # Create members table and authentication setup

  1. New Tables
    - `members`
      - `id` (uuid, primary key, matches auth.users.id)
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
    - Add policies for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'member',
  member_id text UNIQUE NOT NULL,
  preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

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