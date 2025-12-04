# Debugging OAuth "Failed to connect: 0" Error

## Problem
Getting "Failed to connect: 0" error when trying to connect Google Calendar. The error "0" indicates `response.status === 0`, which typically means a CORS or network issue.

## What's Happening

1. **Request reaches server** ✅ - We see 302 in Supabase logs
2. **Browser blocks response** ❌ - Status 0 indicates CORS/network issue
3. **Location header not accessible** ❌ - Can't read redirect URL

## Root Cause

When using `fetch()` with `redirect: 'manual'`, if there's a CORS issue with reading response headers (specifically the `Location` header), the browser may report `status: 0`.

## Solutions Applied

### 1. Added CORS Header to Expose Location
```typescript
'Access-Control-Expose-Headers': 'Location'
```
This allows the frontend to read the `Location` header.

### 2. Added Status 0 Detection
Now checking for `response.status === 0` or `response.type === 'opaque'` to detect CORS issues early.

### 3. Added Fallback OAuth URL Construction
If Location header isn't accessible, we construct the OAuth URL manually using `VITE_GOOGLE_CLIENT_ID`.

## Required Environment Variable

For the fallback to work, add to your `.env` file:
```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

You can get this from:
1. Google Cloud Console → APIs & Services → Credentials
2. Your OAuth 2.0 Client ID

## Testing Steps

1. **Check Browser Console**
   - Look for "Fetch response received:" log
   - Check `status`, `type`, and `url` values
   - Look for CORS errors

2. **Check Network Tab**
   - Open DevTools → Network
   - Click "Connect"
   - Find the request to `auth-google`
   - Check:
     - Status code (should be 302)
     - Response headers (should include `Location`)
     - CORS headers (should include `Access-Control-Expose-Headers: Location`)

3. **Verify Environment Variable**
   ```bash
   # In your .env file
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```

## Alternative Solution

If CORS continues to be an issue, we can:
1. Use a server-side proxy endpoint
2. Configure Supabase to allow public access (via Dashboard)
3. Use a different OAuth flow (e.g., popup window)

## Next Steps

1. Add `VITE_GOOGLE_CLIENT_ID` to `.env` file
2. Restart your dev server
3. Try connecting again
4. Check console logs for detailed debugging info

