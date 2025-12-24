# Parse Emails Deployment Fix

## Issue
Boot error when deploying `parse-emails` function.

## Fixes Applied

1. ✅ **Moved Supabase client creation inside handler** - Matches pattern of other working functions
2. ✅ **Fixed duplicate code** - Removed duplicate `emailsList` declaration
3. ✅ **Moved `Deno.env` access inside function** - `OPENAI_API_KEY` now accessed inside `extractBookingData()` instead of top-level

## Files Updated

- `supabase/functions/parse-emails/index.ts` - Fixed structure and duplicate code
- `supabase/functions/parse-emails/extractor.ts` - Moved `Deno.env` access inside function

## Deployment

After deploying these updates, the function should start successfully.

## Testing

```bash
curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/parse-emails" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "66f01217-1e16-40e2-86cf-bb5afef42f4c", "days_back": 60, "limit": 50}'
```

## Expected Behavior

Once deployed successfully, the function should:
1. Query emails from last 60 days
2. Filter out emails that already have `email_context` records
3. Extract booking data using GPT-4
4. Create `email_context` records
5. Create/update `potential_trips` from email confirmations

## Note on Linter Errors

The TypeScript linter errors are expected:
- TypeScript doesn't recognize Deno types (won't affect runtime)
- TypeScript doesn't recognize the Supabase import (works fine at runtime)

These won't prevent deployment or execution.

