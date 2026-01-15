# Fix 401 Error on Intercom Webhook - Complete Guide

## Root Cause
The 401 error happens **before** our function code runs. This is Supabase's authentication middleware blocking the request. The `execution_id: null` in the error confirms the function never executed.

## Why Config File Might Not Work

The `supabase.functions.config.json` file might not be included in deployments. This can happen if:
1. The CLI doesn't automatically bundle it
2. The file format isn't recognized
3. The deployment process ignores it

## Solutions (Try in Order)

### Solution 1: Verify Config File is Deployed

Check if the config file is actually in the deployment:

```bash
# List files that will be deployed
ls -la supabase/functions/intercom-webhook/

# Should show:
# - index.ts
# - supabase.functions.config.json
```

If the config file is missing, the CLI might not be including it.

### Solution 2: Configure via Supabase Dashboard

**This is the most reliable method:**

1. Go to: https://supabase.com/dashboard/project/oifchjaqembbkdyfjctp/functions
2. Click on **intercom-webhook**
3. Go to **Settings** tab (or look for configuration options)
4. Find **"Verify JWT"** or **"Require Authentication"**
5. **Toggle it OFF**

If you don't see this setting, your Supabase project might not support it in the UI yet.

### Solution 3: Use Supabase Management API

Configure via API (most reliable):

```bash
# First, get your access token from:
# https://supabase.com/dashboard/account/tokens

# Then update the function config:
curl -X PATCH \
  "https://api.supabase.com/v1/projects/oifchjaqembbkdyfjctp/functions/intercom-webhook/config" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verify_jwt": false
  }'
```

### Solution 4: Deploy with Explicit Config

Try deploying with the config file explicitly:

```bash
# Make sure config file exists
cat supabase/functions/intercom-webhook/supabase.functions.config.json

# Deploy with verbose output
supabase functions deploy intercom-webhook --debug

# Check if config file is mentioned in output
```

### Solution 5: Use Anon Key in Requests (Workaround)

As a temporary workaround, you could modify Intercom to send the anon key, but this is not ideal:

1. Get your anon key from Supabase Dashboard → Settings → API
2. Configure Intercom webhook to include header:
   ```
   Authorization: Bearer YOUR_ANON_KEY
   ```

But this requires Intercom to support custom headers, which it might not.

## Recommended Approach

**Try Solution 2 (Dashboard) first** - it's the most reliable. If that doesn't work, use **Solution 3 (Management API)**.

## Verify It's Fixed

After applying any solution:

```bash
curl https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/intercom-webhook
```

Should return:
```json
{
  "status": "ok",
  "version": "2.0",
  "message": "Intercom webhook handler is running"
}
```

If you still get 401, the configuration didn't apply. Try the next solution.

