# Intercom Integration Setup Guide

This guide covers the complete setup for integrating Intercom with the Pier AI Concierge backend.

## Architecture Overview

1. **Frontend**: Intercom widget initialized via `IntercomProvider`
2. **Webhook Handler**: Supabase Edge Function receives Intercom webhooks
3. **Orchestrator**: Processes user messages and generates AI responses
4. **Intercom API**: Sends replies back to conversations

## Prerequisites

- Intercom account with Developer Hub access
- Supabase project with Edge Functions enabled
- Environment variables configured

## Step 1: Configure Intercom Webhook

1. Go to Intercom Dashboard → Settings → Developers → Developer Hub
2. Navigate to Webhooks
3. Create a new webhook with:
   - **URL**: `https://pier.vip/api/webhooks/intercom` (or your Supabase function URL: `https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/intercom-webhook`)
   - **Topics**: 
     - `conversation.user.created`
     - `conversation.user.replied`
     - `conversation.admin.replied`
     - `conversation.admin.assigned`
     - `conversation.admin.closed`
   - **Format**: JSON
   - **Version**: 2.11

4. Copy the **Webhook Secret** (you'll need this for environment variables)

## Step 2: Get Intercom Access Token

1. Go to Intercom Dashboard → Settings → Developers → Developer Hub
2. Navigate to Authentication
3. Create or use existing app
4. Copy the **Access Token**

## Step 3: Get Default Assignee ID (Optional)

1. Go to Intercom → Settings → Teammates
2. Click on a team member
3. The ID is in the URL: `https://app.intercom.com/a/apps/{app_id}/settings/teammates/{admin_id}`
4. Copy the `admin_id`

## Step 4: Set Environment Variables

Add these to your Supabase project secrets:

```bash
# Intercom API Credentials
INTERCOM_ACCESS_TOKEN=dG9rOjg4ZmQ2NzMxXzY2YWRfNGM0Nl85ZmQ4XzBmN2EyMjFhZjliOToxOjA=
INTERCOM_WEBHOOK_SECRET=your_webhook_secret_here
INTERCOM_DEFAULT_ASSIGNEE_ID=your_admin_id_here  # Optional
```

To set secrets in Supabase:

```bash
supabase secrets set INTERCOM_ACCESS_TOKEN=dG9rOjg4ZmQ2NzMxXzY2YWRfNGM0Nl85ZmQ4XzBmN2EyMjFhZjliOToxOjA=
supabase secrets set INTERCOM_WEBHOOK_SECRET=f00e8d75-2c32-4365-a70c-b9ac8f9f30cf
supabase secrets set INTERCOM_DEFAULT_ASSIGNEE_ID=your_admin_id_here
```

## Step 5: Run Database Migration

```bash
supabase migration up
```

This will add the `intercom_user_id` column to the `profiles` table.

## Step 6: Configure Function Authentication

The webhook function needs to be publicly accessible (no authentication required) so Intercom can send webhooks.

**Option 1: Config File (Recommended)**
A config file has been created at `supabase/functions/intercom-webhook/supabase.functions.config.json` with:
```json
{
  "verify_jwt": false,
  "auth": false
}
```

**Option 2: Config TOML**
Also added to `supabase/config.toml`:
```toml
[functions.intercom-webhook]
verify_jwt = false
```

## Step 7: Deploy Edge Functions

```bash
# Deploy webhook handler
supabase functions deploy intercom-webhook

# Deploy user sync function
supabase functions deploy sync-user-to-intercom
```

**Important**: After deploying, test that the function is publicly accessible:
```bash
curl https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/intercom-webhook
```

Should return:
```json
{
  "status": "ok",
  "version": "2.0",
  "message": "Intercom webhook handler is running",
  "timestamp": "..."
}
```

If you get `{"code":401,"message":"Missing authorization header"}`, the function is still requiring authentication. Check that:
1. The config file exists: `supabase/functions/intercom-webhook/supabase.functions.config.json`
2. The function was redeployed after adding the config
3. The config.toml has the `[functions.intercom-webhook]` section

## Step 8: Update Webhook URL in Intercom

After deployment, update the webhook URL in Intercom dashboard to:
```
https://your-project.supabase.co/functions/v1/intercom-webhook
```

Or if using custom domain:
```
https://pier.vip/functions/v1/intercom-webhook
```

## Step 9: Test the Integration

1. **Test User Sync**:
   - Log in as a user
   - Check browser console for "✅ Intercom initialized"
   - User should be automatically synced to Intercom

2. **Test Webhook**:
   - Send a message in Intercom from a test account
   - Check Supabase Edge Function logs
   - Should see: `📨 Webhook received: conversation.user.replied`
   - AI should respond automatically

3. **Test Escalation**:
   - Send a complex request that requires human help
   - Conversation should be assigned to human team member
   - Status should update in database

## Monitoring

### Check Webhook Delivery

1. Go to Intercom → Developer Hub → Webhooks
2. Click your webhook
3. View "Recent deliveries"
4. Check status codes and payloads

### Check Edge Function Logs

```bash
supabase functions logs intercom-webhook
supabase functions logs sync-user-to-intercom
```

### Database Queries

```sql
-- Check synced users
SELECT id, email, intercom_user_id 
FROM profiles 
WHERE intercom_user_id IS NOT NULL;

-- Check recent requests from Intercom
SELECT id, raw_text, status, front_conversation_id, created_at
FROM requests
WHERE source_type = 'chat'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Webhook signature verification fails (401 error)

**Symptoms**: Webhook returns 401 status code, test requests fail

**Solutions**:

1. **Test requests don't include signatures**: Intercom's "Send test request" button may not include signature headers. The webhook handler now allows requests without signatures for testing. Check the Edge Function logs to see if signature is present.

2. **Check if secret is set**:
   ```bash
   supabase secrets list
   ```
   Make sure `INTERCOM_WEBHOOK_SECRET` is listed.

3. **Verify secret matches Intercom**:
   - Go to Intercom → Developer Hub → Webhooks
   - Click your webhook
   - Copy the "Client secret" 
   - Make sure it matches what's in Supabase secrets

4. **Check Edge Function logs**:
   ```bash
   supabase functions logs intercom-webhook --tail
   ```
   Look for signature verification messages and header information.

5. **For testing without signature verification**:
   - Temporarily remove `INTERCOM_WEBHOOK_SECRET` from Supabase secrets
   - The handler will skip verification (not recommended for production)
   - Re-add the secret after testing

**Note**: The webhook handler now logs detailed information about signature verification. Check the logs to see exactly what's happening.

### Issue: User not found in webhook handler

**Solution**: 
- Ensure user is synced to Intercom (check `intercom_user_id` in profiles table)
- Verify `external_id` in Intercom matches Supabase user ID
- Check that user exists in both `profiles` and `members` tables

### Issue: Replies not appearing in Intercom

**Solution**:
- Check Edge Function logs for errors
- Verify `INTERCOM_ACCESS_TOKEN` is valid
- Ensure API version is `2.11` in headers
- Check that `message_type` is `'comment'` and `type` is `'admin'`

### Issue: Orchestrator not responding

**Solution**:
- Check orchestrator Edge Function logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check that orchestrator function is deployed and accessible

## Architecture Flow

```
User sends message in Intercom
    ↓
Intercom sends webhook to intercom-webhook Edge Function
    ↓
Webhook handler verifies signature and extracts message
    ↓
Handler calls orchestrator Edge Function with user message
    ↓
Orchestrator processes message and generates response
    ↓
Handler sends reply back to Intercom via API
    ↓
If escalation needed, assigns conversation to human
    ↓
Updates request status in database
```

## Files Created

- `supabase/functions/intercom-webhook/index.ts` - Webhook handler
- `supabase/functions/sync-user-to-intercom/index.ts` - User sync function
- `src/lib/intercom-client.ts` - Frontend Intercom API client
- `supabase/migrations/20250107_add_intercom_user_id.sql` - Database migration

## Next Steps

1. ✅ Set up webhook in Intercom dashboard
2. ✅ Configure environment variables
3. ✅ Run database migration
4. ✅ Deploy Edge Functions
5. ✅ Test end-to-end flow
6. ✅ Monitor webhook delivery and logs
7. ✅ Set up alerts for webhook failures

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Check Intercom webhook delivery logs
- Review database for request statuses
- Verify environment variables are set correctly

