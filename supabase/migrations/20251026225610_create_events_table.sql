/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key) - Unique identifier for each event
      - `title` (text) - Event title
      - `short_description` (text) - Brief description for card display
      - `description` (text) - Full event description
      - `image_url` (text) - URL to event image
      - `date` (date) - Event date
      - `time` (text) - Event time
      - `location` (text) - Event venue/location
      - `city` (text) - City where event takes place
      - `tags` (text[]) - Array of tags for categorization (e.g., 'dining', 'pier', 'partner')
      - `featured` (boolean) - Whether event is featured on homepage
      - `rsvp_instructions` (text) - Instructions for RSVPing to the event
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `events` table
    - Add policy for all authenticated users to read events
    - Add policy for admin users to manage events

  3. Notes
    - Similar structure to perks table for consistency
    - Tags allow flexible categorization (pier events, partner events, event types)
    - Featured flag enables homepage promotion
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  city text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  rsvp_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  );
