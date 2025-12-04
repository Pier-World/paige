# Test Google Calendar Connection Flow

## ✅ Functions Deployed

Both functions have been successfully deployed:
- ✅ `auth-google` - OAuth flow handler
- ✅ `calendar-sync` - Calendar event sync

## Manual Testing Steps

### Step 1: Navigate to Profile Page
1. Open your app in the browser
2. Navigate to `/profile` page
3. Find the "Connected Services" section

### Step 2: Initiate Connection
1. Click the **"Connect"** button next to "Google Calendar"
2. You should be redirected to Google OAuth consent screen

### Step 3: Authorize Access
1. Sign in to Google (if not already)
2. Review the permissions requested:
   - View and manage your calendars
   - View and manage events on your calendars
3. Click **"Allow"** or **"Continue"**

### Step 4: Verify Redirect
1. After authorization, you should be redirected back to:
   ```
   /profile?connected=calendar
   ```
2. The page should show "Connected" with a checkmark next to Google Calendar

### Step 5: Check Database
Run this SQL query in Supabase SQL Editor:

```sql
-- Check if integration was created
SELECT 
  id,
  provider,
  is_active,
  last_sync_at,
  created_at
FROM integrations 
WHERE provider = 'google_calendar'
ORDER BY created_at DESC
LIMIT 1;
```

### Step 6: Verify Events Synced
```sql
-- Check if events were synced
SELECT 
  COUNT(*) as event_count,
  MIN(start_time) as earliest_event,
  MAX(start_time) as latest_event
FROM calendar_events 
WHERE user_id = auth.uid();
```

### Step 7: Check Function Logs
1. Go to Supabase Dashboard → Edge Functions → `calendar-sync` → Logs
2. Look for:
   - "Calendar sync error" (if errors occurred)
   - Successful sync with event counts

## Expected Behavior

### ✅ Success Flow
1. OAuth redirect works
2. Integration record created in `integrations` table
3. Calendar events synced to `calendar_events` table
4. Status shows "Connected" in UI
5. No errors in function logs

### ❌ Common Issues

#### "Invalid redirect URI"
- **Fix:** Check Google Cloud Console → OAuth 2.0 Client IDs
- Redirect URI must be exactly:
  ```
  https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/auth-google/callback
  ```

#### "Missing environment variable"
- **Fix:** Go to Supabase Dashboard → Settings → Edge Functions → Secrets
- Add: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MASTER_ENCRYPTION_KEY`

#### "No events synced"
- **Check:** Function logs for errors
- **Verify:** Calendar API is enabled in Google Cloud Console
- **Test:** Manually call calendar-sync:
  ```bash
  curl -X POST https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/calendar-sync \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -d '{"userId":"YOUR_USER_ID","action":"init"}'
  ```

#### "Connection shows but no checkmark"
- **Check:** `integrations` table for `is_active = true`
- **Fix:** Reconnect if `is_active = false`

## Testing from Browser Console

You can also test the connection programmatically:

```javascript
// In browser console on your app
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const oauthUrl = `${supabaseUrl}/functions/v1/auth-google?user_id=${user.id}&provider=calendar`;
  window.location.href = oauthUrl;
}
```

## Next Steps After Successful Connection

1. **Verify Events in Calendar Page**
   - Go to `/calendar` page
   - Events should appear from Google Calendar

2. **Test Incremental Sync**
   - Add an event to Google Calendar
   - Wait a few minutes (or manually trigger sync)
   - Check if new event appears in database

3. **Use Calendar Data in Travel Recommendations**
   - Calendar events will now be available in `getUserContext()`
   - Orchestrator can check for conflicts when suggesting travel dates

## Automated Testing (Future)

Once the manual flow works, we can set up:
- Automated periodic sync (every 15 minutes)
- Webhook support for real-time updates
- Multi-calendar support

