#!/bin/bash

# Test Task-First Orchestrator
# This script tests various message variations and verifies task creation

SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"
USER_ID="${TEST_USER_ID:-your-user-id}"

echo "🧪 Testing Task-First Orchestrator"
echo "=========================================="
echo ""
echo "Supabase URL: $SUPABASE_URL"
echo "User ID: $USER_ID"
echo ""

# Check if required vars are set
if [[ "$SUPABASE_URL" == "https://your-project.supabase.co" ]] || \
   [[ "$ANON_KEY" == "your-anon-key" ]] || \
   [[ "$USER_ID" == "your-user-id" ]]; then
  echo "⚠️  WARNING: Please set environment variables:"
  echo "   export SUPABASE_URL=\"https://your-project.supabase.co\""
  echo "   export SUPABASE_ANON_KEY=\"your-anon-key\""
  echo "   export TEST_USER_ID=\"your-user-uuid\""
  echo ""
  echo "Or edit this script to set them directly."
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Test messages with various phrasings
TEST_MESSAGES=(
  "Find flights from NYC to SF next Tuesday"
  "Looking for flights to Miami"
  "I need tickets to Miami"
  "I need to fly to miami"
  "Can you help me book a flight to Miami?"
  "Show me flights from JFK to LAX"
  "I want to travel to Miami next week"
  "Need a flight to Miami"
)

echo "Testing ${#TEST_MESSAGES[@]} message variations..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for i in "${!TEST_MESSAGES[@]}"; do
  message="${TEST_MESSAGES[$i]}"
  echo "[$((i+1))/${#TEST_MESSAGES[@]}] Testing: \"$message\""
  
  response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/orchestrator/chat" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"${USER_ID}\",
      \"message\": \"${message}\"
    }")
  
  # Check if request was successful
  success=$(echo "$response" | grep -o '"success":[^,}]*' | cut -d':' -f2 || echo "false")
  
  if [[ "$success" == "true" ]]; then
    # Extract key fields
    intent=$(echo "$response" | grep -o '"intent":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    confidence=$(echo "$response" | grep -o '"confidence":[0-9.]*' | cut -d':' -f2 || echo "0")
    strategy=$(echo "$response" | grep -o '"strategy":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    
    echo "  ✅ Success"
    echo "  → Intent: $intent"
    echo "  → Confidence: $confidence"
    echo "  → Strategy: $strategy"
    echo "  → Task ID: $task_id"
    
    # Check if it correctly identified as travel
    if [[ "$intent" == *"travel"* ]]; then
      echo "  ✅ Correctly identified as travel"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo "  ⚠️  Expected 'travel' but got '$intent'"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  else
    error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
    echo "  ❌ Failed: $error"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  
  echo ""
done

echo "=========================================="
echo "Results: $SUCCESS_COUNT passed, $FAIL_COUNT failed"
echo ""

if [[ $FAIL_COUNT -eq 0 ]]; then
  echo "✅ All tests passed!"
else
  echo "⚠️  Some tests failed. Check the output above."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Check tasks in database:"
echo "   SELECT * FROM tasks WHERE user_id = '${USER_ID}' ORDER BY created_at DESC LIMIT 5;"
echo ""
echo "2. Check UI state:"
echo "   SELECT id, ui_state, confidence_score, decision_strategy FROM tasks WHERE user_id = '${USER_ID}' ORDER BY created_at DESC LIMIT 1;"
echo ""
echo "3. View Edge Function logs in Supabase Dashboard"
echo ""
echo "To test manually:"
echo "curl -X POST ${SUPABASE_URL}/functions/v1/orchestrator/chat \\"
echo "  -H \"Authorization: Bearer ${ANON_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"userId\": \"${USER_ID}\", \"message\": \"Your message here\"}'"

