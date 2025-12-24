# Email Parser Troubleshooting Guide

## Issues Identified

### 1. ✅ **No Emails in Database**
- **Problem**: Gmail sync may not have run yet, or emails aren't being stored
- **Solution**: Run Gmail sync first to populate emails table

### 2. ✅ **SQL Syntax Error Fixed**
- **Problem**: PostgreSQL doesn't support `LIMIT` directly in `UPDATE` statements
- **Solution**: Use subquery with `IN` clause (see `fix_email_processing.sql`)

### 3. ✅ **Processing Conflict Fixed**
- **Problem**: `gmail-sync` marks emails as `processed = true`, but `parse-emails` needs `processed = false`
- **Solution**: Changed strategy - `parse-emails` now checks for `email_context` records instead of `processed` flag

## Updated Strategy

### How It Works Now:

1. **Gmail Sync** (`gmail-sync` function):
   - Fetches emails from Gmail
   - Stores in `emails` table with `processed = false`
   - Classifies emails (travel_confirmation, receipt, other)
   - Marks as `processed = true` after classification
   - Creates entities for travel confirmations

2. **Email Parser** (`parse-emails` function):
   - Looks for emails in last 30-60 days
   - Checks if `email_context` record exists (already processed)
   - Processes emails that don't have `email_context` records
   - Creates `email_context` records with detailed extraction
   - Creates/updates `potential_trips` from email confirmations

### Key Change:
- **Before**: Looked for `processed = false` emails
- **After**: Looks for emails without `email_context` records
- This allows both systems to work together without conflict

## Step-by-Step Fix

### Step 1: Run Gmail Sync First

```bash
curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/gmail-sync" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "66f01217-1e16-40e2-86cf-bb5afef42f4c",
    "action": "init"
  }'
```

This will:
- Fetch last 30 days of emails from Gmail
- Store in `emails` table
- Classify them (travel_confirmation, etc.)
- Mark as `processed = true`

### Step 2: Run Email Parser

```bash
curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/parse-emails" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "66f01217-1e16-40e2-86cf-bb5afef42f4c",
    "days_back": 60,
    "limit": 50
  }'
```

This will:
- Find emails without `email_context` records
- Extract detailed booking data using GPT-4
- Create `email_context` records
- Create/update `potential_trips`

### Step 3: Verify Results

```sql
-- Check emails synced
SELECT COUNT(*) FROM emails WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c';

-- Check email_context records created
SELECT COUNT(*) FROM email_context WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c';

-- Check trips created from emails
SELECT COUNT(*) FROM potential_trips 
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
  AND detection_source = 'email';
```

## Updated Email Parser Logic

The parser now:
1. ✅ Queries emails from last 30-60 days (configurable)
2. ✅ Filters out emails that already have `email_context` records
3. ✅ Processes travel-related emails (category = travel_confirmation or likely travel)
4. ✅ Doesn't conflict with gmail-sync's `processed` flag
5. ✅ Creates detailed extraction in `email_context` table
6. ✅ Links to `potential_trips` table

## Recommended Workflow

### Initial Setup:
1. Run Gmail sync to populate emails table
2. Run email parser to extract detailed booking data
3. Set up cron job for periodic syncs

### Ongoing:
1. Gmail sync runs periodically (via webhook or cron)
2. Email parser runs daily to process new emails
3. Both systems work independently without conflict

## Testing

After deploying the updated function:

1. **First, sync emails:**
   ```bash
   curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/gmail-sync" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"userId": "66f01217-1e16-40e2-86cf-bb5afef42f4c", "action": "init"}'
   ```

2. **Then, parse emails:**
   ```bash
   curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/parse-emails" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "66f01217-1e16-40e2-86cf-bb5afef42f4c", "days_back": 60}'
   ```

3. **Check results:**
   - Should see emails_processed > 0
   - Should see bookings_found > 0 if travel emails exist
   - Should see trips_created or trips_updated > 0

