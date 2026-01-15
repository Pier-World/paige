# Troubleshooting 401 Error on Intercom Webhook

## Issue
The webhook is returning 401 Unauthorized even though the code should allow test requests without signatures.

## Root Cause Analysis

The 401 error is coming from the signature verification logic. Even though we've updated the code to allow requests without signatures, the function might not be running the latest version.

## Solution Steps

### 1. Verify Function is Deployed

Check that the latest code is deployed:

```bash
supabase functions deploy intercom-webhook
```

### 2. Check Function Logs

After deploying, check the logs to see what's happening:

```bash
supabase functions logs intercom-webhook --tail
```

Look for these log messages:
- `📥 Webhook request received` - confirms function is running
- `📋 Request headers:` - shows what headers are present
- `🔍 Signature check decision:` - shows the decision logic
- `ℹ️ No signature header - ALLOWING REQUEST` - confirms test requests are allowed

### 3. Verify Environment Variables

Check if `INTERCOM_WEBHOOK_SECRET` is set:

```bash
supabase secrets list
```

**Important**: If you're testing without the webhook secret, make sure it's NOT set:
```bash
# Remove the secret if it exists
supabase secrets unset INTERCOM_WEBHOOK_SECRET
```

### 4. Test the Function Directly

You can test the function with a GET request to verify it's running:

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

### 5. Test with a Simple POST

Test with a minimal payload:

```bash
curl -X POST https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/intercom-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {}}'
```

Check the logs to see what happens.

## Expected Behavior

With the latest code:

1. **No signature header + No secret** → ✅ Allow (200 OK)
2. **No signature header + Secret set** → ✅ Allow (200 OK) 
3. **Signature header + No secret** → ✅ Allow (200 OK)
4. **Signature header + Secret set + Valid signature** → ✅ Allow (200 OK)
5. **Signature header + Secret set + Invalid signature** → ❌ Reject (401)

## Debugging Checklist

- [ ] Function has been redeployed with latest code
- [ ] Logs show the request is being received
- [ ] Logs show "ALLOWING REQUEST" message
- [ ] `INTERCOM_WEBHOOK_SECRET` is either not set OR set correctly
- [ ] No other middleware or authentication is blocking the request
- [ ] Function execution_id is not null in the invocation details

## If Still Getting 401

1. **Check the actual logs** - The logs will show exactly what decision is being made
2. **Verify deployment** - Make sure the function was actually deployed (check deployment_id changes)
3. **Check for cached responses** - Try waiting a minute and testing again
4. **Verify the code** - Check that the latest code is in the repository

## Code Logic Flow

```
Request arrives
  ↓
Log: "📥 Webhook request received"
  ↓
Get raw body
  ↓
Check for signature headers
  ↓
Log: "📋 Request headers" (shows what's present)
  ↓
Determine: hasSecret && hasSignature
  ↓
If (hasSignature && hasSecret):
  → Verify signature
  → If invalid: Return 401
  → If valid: Continue
Else:
  → Log: "ALLOWING REQUEST"
  → Continue
  ↓
Parse JSON payload
  ↓
Process webhook
  ↓
Return 200 OK
```

## Next Steps

1. Redeploy the function
2. Test again from Intercom
3. Check the logs immediately after the test
4. Share the log output if still getting 401

