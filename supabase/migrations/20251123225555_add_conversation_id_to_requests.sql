/*
  # Add conversation_id to requests table

  1. Changes
    - Add conversation_id column to requests table
    - Add foreign key constraint to conversations table
    - Add index for faster lookups

  2. Purpose
    - Link requests directly to conversations for portal chat
    - Enable better tracking of concierge requests
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE requests ADD COLUMN conversation_id uuid REFERENCES concierge_conversations(id);
    CREATE INDEX IF NOT EXISTS idx_requests_conversation_id ON requests(conversation_id);
  END IF;
END $$;