# Troubleshooting Guide

## Issue: Travel Agent Internal Server Error

### Symptoms
- Message disappears when sent
- No task component appears
- Error in orchestrator logs: "Travel agent error: Internal Server Error"
- Nothing shows in browser console

### Root Cause
The travel-agent is trying to call the `search-flights` function, which may:
1. Not be deployed
2. Be returning an error
3. Have incorrect parameters

### Fixes Applied

1. **Better Error Handling in Orchestrator**
   - Now catches and returns detailed error messages
   - Includes error details in response

2. **Better Error Handling in Travel Agent**
   - Handles missing `search-flights` function gracefully
   - Returns empty results instead of failing if function doesn't exist
   - Provides detailed error messages

3. **Frontend Error Display**
   - Added loading state (`sendingMessage`)
   - Added error message display
   - Disabled input while processing
   - Shows error messages to user

### Next Steps

1. **Check if search-flights function exists:**
   ```bash
   # In Supabase Dashboard → Edge Functions
   # Check if "search-flights" function is deployed
   ```

2. **If search-flights doesn't exist:**
   - Either deploy it, or
   - The travel-agent will now return empty results instead of failing
   - You can test with a simple message first

3. **Test the fix:**
   - Send a message like "Find flights to Miami"
   - You should now see:
     - Loading indicator
     - Error message if something fails
     - Task created even if search fails

### Testing

1. **Test with search-flights deployed:**
   ```bash
   # Should work normally
   ```

2. **Test without search-flights:**
   ```bash
   # Should return empty results, not fail
   ```

3. **Check browser console:**
   - Should see error messages if something fails
   - Should see task creation logs

### Common Issues

#### Issue: "search-flights function not found"
**Solution:** Deploy the search-flights function or update travel-agent to handle missing function gracefully (already done)

#### Issue: "Travel agent error: Bad Request"
**Solution:** Check that parameters are being passed correctly. The travel-agent now validates parameters better.

#### Issue: "No task appears"
**Solution:** 
- Check browser console for errors
- Check that user is authenticated
- Check that orchestrator is returning success: true

### Debugging Steps

1. **Check orchestrator logs:**
   - Supabase Dashboard → Edge Functions → orchestrator → Logs
   - Look for error messages

2. **Check travel-agent logs:**
   - Supabase Dashboard → Edge Functions → travel-agent → Logs
   - Look for search-flights call errors

3. **Check browser console:**
   - Open DevTools → Console
   - Look for fetch errors or API errors

4. **Check network tab:**
   - Open DevTools → Network
   - Look for orchestrator/chat request
   - Check response status and body

### Expected Behavior After Fix

1. **User sends message:**
   - Input shows loading state
   - Message doesn't disappear immediately

2. **If successful:**
   - Task appears on Tasks page
   - Loading indicator disappears
   - No error message

3. **If error:**
   - Error message appears below input
   - Loading indicator disappears
   - Task may still be created (with error status)

4. **In all cases:**
   - User sees feedback
   - No silent failures
   - Errors are logged and displayed

