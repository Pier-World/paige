/*
  # Create Concierge Conversations Schema

  1. New Tables
    - `concierge_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Auto-generated title from first message
      - `last_message_at` (timestamptz) - For sorting
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_archived` (boolean) - For soft delete/archive
      
    - `concierge_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to concierge_conversations)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `metadata` (jsonb) - For savings, checklists, etc.
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own conversations and messages
    - Add policies for CRUD operations

  3. Indexes
    - Add index on user_id and last_message_at for efficient querying
    - Add index on conversation_id for messages

  4. Functions
    - Auto-delete conversations older than 30 days
*/

-- Create concierge_conversations table
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  last_message_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_archived boolean DEFAULT false NOT NULL
);

-- Create concierge_messages table
CREATE TABLE IF NOT EXISTS concierge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES concierge_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_messages ENABLE ROW LEVEL SECURITY;

-- Policies for concierge_conversations
CREATE POLICY "Users can view own conversations"
  ON concierge_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON concierge_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON concierge_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON concierge_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for concierge_messages
CREATE POLICY "Users can view messages in their conversations"
  ON concierge_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM concierge_conversations
      WHERE concierge_conversations.id = concierge_messages.conversation_id
      AND concierge_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON concierge_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM concierge_conversations
      WHERE concierge_conversations.id = concierge_messages.conversation_id
      AND concierge_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON concierge_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM concierge_conversations
      WHERE concierge_conversations.id = concierge_messages.conversation_id
      AND concierge_conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM concierge_conversations
      WHERE concierge_conversations.id = concierge_messages.conversation_id
      AND concierge_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON concierge_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM concierge_conversations
      WHERE concierge_conversations.id = concierge_messages.conversation_id
      AND concierge_conversations.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_last_message 
  ON concierge_conversations(user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON concierge_messages(conversation_id, created_at ASC);

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE concierge_conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update last_message_at
DROP TRIGGER IF EXISTS update_conversation_timestamp ON concierge_messages;
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON concierge_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to auto-delete old conversations (30 days)
CREATE OR REPLACE FUNCTION delete_old_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM concierge_conversations
  WHERE last_message_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
