# Fix Tasks Status Constraint - Troubleshooting

## Problem

When running the migration `20251202_fix_tasks_status_constraint.sql`, you get:
```
ERROR: 23514: check constraint "tasks_status_check" of relation "tasks" is violated by some row
```

This means there are existing tasks in your database with status values that don't match the new constraint.

## Solution

The updated migration now:
1. **Finds and fixes invalid statuses** before applying the constraint
2. Maps invalid values to valid ones:
   - `'processing'` → `'in_progress'`
   - `'cancelled'` → `'completed'`
   - `'done'` → `'completed'`
   - `'error'` → `'failed'`
   - `'escalated'` → `'awaiting_human'`
   - Any other invalid value → `'pending'`
3. **Drops old constraints**
4. **Applies new constraint**
5. **Verifies success**

## How to Check Current Status Values

Before running the migration, you can check what status values exist:

```sql
-- See all unique status values
SELECT status, COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY count DESC;

-- See rows with potentially invalid statuses
SELECT id, status, title, created_at
FROM tasks
WHERE status IS NOT NULL
  AND status NOT IN ('pending', 'in_progress', 'awaiting_human', 'completed', 'failed')
ORDER BY created_at DESC;
```

## Valid Status Values (MVP Spec)

After the migration, only these statuses are allowed:
- `'pending'` - Task is waiting to start
- `'in_progress'` - Task is currently being processed
- `'awaiting_human'` - Task needs human review/input
- `'completed'` - Task finished successfully
- `'failed'` - Task encountered an error

## Running the Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/migrations/20251202_fix_tasks_status_constraint.sql`
3. Paste and run
4. Check the output for notices about how many rows were updated

## Manual Fix (If Needed)

If you want to manually fix specific rows before running the migration:

```sql
-- See what needs fixing
SELECT id, status, title
FROM tasks
WHERE status NOT IN ('pending', 'in_progress', 'awaiting_human', 'completed', 'failed')
  AND status IS NOT NULL;

-- Fix specific rows (example)
UPDATE tasks
SET status = 'in_progress'
WHERE status = 'processing';

-- Or set all invalid to pending
UPDATE tasks
SET status = 'pending'
WHERE status IS NOT NULL
  AND status NOT IN ('pending', 'in_progress', 'awaiting_human', 'completed', 'failed');
```

