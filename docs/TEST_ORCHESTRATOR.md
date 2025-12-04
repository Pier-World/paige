# Testing the Task-First Orchestrator

## Quick Test

### Prerequisites

1. **Set Environment Variables** (or edit the script):
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export TEST_USER_ID="your-user-uuid"
   ```

2. **Get Your User ID**:
   ```sql
   -- In Supabase SQL Editor
   SELECT id, email FROM auth.users LIMIT 1;
   ```

### Run Automated Test

```bash
chmod +x supabase/scripts/test_orchestrator.sh
./supabase/scripts/test_orchestrator.sh
```

## Manual Testing

### Test 1: Basic Flight Request

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-uuid",
    "message": "Find flights from NYC to SF next Tuesday"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "task": {
    "id": "task-uuid",
    "status": "processing" | "completed",
    "ui_state": {
      "current_step": "results_ready",
      "progress": 100,
      "rendered_component": "FlightComparisonGrid"
    },
    "confidence_score": 0.85,
    "risk_level": "low",
    "decision_strategy": "preview_confirm" | "auto_execute"
  },
  "response": "I found 25 flight options...",
  "intent": "travel_search_flights",
  "confidence": 0.85,
  "strategy": "preview_confirm"
}
```

### Test 2: Variation - "Looking for flights"

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-uuid",
    "message": "Looking for flights to Miami"
  }'
```

### Test 3: Variation - "I need tickets"

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-uuid",
    "message": "I need tickets to Miami"
  }'
```

### Test 4: Variation - "I need to fly"

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-uuid",
    "message": "I need to fly to miami"
  }'
```

## Verify in Database

### Check Task Creation

```sql
-- View latest tasks with enhanced fields
SELECT 
  id,
  title,
  status,
  confidence_score,
  risk_level,
  decision_strategy,
  ui_state->>'current_step' as current_step,
  ui_state->>'rendered_component' as component,
  ui_state->>'progress' as progress,
  created_at
FROM tasks
WHERE user_id = 'your-user-uuid'
ORDER BY created_at DESC
LIMIT 5;
```

### Check UI State Structure

```sql
-- View full UI state for a specific task
SELECT 
  id,
  ui_state,
  llm_reasoning,
  output_data
FROM tasks
WHERE id = 'task-uuid-here';
```

### Check Idempotency

```sql
-- Test that duplicate messages create same task
SELECT 
  idempotency_key,
  COUNT(*) as count
FROM tasks
WHERE user_id = 'your-user-uuid'
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
-- Should return 0 rows (no duplicates)
```

### Check Conversations Linked to Tasks

```sql
-- View conversations with task references
SELECT 
  c.id,
  c.role,
  c.content,
  c.related_task_id,
  t.status as task_status,
  t.confidence_score
FROM conversations c
LEFT JOIN tasks t ON t.id = c.related_task_id
WHERE c.user_id = 'your-user-uuid'
ORDER BY c.created_at DESC
LIMIT 10;
```

## What to Verify

### ✅ Task Creation
- [ ] Task created immediately with `status: 'processing'`
- [ ] `ui_state` has `current_step: 'understanding_request'` and `progress: 10`
- [ ] `idempotency_key` is set (prevents duplicates)

### ✅ Intent Classification
- [ ] `confidence_score` is between 0 and 1
- [ ] `risk_level` is 'low', 'medium', or 'high'
- [ ] `llm_reasoning` contains intent_type, reasoning, assumptions
- [ ] All variations ("looking for flights", "need tickets", "fly to") classified as travel

### ✅ Execution Strategy
- [ ] `decision_strategy` matches confidence + risk:
  - High confidence (0.9+) + low risk → `auto_execute`
  - Medium confidence (0.7+) + medium risk → `preview_confirm`
  - Lower confidence → `clarify` or `escalate`

### ✅ UI State Updates
- [ ] `ui_state.current_step` progresses: understanding → executing → results_ready
- [ ] `ui_state.progress` increases: 10 → 40 → 100
- [ ] `ui_state.rendered_component` is set (e.g., 'FlightComparisonGrid')
- [ ] `ui_state.results_preview` contains flight data

### ✅ Context Enrichment
- [ ] Origin auto-filled from home airport (if not provided)
- [ ] Return date inferred from calendar (if not provided)
- [ ] Preferred airlines used from profile
- [ ] Assumptions shown in `ui_state.assumptions`

### ✅ Travel Agent Integration
- [ ] Travel agent receives enriched parameters
- [ ] Results are ranked by preferences
- [ ] AI recommendation reason is generated
- [ ] Task updated with `output_data` containing flights

## Debugging

### Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → Logs
2. Filter by `orchestrator`
3. Look for:
   - Intent classification results
   - Strategy decisions
   - Agent routing
   - Errors

### Common Issues

#### Issue: Task not created
- **Check**: Edge function logs for errors
- **Fix**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set

#### Issue: Low confidence scores
- **Check**: OpenAI API key is set
- **Fix**: Improve prompt or check message clarity

#### Issue: Travel agent not called
- **Check**: Intent classification result
- **Fix**: Verify intent_type starts with 'travel'

#### Issue: UI state not updating
- **Check**: Task updates in database
- **Fix**: Verify real-time subscriptions (if using frontend)

## Test Scenarios

### Scenario 1: High Confidence Request
**Message**: "Find flights from JFK to SFO on December 15th"

**Expected**:
- Confidence: > 0.9
- Risk: low
- Strategy: `auto_execute` or `preview_confirm`
- Task completes with flight results

### Scenario 2: Vague Request
**Message**: "I need to travel somewhere"

**Expected**:
- Confidence: 0.4-0.6
- Strategy: `clarify`
- Task status: `awaiting_human`
- UI state has clarifying questions

### Scenario 3: Financial Request (High Risk)
**Message**: "Book the most expensive first class flight to Dubai"

**Expected**:
- Confidence: may be high
- Risk: high
- Strategy: `preview_confirm` or `escalate`
- Requires confirmation before booking

### Scenario 4: Duplicate Message
**Message**: Send same message twice quickly

**Expected**:
- First message creates task
- Second message returns same task (idempotency)
- No duplicate tasks created

## Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. ✅ Check database for proper task creation
3. ✅ Verify UI state structure
4. ⏭️ Create frontend TaskCard component
5. ⏭️ Create FlightComparisonGrid component
6. ⏭️ Set up real-time subscriptions

