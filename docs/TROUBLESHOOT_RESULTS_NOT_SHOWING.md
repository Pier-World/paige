# Troubleshooting: Results Not Showing After Conversation

## Problem

After answering clarifying questions in the conversational interface, the system doesn't show flight search results even though it says "Perfect! Let me search for the best options for you..."

## Root Causes Identified

### 1. Real-time Updates Not Propagating
**Issue:** `ConversationalTaskCard` wasn't listening to real-time task updates.

**Fix:** ✅ Added real-time subscription to `ConversationalTaskCard` that:
- Listens for task updates
- Shows new questions when they appear
- Shows results when `rendered_component === 'FlightComparisonGrid'`
- Shows completion messages

### 2. Task State Overwriting
**Issue:** Orchestrator was overwriting task state that travel-agent had already set.

**Fix:** ✅ Modified orchestrator to:
- Check if travel-agent already updated the task
- Preserve travel-agent's direct updates (it sets `rendered_component` and `output_data`)
- Only merge updates, don't overwrite

### 3. Follow-up Detection Window Too Short
**Issue:** 5-minute window for detecting follow-up messages was too short.

**Fix:** ✅ Increased to 10 minutes

## How It Works Now

1. **User answers question** → `ConversationalTaskCard` sends to orchestrator
2. **Orchestrator detects follow-up** → Finds existing clarifying task
3. **Re-classifies intent** → With new information
4. **Determines strategy** → Should be `auto_execute` if all info gathered
5. **Calls travel-agent** → Which searches flights
6. **Travel-agent updates task** → Sets `rendered_component: 'FlightComparisonGrid'` and `output_data.flights`
7. **Orchestrator preserves updates** → Doesn't overwrite travel-agent's changes
8. **Real-time subscription** → `ConversationalTaskCard` sees update and shows results message
9. **EnhancedTaskCard** → Renders `FlightComparisonGrid` component with results

## Testing

1. Send: "Looking for flights to Miami"
2. Answer clarifying questions
3. Verify:
   - ✅ New questions appear in chat
   - ✅ "Got it! Processing..." appears after each answer
   - ✅ After all questions answered, "I found X flight options..." appears
   - ✅ `FlightComparisonGrid` component renders below chat
   - ✅ Results are visible and clickable

## If Still Not Working

### Check Function Logs
1. Go to Supabase Dashboard → Edge Functions → orchestrator → Logs
2. Look for:
   - "Orchestrator processing" (should show follow-up detection)
   - "Travel agent error" (if search fails)
   - Task update logs

### Check Task State in Database
```sql
SELECT 
  id,
  status,
  decision_strategy,
  ui_state->>'rendered_component' as component,
  output_data->>'flights' as flights_count
FROM tasks
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

### Verify search-flights Function
The travel-agent calls `search-flights` function. Check:
- Is it deployed?
- Does it return results?
- Are there API key issues?

### Check Real-time Subscription
In browser console, look for:
- "Real-time subscription active for task: [id]"
- "Task updated via real-time: [data]"

## Next Steps After Fix

Once results are showing:
1. ✅ Test full flow end-to-end
2. ✅ Add error handling for API failures
3. ✅ Improve flight result display
4. ✅ Add booking capability
5. 🔄 Set up Google Calendar sync
6. 🔄 Set up Gmail sync

