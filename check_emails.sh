#!/bin/bash

# Check emails table status for the user

PROJECT_URL="https://oifchjaqembbkdyfjctp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZmNoamFxZW1iYmtkeWZqY3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTMyMjQsImV4cCI6MjA2MzE4OTIyNH0._i2SJ0KGLHbH1e-v2lsfU6XdbVueQW-Iq4mTQslLDak"
USER_ID="66f01217-1e16-40e2-86cf-bb5afef42f4c"

echo "Checking emails for user..."
echo ""

# Get total emails
echo "Total emails:"
curl -k -X GET \
  "$PROJECT_URL/rest/v1/emails?user_id=eq.$USER_ID&select=id,subject,processed,received_at&order=received_at.desc&limit=10" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" 2>&1 | grep -v "^  %" | grep -v "^  0" | tail -30

echo ""
echo ""
echo "Unprocessed emails (processed=false):"
curl -k -X GET \
  "$PROJECT_URL/rest/v1/emails?user_id=eq.$USER_ID&processed=eq.false&select=id,subject,processed,received_at&order=received_at.desc&limit=10" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" 2>&1 | grep -v "^  %" | grep -v "^  0" | tail -30

