-- ============================================================================
-- Fix Tasks Status Constraint
-- Purpose: Update status constraint to match MVP spec and allow all required statuses
-- ============================================================================

-- Step 1: Drop the constraint FIRST (before updating rows)
-- This allows us to update rows without constraint violations

-- Drop by known names
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check1;

-- Find and drop any existing status check constraint
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'tasks'::regclass
    AND contype = 'c'
    AND conname LIKE '%status%';
  
  -- Drop it if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- Step 2: Now fix any existing rows with invalid status values
-- (Constraint is dropped, so we can update freely)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Count invalid statuses
  SELECT COUNT(*) INTO invalid_count
  FROM tasks
  WHERE status IS NOT NULL
    AND status NOT IN ('pending', 'in_progress', 'awaiting_human', 'completed', 'failed');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'Found % rows with invalid status values. Updating...', invalid_count;
    
    -- Map invalid statuses to valid ones
    UPDATE tasks
    SET status = CASE
      -- Map common invalid values to valid ones
      WHEN status = 'processing' THEN 'in_progress'
      WHEN status = 'cancelled' THEN 'completed'
      WHEN status = 'done' THEN 'completed'
      WHEN status = 'error' THEN 'failed'
      WHEN status = 'escalated' THEN 'awaiting_human'
      -- Default to 'pending' for any other invalid value
      ELSE 'pending'
    END
    WHERE status IS NOT NULL
      AND status NOT IN ('pending', 'in_progress', 'awaiting_human', 'completed', 'failed');
    
    RAISE NOTICE 'Updated % rows to valid status values', invalid_count;
  ELSE
    RAISE NOTICE 'No invalid status values found. All rows are valid.';
  END IF;
END $$;

-- Step 4: Add new constraint matching MVP spec
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IS NULL OR status IN ('pending', 'in_progress', 'awaiting_human', 'completed', 'failed'));

-- Step 5: Add comment
COMMENT ON COLUMN tasks.status IS 'Task status: pending, in_progress, awaiting_human, completed, failed';

-- Step 6: Verify the constraint was applied
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'tasks'::regclass
      AND conname = 'tasks_status_check'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ Successfully applied tasks_status_check constraint';
  ELSE
    RAISE WARNING '⚠️  Constraint tasks_status_check was not created';
  END IF;
END $$;

