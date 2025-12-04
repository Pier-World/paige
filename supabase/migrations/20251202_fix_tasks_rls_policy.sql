-- ============================================================================
-- Fix Tasks RLS Policy for Task-First Architecture
-- Purpose: Update RLS policy to use user_id instead of request_id
-- ============================================================================

-- Drop old policy that uses request_id (doesn't exist in new architecture)
DROP POLICY IF EXISTS "Users can view tasks for their requests" ON tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create new policies using user_id (matches MVP spec)
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role still has full access (for backend operations)
-- This policy should already exist, but ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Service role can manage all tasks'
  ) THEN
    CREATE POLICY "Service role can manage all tasks"
      ON tasks FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Verify RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

