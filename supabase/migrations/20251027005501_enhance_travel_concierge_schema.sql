/*
  # Enhance Travel Concierge Schema
  
  1. Overview
    This migration enhances the existing `requests` and `conversations` tables 
    to support intelligent travel request collection with structured data extraction,
    smart chips UI, and realtime result streaming.
    
  2. Changes to `requests` table
    - Add `results` (jsonb) - Stores search results from orchestrator (flights, hotels, etc.)
    - Add `front_conversation_id` (text) - Links to Front unified inbox conversation
    
  3. Changes to `conversations` table
    - Already has `front_conversation_id` and `front_inbox_id` - perfect!
    
  4. New Index
    - Add index on `requests.status` for efficient filtering
    - Add index on `requests.profile_id` for user lookups
    - Add index on `messages.request_id` for fast message retrieval
    
  5. Security
    - RLS policies already exist on relevant tables
    - Ensure authenticated users can only access their own data
    
  6. Notes
    - The `requests.entities` JSONB field will store structured travel data (origin, destination, dates, etc.)
    - The `requests.status` field will track: 'new', 'collecting', 'offered', 'awaiting_approval', 'booked', 'failed', 'canceled'
    - The `messages` table will store chat history with `request_id` linking to parent request
    - Results will stream in realtime via Supabase subscriptions
*/

-- Add new columns to requests table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'results'
  ) THEN
    ALTER TABLE requests ADD COLUMN results jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'front_conversation_id'
  ) THEN
    ALTER TABLE requests ADD COLUMN front_conversation_id text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_profile_id ON requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- Ensure RLS is enabled on requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;

-- Create RLS policies for requests
CREATE POLICY "Users can view own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (profile_id IN (
    SELECT id FROM profiles WHERE id = (
      SELECT id FROM profiles WHERE member_id = auth.uid() LIMIT 1
    )
  ));

CREATE POLICY "Users can insert own requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE id = (
      SELECT id FROM profiles WHERE member_id = auth.uid() LIMIT 1
    )
  ));

CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (profile_id IN (
    SELECT id FROM profiles WHERE id = (
      SELECT id FROM profiles WHERE member_id = auth.uid() LIMIT 1
    )
  ))
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE id = (
      SELECT id FROM profiles WHERE member_id = auth.uid() LIMIT 1
    )
  ));

-- Ensure RLS is enabled on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages for own requests" ON messages;
DROP POLICY IF EXISTS "Users can insert messages for own requests" ON messages;

-- Create RLS policies for messages
CREATE POLICY "Users can view messages for own requests"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN channels ch ON ch.id = c.channel_id
      JOIN profiles p ON p.id = ch.profile_id
      WHERE p.id = (
        SELECT id FROM profiles WHERE member_id = auth.uid() LIMIT 1
      )
    )
  );

CREATE POLICY "Users can insert messages for own requests"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN channels ch ON ch.id = c.channel_id
      JOIN profiles p ON p.id = ch.profile_id
      WHERE p.id = (
        SELECT id FROM profiles WHERE member_id = auth.uid() LIMIT 1
      )
    )
  );

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for requests table
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();