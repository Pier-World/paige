#!/bin/bash

# Test script for scan-calendar Edge Function
# 
# Usage:
# 1. Replace PROJECT_URL with your Supabase project URL
# 2. Replace ANON_KEY with your Supabase anon key (from Settings → API)
# 3. Replace USER_ID with a valid user ID from your database
# 4. Run: bash test_scan_calendar.sh

# Get these values from your Supabase Dashboard:
# - PROJECT_URL: Settings → API → Project URL
# - ANON_KEY: Settings → API → anon/public key
# - USER_ID: From your profiles table (SELECT id FROM profiles LIMIT 1;)

PROJECT_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key-here}"
USER_ID="${TEST_USER_ID:-your-user-id-here}"

echo "Testing scan-calendar function..."
echo "Project URL: $PROJECT_URL"
echo "User ID: $USER_ID"
echo ""

# Make the request
curl -X POST "$PROJECT_URL/functions/v1/scan-calendar" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || cat

echo ""
echo ""
echo "To check results in database, run:"
echo "SELECT * FROM potential_trips WHERE user_id = '$USER_ID' ORDER BY created_at DESC;"

