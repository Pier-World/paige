# 🧪 Quick Start: Test Orchestrator

## Step 1: Get Your User ID

Run this in Supabase SQL Editor:

```sql
SELECT id, email FROM auth.users LIMIT 1;
```

Copy the `id` - that's your `USER_ID`.

## Step 2: Set Environment Variables

```bash
export SUPABASE_URL="https://oifchjaqembbkdyfjctp.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZmNoamFxZW1iYmtkeWZqY3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTMyMjQsImV4cCI6MjA2MzE4OTIyNH0._i2SJ0KGLHbH1e-v2lsfU6XdbVueQW-Iq4mTQslLDak"  # From Supabase Dashboard → Settings → API
export TEST_USER_ID="f78c2fcb-b2ba-4b75-8c4f-d7c73982c480"       # From Step 1
```

Or edit `supabase/scripts/test_orchestrator.sh` directly.

## Step 3: Run Test Script

```bash
./supabase/scripts/test_orchestrator.sh
```

This will test 8 message variations and show:
- ✅ Intent classification
- ✅ Confidence scores
- ✅ Execution strategies
- ✅ Task IDs

## Step 4: Verify in Database

Run this in Supabase SQL Editor (replace `your-user-uuid`):

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
  (ui_state->>'progress')::int as progress,
  created_at
FROM tasks
WHERE user_id = 'f78c2fcb-b2ba-4b75-8c4f-d7c73982c480'
ORDER BY created_at DESC
LIMIT 5;
```

## Step 5: Check UI State

```sql
-- View full UI state for latest task
SELECT 
  id,
  jsonb_pretty(ui_state) as ui_state,
  jsonb_pretty(llm_reasoning) as reasoning
FROM tasks
WHERE user_id = 'f78c2fcb-b2ba-4b75-8c4f-d7c73982c480'
ORDER BY created_at DESC
LIMIT 1;
```

## Manual Test (Alternative)

If you prefer to test manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-uuid",
    "message": "Looking for flights to Miami"
  }'
```

## What to Look For

### ✅ Success Indicators

1. **Task Created**: Check `tasks` table - should see new row
2. **UI State**: `ui_state` should have `current_step`, `progress`, `rendered_component`
3. **Confidence**: `confidence_score` should be 0.7-0.95 for clear requests
4. **Strategy**: `decision_strategy` should be set (auto_execute, preview_confirm, etc.)
5. **Intent**: Should classify as `travel_search_flights` for flight requests
6. **Results**: If travel agent works, `output_data` should contain flight results

### ⚠️ Common Issues

**No task created?**
- Check Edge Function logs in Supabase Dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function environment

**Low confidence?**
- Check if `OPENAI_API_KEY` is set
- Message might be too vague

**Travel agent not called?**
- Check intent classification result
- Verify `intent_type` starts with 'travel'

## Full Verification Script

For comprehensive verification, run:

```sql
-- In Supabase SQL Editor
-- Copy contents of: supabase/scripts/verify_task_creation.sql
-- Replace 'your-user-uuid' with your actual user ID
```

This will show:
- Latest tasks
- UI state structure
- LLM reasoning
- Confidence distribution
- Strategy distribution
- Idempotency check
- Task-conversation linking
- Summary statistics

## Next Steps

Once testing passes:
1. ✅ Verify tasks are created correctly
2. ✅ Check UI state structure
3. ✅ Verify confidence scores and strategies
4. ⏭️ Create frontend TaskCard component
5. ⏭️ Set up real-time subscriptions

