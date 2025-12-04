# Timeout and Loading State Fix

## Problem
After recent changes, all pages were experiencing timeouts and getting stuck in loading states. Every action and page was timing out after 10 seconds.

## Root Cause Analysis

The issue had multiple contributing factors:

1. **Improper Timeout Handling**: The timeout was set but not properly cleared in error cases, and the timeout was too aggressive (10 seconds)
2. **Sequential Query Execution**: Queries were running sequentially, so if one hung, all subsequent queries would wait
3. **No Connection Validation**: No initial connection test to catch Supabase connectivity issues early
4. **Timeout Race Condition**: The timeout would fire and clear loading state, but queries might still be running in the background

## The Fix

### 1. Improved Timeout Implementation
- Changed from `setTimeout` that just clears loading to `Promise.race()` pattern
- This ensures queries either complete OR timeout, but not both
- Increased timeout from 10 seconds to 15 seconds to be less aggressive
- Properly clear timeout in all code paths

### 2. Parallel Query Execution
- Changed sequential queries to `Promise.all()` for parallel execution
- This means if one query is slow, others can still complete
- Reduces total load time significantly

### 3. Connection Validation
- Added quick connection test before loading data
- If Supabase connection fails, we fail fast instead of waiting for timeout
- Provides better error messages for debugging

### 4. Better Error Handling
- Each query now handles its own errors independently
- If one query fails, others can still succeed
- More granular error logging

## Implementation Details

### Before (HomePage.tsx)
```typescript
const timeoutId = setTimeout(() => {
  setLoading(false);
}, 10000);

// Sequential queries
const { data: tasks } = await supabase.from('tasks')...
const { data: events } = await supabase.from('calendar_events')...
// ... more sequential queries

clearTimeout(timeoutId); // Only if no error
```

### After (HomePage.tsx)
```typescript
// Connection test first
const { error: testError } = await supabase.from('tasks').select('id').limit(1);
if (testError) {
  setLoading(false);
  return;
}

// Parallel queries with proper timeout
const timeoutPromise = new Promise<void>((resolve) => {
  timeoutId = setTimeout(() => resolve(), 15000);
});

const queriesPromise = Promise.all([
  supabase.from('tasks')...,
  supabase.from('calendar_events')...,
  supabase.from('entities')...,
  supabase.from('notifications')...,
]);

const result = await Promise.race([queriesPromise, timeoutPromise]);
if (timeoutId) clearTimeout(timeoutId);
```

## Files Changed

1. **src/pages/HomePage.tsx**
   - Added connection test
   - Changed to parallel queries with Promise.all
   - Improved timeout handling with Promise.race

2. **src/pages/CalendarPage.tsx**
   - Added connection test
   - Improved timeout handling with Promise.race

3. **src/pages/TasksPage.tsx**
   - Improved timeout handling with Promise.race

4. **src/pages/TravelPage.tsx**
   - Improved timeout handling with Promise.race

## Testing

After this fix:
1. Pages should load faster (parallel queries)
2. Timeouts should be less frequent (15 seconds instead of 10)
3. Better error messages if connection fails
4. If queries do timeout, loading state clears properly

## Troubleshooting

If timeouts still occur:

1. **Check Supabase Connection**:
   - Open browser DevTools → Network tab
   - Look for requests to `*.supabase.co`
   - Check if they're completing or hanging

2. **Check RLS Policies**:
   - Verify user has proper permissions
   - Check Supabase Dashboard → Authentication → Policies

3. **Check Database Performance**:
   - Look at Supabase Dashboard → Database → Query Performance
   - Check for slow queries or locks

4. **Check Browser Console**:
   - Look for specific error messages
   - Check for CORS errors
   - Check for authentication errors

## Additional Notes

- The timeout is now a safety net, not the primary mechanism
- Connection test catches issues early
- Parallel queries improve performance
- Each page handles its own timeout independently

