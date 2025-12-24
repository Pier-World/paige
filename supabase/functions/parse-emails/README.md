# Email Parser Edge Function

Extracts structured travel booking data from emails using GPT-4 and creates/updates potential trips.

## Overview

This Edge Function:
1. Queries the `emails` table for unprocessed travel-related emails
2. Uses GPT-4 to extract structured booking data
3. Stores results in `email_context` table
4. Creates/updates records in `potential_trips` table

## How It Works

### Email Selection
- Only processes emails where `processed = false`
- Looks back `days_back` days (default: 90)
- Excludes spam emails
- Limits to `limit` emails per run (default: 50)

### Extraction Process
1. **GPT-4 Analysis**: Email content is sent to GPT-4 with a structured prompt
2. **Data Extraction**: Returns JSON with booking details (type, dates, location, cost, etc.)
3. **Validation**: Only processes bookings with confidence ≥ 60%
4. **Storage**: Stores in `email_context` table with extraction metadata

### Trip Creation/Update
- **New Trip**: Creates if no existing trip matches (same city + dates within 1 day)
- **Update Trip**: Updates existing trip if:
  - Existing trip is from calendar (email is more authoritative)
  - New confidence is higher
- **Status**: Email confirmations set status to `confirmed` (more reliable than calendar)

## API

### Endpoint

```
POST /functions/v1/parse-emails
```

### Request Body

```json
{
  "user_id": "uuid-here",
  "days_back": 90,  // optional, default 90
  "limit": 50       // optional, default 50
}
```

### Response

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

## Environment Variables

Required in Supabase Dashboard → Settings → Edge Functions → Secrets:

- `OPENAI_API_KEY` - Your OpenAI API key for GPT-4

## Deployment

Deploy manually via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function: `parse-emails`
3. Copy contents of `index.ts` and supporting files
4. Set environment variable: `OPENAI_API_KEY`

## Testing

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/parse-emails" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "days_back": 90,
    "limit": 50
  }'
```

## Extraction Confidence Levels

- **90-100**: Explicit confirmation with all key details
- **70-89**: Clear confirmation but missing some details
- **50-69**: Possible confirmation but ambiguous (not processed)
- **0-49**: Not a travel confirmation (not processed)

## Supported Booking Types

- **flight**: Airline confirmations
- **hotel**: Hotel reservations
- **car**: Car rental confirmations
- **event**: Event registrations
- **restaurant**: Restaurant reservations
- **unknown**: Not a travel confirmation

## Error Handling

- Individual email failures don't stop the entire process
- Errors are logged and returned in response
- Failed extractions are stored in `email_context` with `extraction_errors`
- Emails are marked as `processed` even if extraction fails (prevents infinite retries)

## Performance

- Typical execution: 1-3 seconds per email (GPT-4 API call)
- 50 emails: ~60-150 seconds total
- Rate limiting: OpenAI API handles rate limits automatically
- Cost: ~$0.001-0.003 per email (GPT-4o-mini pricing)

## File Structure

```
parse-emails/
├── index.ts          # Main Edge Function handler
├── types.ts          # TypeScript interfaces
├── extractor.ts      # GPT-4 extraction logic
├── processor.ts      # Process extracted data and create/update trips
└── README.md         # This file
```

## Integration with Calendar Scanner

- Email confirmations are more authoritative than calendar detections
- If both detect the same trip, email data takes precedence
- Email confirmations set trip status to `confirmed`
- Calendar detections set status to `detected`

## Future Improvements

- [ ] Batch processing for faster execution
- [ ] Caching common extraction patterns
- [ ] Support for multi-language emails
- [ ] Integration with email body fetching (currently uses preview only)
- [ ] Retry logic for failed GPT-4 calls

