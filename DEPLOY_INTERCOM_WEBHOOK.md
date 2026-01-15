# Deploy Intercom Webhook - Fix 401 Error

## The Problem
The function is returning 401 before our code even runs. This is Supabase's authentication layer blocking the request.

## Solution: Configure via Supabase Dashboard

Since the config file approach isn't working, we need to configure it directly in the Supabase Dashboard:

### Step 1: Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/oifchjaqembbkdyfjctp
2. Go to **Edge Functions** in the left sidebar
3. Click on **intercom-webhook**

### Step 2: Configure Authentication
1. Look for **Settings** or **Configuration** tab
2. Find **"Verify JWT"** or **"Require Authentication"** setting
3. **Disable** it (toggle OFF)

### Step 3: Alternative - Use Supabase Management API

If there's no UI toggle, you can use the Supabase Management API:

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens

curl -X PATCH \
  "https://api.supabase.com/v1/projects/oifchjaqembbkdyfjctp/functions/intercom-webhook" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verify_jwt": false
  }'
```

### Step 4: Verify It Works

After configuring:

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

## If Dashboard Doesn't Have the Setting

Some Supabase projects might not have this setting in the UI. In that case:

1. **Check Supabase CLI version** - Make sure you're using the latest:
   ```bash
   supabase --version
   # Should be 1.200.0 or later
   ```

2. **Try deploying with explicit flag**:
   ```bash
   supabase functions deploy intercom-webhook --no-verify-jwt
   ```

3. **Or use the config.toml approach** - Make sure `supabase/config.toml` has:
   ```toml
   [functions.intercom-webhook]
   verify_jwt = false
   ```
   
   Then deploy:
   ```bash
   supabase functions deploy intercom-webhook
   ```

## Last Resort: Handle Auth in Code

If none of the above works, we can modify the function to accept requests with an optional anon key, but this is less secure. However, since the 401 happens BEFORE our code runs, this won't work.

The real solution is to configure Supabase to allow public access to this function endpoint.

