#!/bin/bash

# Query detected trips via Supabase REST API
# Usage: bash query_trips.sh

PROJECT_URL="https://oifchjaqembbkdyfjctp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZmNoamFxZW1iYmtkeWZqY3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTMyMjQsImV4cCI6MjA2MzE4OTIyNH0._i2SJ0KGLHbH1e-v2lsfU6XdbVueQW-Iq4mTQslLDak"
USER_ID="66f01217-1e16-40e2-86cf-bb5afef42f4c"

echo "Fetching detected trips..."
echo ""

curl -k -X GET \
  "$PROJECT_URL/rest/v1/potential_trips?user_id=eq.$USER_ID&detection_source=eq.calendar&order=created_at.desc&limit=10&select=id,destination,destination_city,start_date,end_date,confidence_score,trip_type,status,metadata" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" | jq '.'

