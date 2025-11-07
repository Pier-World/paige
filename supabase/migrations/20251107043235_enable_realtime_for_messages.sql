/*
  # Enable Realtime for Messages Table
  
  1. Changes
    - Add messages table to supabase_realtime publication
    - This enables live updates when messages are inserted/updated
    - Critical for portal chat functionality
  
  2. Security
    - Realtime respects existing RLS policies
    - Users can only see messages they're authorized to access
*/

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
