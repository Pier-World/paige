# Testing Orchestrator → Travel Agent Flow

## Quick Test

### Prerequisites

1. Set environment variables:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export TEST_USER_ID="your-user-uuid"
   ```

2. Or edit the test script directly:
   ```bash
   nano supabase/scripts/test_orchestrator.sh
   ```

### Run Tests

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
    "userId": "user-uuid",
    "message": "Find flights from NYC to SF next Tuesday"
  }'
```

**Expected:**
- Intent: `travel`
- Confidence: > 0.8
- Routes to travel-agent
- Returns flight search results

### Test 2: Variation - "Looking for flights"

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "message": "Looking for flights to Miami"
  }'
```

### Test 3: Variation - "I need tickets"

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "message": "I need tickets to Miami"
  }'
```

### Test 4: Variation - "I need to fly"

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "message": "I need to fly to miami"
  }'
```

## What to Check

1. **Intent Classification**
   - Should identify as `travel` for all variations
   - Confidence should be > 0.7 for clear requests

2. **Parameter Extraction**
   - Origin (if provided)
   - Destination (should extract "Miami" or "miami")
   - Date (if provided)
   - Passengers (defaults to 1)

3. **Agent Routing**
   - Should route to `travel-agent`
   - Travel agent should receive parameters

4. **Response Quality**
   - Should return flight search results
   - Should rank by user preferences
   - Should handle missing parameters gracefully

## Debugging

### Check Logs

In Supabase Dashboard → Edge Functions → Logs:
- Look for orchestrator logs
- Check for classification results
- Verify agent routing

### Check Database

```sql
-- Check tasks created
SELECT * FROM tasks 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check conversations
SELECT * FROM conversations 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Issues

### Issue: Intent not classified as "travel"
- **Fix**: Improve GPT-4 prompt in `classifyIntent` function
- Add more examples to system prompt

### Issue: Low confidence
- **Fix**: Provide more context in user message
- Or adjust confidence thresholds

### Issue: Missing parameters
- **Fix**: Travel agent should ask for clarification
- Or use user preferences as defaults

### Issue: Travel agent not found
- **Fix**: Ensure travel-agent function is deployed
- Check function URL in orchestrator

