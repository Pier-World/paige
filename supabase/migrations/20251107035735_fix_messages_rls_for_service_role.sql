/*
  # Fix Messages RLS for Service Role Access
  
  1. Changes
    - Add policy to allow service role (edge functions) to read all messages
    - Add policy to allow service role to insert messages (for AI responses)
    - This enables the orchestrator edge function to read user messages and respond
  
  2. Security
    - Service role policies are separate from user policies
    - Users can still only access their own messages
    - Edge functions can access all messages (needed for orchestrator)
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can read all messages" ON messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON messages;
DROP POLICY IF EXISTS "Service role can read all requests" ON requests;
DROP POLICY IF EXISTS "Service role can update all requests" ON requests;

-- Allow service role to read all messages
CREATE POLICY "Service role can read all messages"
  ON messages
  FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to insert messages (for AI responses)
CREATE POLICY "Service role can insert messages"
  ON messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to read all requests
CREATE POLICY "Service role can read all requests"
  ON requests
  FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to update all requests
CREATE POLICY "Service role can update all requests"
  ON requests
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
