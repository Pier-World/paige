# Complete OAuth 401 Fix

## Problem
Supabase Edge Functions require authentication by default, causing 401 errors when browsers try to redirect to OAuth endpoints (browsers can't include auth headers in redirects).

## Solutions Applied

### 1. Updated Frontend to Use Fetch with Auth Headers ✅
Changed from direct `window.location.href` to:
- Use `fetch()` with `Authorization: Bearer ${anonKey}` header
- Extract redirect URL from 302 response
- Then redirect browser to Google OAuth URL

This works because:
- Fetch can include auth headers
- We get the OAuth URL from the function
- Then we redirect the browser to that URL

### 2. Added Config to config.toml ✅
Added to `supabase/config.toml`:
```toml
[functions.auth-google]
verify_jwt = false
```

**Note:** This config only applies to local development. For production, you may need to configure this in the Supabase Dashboard.

### 3. Removed Per-Function Config File
The `supabase.functions.config.json` approach doesn't work - removed it.

## How It Works Now

1. User clicks "Connect Calendar"
2. Frontend calls `fetch()` with anon key in headers
3. Function validates auth and returns 302 redirect to Google
4. Frontend extracts `Location` header from response
5. Browser redirects to Google OAuth URL
6. User authorizes
7. Google redirects back to `/functions/v1/auth-google/callback`
8. Function processes callback and redirects to `/profile?connected=calendar`

## Testing

1. Refresh your app
2. Go to `/profile`
3. Click "Connect" next to Google Calendar
4. Should work without 401 error
5. Check browser console for any errors
6. Check Network tab to see the fetch request

## If Still Getting 401

### Option 1: Check Browser Console
- Look for CORS errors
- Check if fetch is being called
- Verify anon key is set

### Option 2: Configure in Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions → `auth-google`
2. Look for "Settings" or "Configuration"
3. Disable "Verify JWT" or set "Auth Required" to false

### Option 3: Verify Anon Key
Make sure `VITE_SUPABASE_ANON_KEY` is set in your `.env` file:
```bash
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Expected Behavior

- ✅ No 401 errors
- ✅ Fetch request succeeds with 302 status
- ✅ Browser redirects to Google OAuth
- ✅ After authorization, redirects back to profile page
- ✅ Calendar shows as "Connected"

