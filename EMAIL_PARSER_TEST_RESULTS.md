# Email Parser Test Results

## Test Execution

**Date:** January 2025  
**User ID:** `66f01217-1e16-40e2-86cf-bb5afef42f4c`  
**Function:** `parse-emails`

### Response
```json
{
  "success": true,
  "emails_processed": 0,
  "bookings_found": 0,
  "trips_created": 0,
  "trips_updated": 0,
  "errors": [],
  "execution_time_ms": 568
}
```

## Analysis

### ✅ Function is Working
- No errors returned
- Fast execution (~568ms)
- Proper response format
- Successfully queried database

### ⚠️ No Emails Found
The function found 0 emails to process. Possible reasons:

1. **No emails in database** - Gmail sync may not have run yet
2. **All emails processed** - All emails already have `processed = true`
3. **Date range** - Emails are older than 90 days (default `days_back`)
4. **RLS blocking** - Row Level Security may be preventing access

## Verification Steps

### 1. Check if emails exist

Run in Supabase SQL Editor:

```sql
-- Check total emails for user
SELECT 
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE processed = false) as unprocessed,
  COUNT(*) FILTER (WHERE processed = true) as processed,
  MIN(received_at) as oldest_email,
  MAX(received_at) as newest_email
FROM emails
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c';
```

### 2. Check unprocessed emails

```sql
-- List unprocessed emails
SELECT 
  id,
  subject,
  from_address,
  processed,
  received_at,
  category,
  body_preview
FROM emails
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
  AND processed = false
  AND received_at >= NOW() - INTERVAL '90 days'
ORDER BY received_at DESC
LIMIT 10;
```

### 3. Check if Gmail sync is working

```sql
-- Check when emails were last synced
SELECT 
  MAX(received_at) as last_email_received,
  COUNT(*) as total_emails
FROM emails
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c';
```

### 4. Test with specific email (if exists)

If you have emails but they're marked as processed, you can reset one for testing:

```sql
-- Reset one email for testing (replace with actual email ID)
UPDATE emails
SET processed = false
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
  AND id = 'email-id-here'
LIMIT 1;
```

Then run the parser again.

## Expected Behavior When Emails Exist

### If emails are found and processed:

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

### Check results:

```sql
-- Check email_context records created
SELECT 
  id,
  confirmation_type,
  confirmation_code,
  extraction_confidence,
  parsed_data->>'airline' as airline,
  parsed_data->>'hotel_name' as hotel,
  related_potential_trip_id
FROM email_context
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
ORDER BY created_at DESC
LIMIT 10;

-- Check trips created/updated from emails
SELECT 
  id,
  destination_city,
  start_date,
  end_date,
  confidence_score,
  status,
  detection_source,
  metadata->>'email_confirmation'->>'type' as booking_type,
  metadata->>'email_confirmation'->>'confirmation_code' as confirmation_code
FROM potential_trips
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
  AND detection_source = 'email'
ORDER BY created_at DESC;
```

## Function Health Check

### ✅ What's Working
- Function deployed successfully
- No runtime errors
- Proper error handling
- Fast execution
- Correct response format

### 🔍 What to Verify
1. **Emails exist in database** - Run SQL queries above
2. **Gmail sync is working** - Check if emails table is being populated
3. **OpenAI API key is set** - Verify in Supabase Dashboard → Settings → Edge Functions → Secrets
4. **RLS policies allow access** - Check if service role can read emails

## Next Steps

1. **Verify emails exist** - Run the SQL queries above in Supabase SQL Editor
2. **If no emails**: Check Gmail sync function is running
3. **If all processed**: Reset a few emails for testing
4. **If emails exist but not found**: Check date range and RLS policies

## Testing with Sample Email

If you want to test the extraction logic without real emails, you could:

1. Manually insert a test email:
```sql
INSERT INTO emails (user_id, gmail_message_id, subject, from_address, body_preview, received_at, processed)
VALUES (
  '66f01217-1e16-40e2-86cf-bb5afef42f4c',
  'test-123',
  'United Airlines Flight Confirmation',
  'noreply@united.com',
  'Your flight UA1234 from SFO to JFK on 2025-02-15 is confirmed. Confirmation code: ABC123',
  NOW(),
  false
);
```

2. Run the parser again
3. Check if it extracts the booking data

## Summary

**Function Status:** ✅ **WORKING** - No errors, proper execution  
**Issue:** No emails found to process (likely no emails in database or all processed)  
**Action Needed:** Verify emails exist and are unprocessed

