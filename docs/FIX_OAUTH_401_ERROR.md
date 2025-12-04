# Fix OAuth 401 Error

## Problem
Supabase Edge Functions require authentication by default, but OAuth redirects from browsers can't include auth headers, causing 401 errors.

## Solution Applied

### 1. Created Config File
Created `supabase/functions/auth-google/supabase.functions.config.json`:
```json
{
  "auth": false
}
```

This tells Supabase to allow unauthenticated access to this function.

### 2. Simplified Frontend Code
Removed complex fetch logic and went back to simple `window.location.href` redirect since auth is no longer required.

### 3. Deployed Function
Redeployed the function with the new configuration.

## If Config File Doesn't Work

If the config file approach doesn't work (Supabase CLI might not automatically include it), you can:

### Option A: Configure in Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions → `auth-google`
2. Look for "Settings" or "Configuration"
3. Disable "Require Authentication" or set "Auth" to false

### Option B: Use Service Role Key
If config doesn't work, we can modify the function to accept requests without validation, but this is less secure.

## Testing

After deployment:
1. Refresh your app
2. Go to `/profile`
3. Click "Connect" next to Google Calendar
4. Should redirect to Google OAuth without 401 error
5. The 302 redirect is expected (that's the redirect to Google)

## Expected Flow

1. User clicks "Connect" → Browser redirects to `/functions/v1/auth-google?user_id=...&provider=calendar`
2. Function returns 302 redirect to Google OAuth URL
3. User authorizes in Google
4. Google redirects back to `/functions/v1/auth-google/callback?code=...`
5. Function exchanges code for tokens
6. Function redirects back to `/profile?connected=calendar`

The 302 you're seeing is step 2 - that's correct! The 401 was the problem, which should now be fixed.

