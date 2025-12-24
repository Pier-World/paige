# Email Parser Implementation Summary

## ✅ Implementation Complete

All files have been created for the email parser Edge Function.

## Files Created

1. **`index.ts`** - Main Edge Function handler
   - Queries `emails` table for unprocessed emails
   - Orchestrates extraction and processing
   - Returns detailed parse results

2. **`types.ts`** - TypeScript interfaces
   - `EmailToProcess` - Email from database
   - `ExtractedBooking` - GPT-4 extraction result
   - `ParseResult` - Operation summary

3. **`extractor.ts`** - GPT-4 extraction logic
   - Constructs extraction prompt
   - Calls OpenAI API (gpt-4o-mini)
   - Parses and validates JSON response
   - Stores results in `email_context` table

4. **`processor.ts`** - Process extracted data
   - Creates new trips from email confirmations
   - Updates existing trips (email > calendar)
   - Links `email_context` to `potential_trips`
   - Infers trip type (business/leisure)

5. **`README.md`** - Complete documentation

## Key Features

### Extraction Strategy
- Uses GPT-4o-mini (faster, cheaper than GPT-4)
- Structured JSON extraction with confidence scoring
- Handles all booking types: flight, hotel, car, event, restaurant
- Validates extracted data before processing

### Trip Management
- **Email > Calendar**: Email confirmations override calendar detections
- **Status**: Email confirmations set status to `confirmed`
- **Confidence**: Uses email confidence score
- **Linking**: Links `email_context` to `potential_trips` via `related_potential_trip_id`

### Error Handling
- Individual email failures don't stop processing
- Failed extractions stored with error details
- Emails marked as processed to prevent infinite retries
- Comprehensive logging for debugging

## Deployment Steps

### 1. Set Environment Variable

In Supabase Dashboard → Settings → Edge Functions → Secrets:
- Add `OPENAI_API_KEY` = `sk-...` (your OpenAI API key)

### 2. Deploy Function

Manually via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function: `parse-emails`
3. Copy contents of all files:
   - `index.ts`
   - `types.ts`
   - `extractor.ts`
   - `processor.ts`
4. Deploy

### 3. Test

```bash
curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/parse-emails" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "66f01217-1e16-40e2-86cf-bb5afef42f4c",
    "days_back": 90,
    "limit": 50
  }'
```

## Expected Results

### Successful Parse
```json
{
  "success": true,
  "emails_processed": 15,
  "bookings_found": 3,
  "trips_created": 2,
  "trips_updated": 1,
  "errors": [],
  "execution_time_ms": 1245
}
```

### Verify in Database

```sql
-- Check email_context records
SELECT 
  id,
  confirmation_type,
  confirmation_code,
  extraction_confidence,
  parsed_data->>'airline' as airline,
  parsed_data->>'hotel_name' as hotel,
  related_potential_trip_id
FROM email_context
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;

-- Check trips created from emails
SELECT 
  id,
  destination_city,
  start_date,
  end_date,
  confidence_score,
  status,
  detection_source,
  metadata->>'email_confirmation'->>'type' as booking_type
FROM potential_trips
WHERE user_id = 'your-user-id'
  AND detection_source = 'email'
ORDER BY created_at DESC;
```

## Integration with Calendar Scanner

The email parser complements the calendar scanner:

1. **Calendar Scanner** detects potential trips (lower confidence)
2. **Email Parser** confirms trips (higher confidence)
3. **Email wins**: If both detect same trip, email data takes precedence
4. **Status flow**: `detected` (calendar) → `confirmed` (email)

## Cost Estimation

- **GPT-4o-mini**: ~$0.001-0.003 per email
- **50 emails**: ~$0.05-0.15 per scan
- **Daily scan**: ~$1.50-4.50/month per user (if 50 emails/day)

## Next Steps After Deployment

1. **Test with real emails** - Verify extraction accuracy
2. **Monitor costs** - Track OpenAI API usage
3. **Tune confidence thresholds** - Adjust if too many false positives/negatives
4. **Set up cron job** - Automate daily email parsing (optional)

## Troubleshooting

### No bookings found
- Check if emails have `processed = false`
- Verify `body_preview` contains email content
- Check OpenAI API key is set correctly
- Review logs for extraction errors

### Low confidence extractions
- Email content might be too short (preview only)
- Consider fetching full email body if needed
- Adjust confidence threshold if needed

### Trips not created
- Verify extracted data has `dates.start` and `location.city`
- Check confidence is ≥ 60%
- Review processor logs for errors

