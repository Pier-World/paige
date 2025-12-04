# Verify Google OAuth Setup

## Quick Verification Checklist

### 1. Environment Variables ✅
Check Supabase Dashboard → Settings → Edge Functions → Secrets:

- [ ] `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret  
- [ ] `MASTER_ENCRYPTION_KEY` - 32+ character encryption key
- [ ] `FRONTEND_URL` - Your frontend URL (optional, defaults to localhost)

### 2. Google Cloud Console ✅
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized redirect URI added:
  ```
  https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/auth-google/callback
  ```
- [ ] Calendar API enabled in Google Cloud Console

### 3. Functions Deployed ✅
Check Supabase Dashboard → Edge Functions:

- [ ] `auth-google` function deployed
- [ ] `calendar-sync` function deployed

### 4. Frontend Ready ✅
- [x] ProfilePage has `connectCalendar()` function
- [x] ProfilePage checks connection status
- [x] UI shows connect/reconnect button

## Test the Flow

1. **Go to Profile Page**
   - Navigate to `/profile`
   - Find "Google Calendar" in Connected Services

2. **Click "Connect"**
   - Should redirect to Google OAuth
   - Authorize access
   - Should redirect back to `/profile?connected=calendar`

3. **Verify Connection**
   - Status should show "Connected" with checkmark
   - Check database:
     ```sql
     SELECT * FROM integrations 
     WHERE provider = 'google_calendar' 
     AND is_active = true;
     ```

4. **Check Calendar Sync**
   - Events should sync automatically after connection
   - Check database:
     ```sql
     SELECT COUNT(*) FROM calendar_events 
     WHERE user_id = 'your-user-id';
     ```

## Troubleshooting

### "Function not found" error
- Deploy functions:
  ```bash
  npx supabase functions deploy auth-google
  npx supabase functions deploy calendar-sync
  ```

### "Invalid redirect URI"
- Check Google Cloud Console → OAuth 2.0 Client IDs
- Redirect URI must match exactly (no trailing slash)

### "Missing environment variable"
- Go to Supabase Dashboard → Settings → Edge Functions
- Add missing secrets

### "No events synced"
- Check function logs in Supabase Dashboard
- Verify Calendar API is enabled in Google Cloud Console
- Check if `calendar-sync` was called after OAuth

## Next: Enhance Calendar Sync

After verifying setup works, we can:
1. Add incremental sync (only new/changed events)
2. Add webhook support for real-time updates
3. Sync multiple calendars
4. Add conflict detection for travel recommendations

