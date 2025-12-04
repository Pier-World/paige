# Google Calendar Integration Setup Guide

## Prerequisites Check ✅

You already have:
- ✅ `auth-google` Edge Function (handles OAuth flow)
- ✅ `calendar-sync` Edge Function (syncs events)
- ✅ `google-oauth.ts` shared utility (token management)
- ✅ `integrations` table in database
- ✅ Encryption utilities for secure token storage

## Step 1: Verify Environment Variables

Make sure these are set in Supabase Dashboard → Settings → Edge Functions:

1. **GOOGLE_CLIENT_ID** - Your Google OAuth Client ID
2. **GOOGLE_CLIENT_SECRET** - Your Google OAuth Client Secret
3. **MASTER_ENCRYPTION_KEY** - 32-byte key for encrypting tokens (can be any 32+ character string)
4. **FRONTEND_URL** - Your frontend URL (e.g., `https://yourdomain.com` or `http://localhost:5173`)

### How to Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/auth-google/callback
   ```
7. Copy the **Client ID** and **Client Secret**

## Step 2: Verify OAuth Redirect URI

The redirect URI must match exactly:
```
https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/auth-google/callback
```

Make sure this is added in Google Cloud Console → OAuth 2.0 Client IDs → Authorized redirect URIs

## Step 3: Deploy Functions (if not already deployed)

```bash
cd /Users/spencerchandlee/paige

# Deploy auth-google
npx supabase functions deploy auth-google

# Deploy calendar-sync
npx supabase functions deploy calendar-sync
```

## Step 4: Create Frontend Connect Button

Add a button to your Profile page to initiate OAuth:

```tsx
// In ProfilePage.tsx or a new IntegrationsSettings component

const handleConnectCalendar = () => {
  const { user } = useAuth();
  if (!user) return;
  
  // Redirect to OAuth flow
  window.location.href = `https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/auth-google?user_id=${user.id}&provider=calendar`;
};
```

## Step 5: Test the Flow

1. Click "Connect Google Calendar" button
2. You'll be redirected to Google to authorize
3. After authorization, you'll be redirected back to your app
4. Calendar sync should automatically trigger
5. Check `calendar_events` table for synced events

## Step 6: Verify Integration

Check if integration was created:

```sql
SELECT * FROM integrations 
WHERE user_id = 'your-user-id' 
AND provider = 'google_calendar';
```

Check if events were synced:

```sql
SELECT COUNT(*) FROM calendar_events 
WHERE user_id = 'your-user-id';
```

## Troubleshooting

### "Invalid redirect URI"
- Make sure the redirect URI in Google Cloud Console matches exactly
- Check for trailing slashes or http vs https

### "Missing GOOGLE_CLIENT_ID"
- Go to Supabase Dashboard → Settings → Edge Functions
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### "No integration found"
- OAuth flow didn't complete
- Check browser console for errors
- Check Supabase function logs

### "Token refresh failed"
- Check if `MASTER_ENCRYPTION_KEY` is set
- Verify encryption/decryption is working
- Check function logs for errors

## Next Steps After Setup

1. **Automatic Sync** - Set up periodic sync (every 15 minutes)
2. **Real-time Updates** - Use Google Calendar webhooks (push notifications)
3. **Multi-calendar Support** - Sync multiple calendars
4. **Conflict Detection** - Use calendar data in travel recommendations

