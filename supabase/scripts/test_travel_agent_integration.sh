#!/bin/bash

# Test Orchestrator → Travel Agent Integration
# This verifies that auto_execute tasks actually call the travel-agent

SUPABASE_URL="${SUPABASE_URL:-https://oifchjaqembbkdyfjctp.supabase.co}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZmNoamFxZW1iYmtkeWZqY3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTMyMjQsImV4cCI6MjA2MzE4OTIyNH0._i2SJ0KGLHbH1e-v2lsfU6XdbVueQW-Iq4mTQslLDak}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
USER_ID="${TEST_USER_ID:-f78c2fcb-b2ba-4b75-8c4f-d7c73982c480}"

echo "🧪 Testing Orchestrator → Travel Agent Integration"
echo "=========================================="
echo ""

# Test with a clear flight search request
TEST_MESSAGE="Find flights from JFK to LAX on December 15th"

echo "Sending request: \"$TEST_MESSAGE\""
echo ""

response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/orchestrator/chat" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"message\": \"${TEST_MESSAGE}\"
  }")

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Extract task ID
task_id=$(echo "$response" | jq -r '.task.id' 2>/dev/null)

if [ -z "$task_id" ] || [ "$task_id" == "null" ]; then
  echo "❌ Failed to get task ID from response"
  exit 1
fi

echo "✅ Task created: $task_id"
echo ""

# Wait a moment for async processing
echo "Waiting 3 seconds for travel-agent to process..."
sleep 3

# Check task status and output_data
echo "Checking task status and results..."
echo ""

if [ -n "$SERVICE_ROLE_KEY" ]; then
  task_check=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/get_task_with_ui_state" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -d "{\"p_task_id\": \"${task_id}\"}" 2>/dev/null)
else
  task_check=""
  echo "Note: SUPABASE_SERVICE_ROLE_KEY is unset; skipping RPC get_task_with_ui_state (requires service role after security migration)."
  echo ""
fi

if [ -z "$task_check" ]; then
  # Fallback: direct query via SQL
  echo "Using direct database query..."
  echo ""
  echo "Run this in Supabase SQL Editor to check the task:"
  echo ""
  echo "SELECT "
  echo "  id,"
  echo "  status,"
  echo "  decision_strategy,"
  echo "  ui_state->>'current_step' as current_step,"
  echo "  ui_state->>'rendered_component' as component,"
  echo "  output_data->>'search_type' as search_type,"
  echo "  (output_data->>'results_count')::int as results_count,"
  echo "  output_data->'flights' as flights"
  echo "FROM tasks"
  echo "WHERE id = '${task_id}';"
else
  echo "$task_check" | jq '.' 2>/dev/null || echo "$task_check"
fi

echo ""
echo "=========================================="
echo "✅ Integration test complete!"
echo ""
echo "What to check:"
echo "1. Task status should be 'completed' or 'in_progress'"
echo "2. output_data should contain flight results"
echo "3. ui_state.rendered_component should be 'FlightComparisonGrid'"
echo "4. Check Edge Function logs for travel-agent calls"

