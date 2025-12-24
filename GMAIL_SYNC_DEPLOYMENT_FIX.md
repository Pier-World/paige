# Gmail Sync Deployment Fix

## Problem
The `gmail-sync` function was trying to import from `../_shared/google-oauth.ts` which isn't accessible when deploying via Supabase Dashboard.

## Solution
All shared code has been **inlined** into the `gmail-sync/index.ts` file:

1. ✅ **Type definitions** - `GmailMessage`, `EmailCategory`, `TravelConfirmation`
2. ✅ **Encryption functions** - `encrypt()`, `decrypt()`, `getEncryptionKey()`
3. ✅ **Google OAuth function** - `getValidGoogleToken()`

## Changes Made

The function is now **self-contained** and doesn't require any `_shared` imports. All necessary code is included directly in the file.

## Deployment

The function should now deploy successfully via Supabase Dashboard. The linter errors you see are expected:
- TypeScript doesn't recognize Deno types (won't affect runtime)
- TypeScript doesn't recognize the Supabase import (works fine at runtime)

## Environment Variables Required

Make sure these are set in Supabase Dashboard → Settings → Edge Functions → Secrets:

- `MASTER_ENCRYPTION_KEY` - For encrypting/decrypting OAuth tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OPENAI_API_KEY` - For email classification (optional, but recommended)

## Testing

After deployment, test with:

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
1. Fetch last 30 days of emails from Gmail
2. Store them in the `emails` table
3. Classify them using GPT-4
4. Create entities for travel confirmations

