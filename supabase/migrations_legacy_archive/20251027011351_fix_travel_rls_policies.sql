/*
  # Fix Travel Concierge RLS Policies
  
  1. Overview
    Fix RLS policies to work with the correct user ID mapping
    
  2. Changes
    - Update RLS policies to use auth.uid() directly since profiles.id matches members.id
    - Simplify channel and conversation lookups
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;
DROP POLICY IF EXISTS "Users can view messages for own requests" ON messages;
DROP POLICY IF EXISTS "Users can insert messages for own requests" ON messages;

-- Create simplified RLS policies for requests
CREATE POLICY "Users can view own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create simplified RLS policies for messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN channels ch ON ch.id = c.channel_id
      JOIN profiles p ON p.id = ch.profile_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN channels ch ON ch.id = c.channel_id
      JOIN profiles p ON p.id = ch.profile_id
      WHERE p.id = auth.uid()
    )
  );

-- Enable RLS on channels if not already enabled
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Drop existing channel policies
DROP POLICY IF EXISTS "Users can view own channels" ON channels;
DROP POLICY IF EXISTS "Users can insert own channels" ON channels;

-- Create RLS policies for channels
CREATE POLICY "Users can view own channels"
  ON channels FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Enable RLS on conversations if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing conversation policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;

-- Create RLS policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    channel_id IN (
      SELECT id FROM channels WHERE profile_id = auth.uid()
    )
  );

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());