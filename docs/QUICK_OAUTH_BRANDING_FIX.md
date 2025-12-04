# Quick Fix: OAuth Branding Not Showing

## The Problem
You've configured "Pier" as the app name and uploaded a logo, but the consent screen still shows `oifchjaqembbkdyfjctp.supabase.co` instead of "Pier".

## The Solution (2 Steps)

### Step 1: Add Supabase Domain to Authorized Domains

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Click on the **"Branding"** tab (should already be selected)
4. Scroll down to the **"App domain"** section
5. Find **"Authorized domains"**
6. Click **"+ ADD DOMAIN"** or **"Add domain"**
7. Enter: `supabase.co` (just the root domain, not the full URL)
8. Click **Save**

**Important**: You can only add root domains (like `supabase.co`), not subdomains (like `oifchjaqembbkdyfjctp.supabase.co`). Google will automatically authorize all subdomains of the root domain.

### Step 2: Clear Cache and Revoke Previous Consent

1. **Revoke previous consent**:
   - Go to [Google Account Permissions](https://myaccount.google.com/permissions)
   - Find "oifchjaqembbkdyfjctp.supabase.co" or "Pier"
   - Click **Remove** or **Revoke access**

2. **Clear browser cache** or use an **incognito/private window**

3. **Wait 5-10 minutes** for Google's changes to propagate

4. **Try connecting again** from your Profile page

## Why This Happens

When your app is in **"Testing"** mode, Google shows the redirect URI domain for security reasons **unless** that domain is in your **Authorized domains** list. By adding `supabase.co` to authorized domains, Google recognizes it as a trusted domain and will show your app name ("Pier") instead.

## Alternative: Publish Your App

If you want branding to work without adding the Supabase domain:

1. Go to **OAuth consent screen** → **Publishing status**
2. Click **"PUBLISH APP"**
3. Complete verification if required (for sensitive scopes)
4. Once published, branding should show for all users

**Note**: Publishing requires verification for sensitive scopes like Gmail and Calendar access, which can take several days.

## Expected Result

After adding `supabase.co` to authorized domains and clearing cache:
- ✅ Consent screen shows **"Pier"** instead of Supabase domain
- ✅ Your logo appears (if uploaded)
- ✅ Users see "Pier wants to access your Google Account"

## Still Not Working?

If it's still not working after following these steps:

1. **Verify OAuth Client ID**: Make sure the `GOOGLE_CLIENT_ID` in your Supabase environment variables matches the client ID in Google Cloud Console → Credentials
2. **Check Logo**: Ensure logo is properly uploaded and visible in the OAuth consent screen preview
3. **Wait Longer**: Sometimes Google takes up to 30 minutes to propagate changes
4. **Check App Status**: Go to OAuth consent screen → Publishing status and verify the app is either in Testing (with authorized domain) or Published

## For Production

When you move to production with your own domain (`pier.vip`):
- Add `pier.vip` to authorized domains
- Update Application home page to `https://pier.vip/`
- Consider publishing the app for better branding
- The Supabase domain can remain for development/testing

