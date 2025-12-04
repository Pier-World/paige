# Fix RLS Policy for Tasks - Quick Guide

## Problem

The "Task not found" error is caused by an outdated RLS (Row Level Security) policy on the `tasks` table. The old policy checks for `request_id` which doesn't exist in the new task-first architecture.

## Solution

Run this migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251202_fix_tasks_rls_policy.sql
```

This will:
1. Drop old policies that use `request_id`
2. Create new policies using `user_id = auth.uid()`
3. Ensure service role has full access

## After Running Migration

1. **Refresh your browser** - The task should now be visible
2. **Test again** - Send a message and verify the task card appears
3. **Check console** - Should see "Real-time subscription active" message

## Verification

After running the migration, verify in Supabase SQL Editor:

```sql
-- Check RLS policies on tasks
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks';
```

You should see policies like:
- "Users can view own tasks" (SELECT)
- "Users can insert own tasks" (INSERT)
- "Users can update own tasks" (UPDATE)
- "Users can delete own tasks" (DELETE)
- "Service role can manage all tasks" (ALL)

## Expected Behavior After Fix

1. **Send message** → Task created
2. **Task card appears** → Shows "Loading task..." briefly
3. **Task loads** → Shows full task details
4. **Real-time updates** → Task updates automatically as it processes
5. **No "Task not found"** → Task is accessible via RLS

## Debugging

If still seeing "Task not found":

1. **Check task exists in database:**
   ```sql
   SELECT id, user_id, title, status 
   FROM tasks 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

2. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'tasks';
   ```
   Should show `rowsecurity = true`

3. **Check your user ID matches:**
   ```sql
   SELECT auth.uid() as current_user_id;
   ```
   Compare with task's `user_id`

4. **Check browser console** for detailed error messages

