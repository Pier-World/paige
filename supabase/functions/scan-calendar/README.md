# Calendar Scanner Edge Function

Scans user's calendar events for the next 30 days and detects potential trips based on travel indicators.

## Overview

This Edge Function implements the calendar scanner for Phase 1: Proactive Intelligence. It:

1. Fetches calendar events for the next 30 days
2. Analyzes each event for travel indicators
3. Calculates confidence scores (0-100)
4. Creates/updates records in `potential_trips` table for trips with confidence >= 50

## Detection Algorithm

### Confidence Scoring

The function scores events based on multiple factors:

- **Explicit travel keywords** (+40 points): "flight to", "traveling to", "hotel in", etc.
- **Implicit travel keywords** (+20 points): "conference in", "meeting in", "offsite in", etc.
- **Location mismatch** (+30 points): Event in different city >50 miles from home
- **Multi-day event** (+20 points): Event spans multiple days
- **Long duration** (+10 points): Event >4 hours (but not multi-day)

### Trip Type Classification

- **Business**: Contains keywords like "conference", "meeting", "workshop"
- **Leisure**: Contains keywords like "vacation", "holiday", "visiting"
- **Mixed**: Contains both business and leisure indicators
- **Unknown**: No clear indicators

## API

### Endpoint

```
POST /functions/v1/scan-calendar
```

### Request Body

```json
{
  "user_id": "uuid-here"
}
```

### Response

```json
{
  "success": true,
  "trips_detected": 2,
  "trips_updated": 1,
  "events_processed": 15,
  "errors": [],
  "execution_time_ms": 342
}
```

## Deployment

```bash
# Deploy the function
supabase functions deploy scan-calendar

# Or using Supabase CLI
npx supabase functions deploy scan-calendar
```

## Testing

### Manual Test

```bash
# Set your variables
PROJECT_URL="https://your-project.supabase.co"
ANON_KEY="your-anon-key"
USER_ID="your-user-id"

# Trigger scan
curl -X POST "$PROJECT_URL/functions/v1/scan-calendar" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}"
```

### Verify Results

```sql
-- Check detected trips
SELECT * FROM potential_trips 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;

-- Check specific trip details
SELECT 
  id,
  destination,
  destination_city,
  start_date,
  end_date,
  confidence_score,
  trip_type,
  status,
  metadata->>'detection_reasoning' as reasoning
FROM potential_trips
WHERE user_id = 'your-user-id'
AND detection_source = 'calendar';
```

## Test Cases

### Test 1: High Confidence Detection
- Event: "Flight to NYC next week"
- Location: "JFK Airport"
- Expected: Should detect with confidence ~90

### Test 2: Business Conference
- Event: "Annual Tech Summit in Austin"
- Location: "Austin Convention Center"
- Expected: Should detect with confidence ~70, trip_type = 'business'

### Test 3: Below Threshold
- Event: "Lunch meeting downtown"
- Location: "City Center"
- Expected: Should NOT detect (confidence < 50)

### Test 4: Duplicate Handling
- Run scan twice with same events
- Expected: First run creates trip, second run updates if confidence higher

## File Structure

```
scan-calendar/
├── index.ts          # Main Edge Function handler
├── types.ts          # TypeScript interfaces
├── detector.ts       # Core detection logic
├── scorer.ts         # Confidence scoring algorithm
├── extractors.ts     # City/location extraction
├── utils.ts          # Helper functions (distance, dates, etc.)
└── README.md         # This file
```

## Dependencies

- `@supabase/supabase-js@2` - Supabase client
- `@supabase/functions-js` - Edge runtime types

## Error Handling

The function handles:
- Invalid user_id → 400 error
- User profile not found → 404 error
- Database errors → Logged and included in response
- Individual event processing errors → Logged, but scan continues

All errors are returned in the `errors` array in the response.

## Performance

- Processes events sequentially
- Typical execution time: 200-500ms for 10-20 events
- Database queries are optimized with indexes on:
  - `calendar_events(user_id, start_time, status)`
  - `potential_trips(user_id, destination_city, start_date, status)`

## Future Improvements

- [ ] Batch processing for large event lists
- [ ] Geocoding API integration for accurate distance calculation
- [ ] Machine learning model for improved confidence scoring
- [ ] Support for recurring events
- [ ] Integration with email parser for cross-validation

