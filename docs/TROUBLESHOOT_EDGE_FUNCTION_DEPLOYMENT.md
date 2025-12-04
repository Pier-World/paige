# Troubleshooting Edge Function Deployment Issues

## Problem: Code Reverts When Deploying

If your edge function code keeps reverting to a previous version when you try to deploy, here are the most common causes and solutions:

## Solution 1: Use Supabase CLI (Recommended)

The dashboard editor can have caching issues. Using the CLI is more reliable:

### Step 1: Install Supabase CLI (if not installed)

```bash
# Check if installed
which supabase

# If not installed, install via npm
npm install -g supabase

# Or via Homebrew (Mac)
brew install supabase/tap/supabase
```

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project (replace with your project ref)
supabase link --project-ref oifchjaqembbkdyfjctp
```

### Step 3: Deploy Function

```bash
# Deploy orchestrator
cd /Users/spencerchandlee/paige
supabase functions deploy orchestrator

# Deploy travel-agent (if needed)
supabase functions deploy travel-agent
```

This will deploy directly from your local files, bypassing any dashboard caching issues.

## Solution 2: Clear Browser Cache

If using the dashboard:

1. **Hard refresh the dashboard:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Clear browser cache:**
   - Go to browser settings
   - Clear cache and cookies for supabase.com
   - Reload the dashboard

3. **Try incognito/private mode:**
   - Open Supabase dashboard in incognito window
   - This bypasses all cache

## Solution 3: Verify Local File is Correct

Before deploying, verify your local file has the changes:

```bash
# Check the file has your changes
grep -n "relatedTaskId" supabase/functions/orchestrator/index.ts

# View recent changes
git diff supabase/functions/orchestrator/index.ts
```

## Solution 4: Manual Copy-Paste Method

If dashboard keeps reverting:

1. **Open your local file:**
   ```bash
   cat supabase/functions/orchestrator/index.ts
   ```

2. **Copy the ENTIRE file** (Cmd+A / Ctrl+A, then Cmd+C / Ctrl+C)

3. **In Supabase Dashboard:**
   - Go to Edge Functions → orchestrator
   - Click "Edit"
   - Select ALL (Cmd+A / Ctrl+A)
   - Delete everything
   - Paste your new code
   - **Wait 2-3 seconds** before clicking Deploy
   - Click Deploy

4. **Verify deployment:**
   - Check the "Code" tab after deployment
   - Search for a unique string from your code (e.g., "relatedTaskId")
   - Confirm it's there

## Solution 5: Delete and Recreate Function

If nothing else works:

1. **Backup your code:**
   ```bash
   cp supabase/functions/orchestrator/index.ts supabase/functions/orchestrator/index.ts.backup
   ```

2. **Delete the function in dashboard:**
   - Go to Edge Functions
   - Click on `orchestrator`
   - Click "Delete" or "Remove"

3. **Create new function:**
   - Click "Create function"
   - Name: `orchestrator`
   - Copy entire contents of `supabase/functions/orchestrator/index.ts`
   - Paste and deploy

## Solution 6: Check for Syntax Errors

The dashboard might be rejecting your code due to syntax errors:

1. **Check for TypeScript errors locally:**
   ```bash
   # If you have TypeScript installed
   npx tsc --noEmit supabase/functions/orchestrator/index.ts
   ```

2. **Look for common issues:**
   - Missing imports
   - Unclosed brackets/parentheses
   - Type errors (though Deno is more lenient)

## Quick Verification Script

After deploying, verify the deployment worked:

```bash
# Test the function
curl -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/orchestrator/chat" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "message": "test"
  }'
```

If you get a response (even an error), the function is deployed. Check the logs to see if your code is running.

## Recommended Approach

**Best practice:** Use Supabase CLI for deployments:

```bash
# One-time setup
supabase login
supabase link --project-ref oifchjaqembbkdyfjctp

# Every time you make changes
supabase functions deploy orchestrator
```

This ensures:
- ✅ Code deploys from your local files (no copy-paste errors)
- ✅ No browser cache issues
- ✅ Faster deployment
- ✅ Can be automated in CI/CD

## Still Having Issues?

If none of these work:

1. **Check Supabase status:** https://status.supabase.com
2. **Check function logs** in dashboard for error messages
3. **Try deploying a different function** to see if it's function-specific
4. **Contact Supabase support** with:
   - Function name
   - Error messages from logs
   - Steps you've tried

