# Google OAuth Consent Screen Branding

## Issue
The Google OAuth consent screen currently shows `oifchjaqembbkdyfjctp.supabase.co` as the requesting application instead of "Pier" with your logo.

## Solution
Configure the OAuth consent screen in Google Cloud Console to display Pier's branding.

## Steps

### 1. Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with your OAuth credentials)

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace account, then use Internal)
3. Click **Create**

### 3. Fill in App Information
- **App name**: `Pier`
- **User support email**: Your support email (e.g., `hello@joinpier.com`)
- **App logo**: Upload your Pier logo (recommended: 120x120px PNG)
- **App domain**: 
  - **Application home page**: `https://joinpier.com` (or your production domain)
  - **Authorized domains**: Add `joinpier.com` (or your domain)
- **Developer contact information**: Your email

### 4. Configure Scopes
1. Click **Add or Remove Scopes**
2. Add the scopes you're using:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
3. Click **Update** → **Save and Continue**

### 5. Test Users (if in Testing mode)
1. Add test users who can authorize the app
2. Add your own email addresses for testing

### 6. Submit for Verification (if needed)
- If you're requesting sensitive scopes, you'll need to submit for verification
- For basic calendar/email access, you may be able to stay in "Testing" mode

## Result
After configuration, the OAuth consent screen will show:
- **App name**: "Pier" (instead of Supabase domain)
- **App logo**: Your Pier logo
- **Branding**: Professional appearance matching your brand

## Notes
- The redirect URI (`https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/auth-google/callback`) will still be the Supabase domain, but the **app name and logo** will be Pier's
- Users will see "Pier wants to access your Google Account" instead of the Supabase domain
- This improves trust and brand recognition during the OAuth flow

## Troubleshooting: Branding Not Showing

If you've configured everything but still see the Supabase domain instead of "Pier":

### Issue 1: App in "Testing" Mode
**Problem**: Google may show the redirect URI domain for apps in "Testing" mode, especially for external users.

**Solutions**:
1. **Add Supabase Domain to Authorized Domains** (Recommended for Testing):
   - Go to **OAuth consent screen** → **Branding** section
   - Scroll to **"Authorized domains"**
   - Click **"+ ADD DOMAIN"**
   - Add: `supabase.co` (the root domain, not the full subdomain)
   - This allows Google to recognize the Supabase redirect URI as authorized
   - **Note**: You can only add root domains (e.g., `supabase.co`), not subdomains

2. **Publish the App** (Requires Verification):
   - Go to **OAuth consent screen** → **Publishing status**
   - Click **"PUBLISH APP"**
   - This requires Google verification if using sensitive scopes
   - Once published, branding should show for all users

### Issue 2: Logo Not Uploaded or Not Verified
**Problem**: Logo might not be showing if:
- Logo wasn't properly uploaded
- Logo needs verification (for published apps)
- Logo format/size issues

**Solutions**:
1. Verify logo is uploaded:
   - Go to **OAuth consent screen** → **Branding** → **App logo**
   - Ensure logo is visible in the preview
   - Logo should be 120x120px PNG with transparent background

2. For published apps, logo may require verification

### Issue 3: Caching
**Problem**: Google caches consent screens, so changes may take time to propagate.

**Solutions**:
1. **Clear browser cache** or use **incognito/private window**
2. **Wait 5-10 minutes** after making changes
3. **Revoke previous consent**:
   - Go to [Google Account Permissions](https://myaccount.google.com/permissions)
   - Remove the app
   - Try connecting again

### Issue 4: Wrong OAuth Client ID
**Problem**: The OAuth client ID being used might not be associated with the consent screen you configured.

**Solutions**:
1. Verify the `GOOGLE_CLIENT_ID` environment variable matches the client ID in:
   - **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
2. Ensure the client ID is in the same Google Cloud project as the consent screen

### Issue 5: Authorized Domains Mismatch
**Problem**: The redirect URI domain must be authorized.

**Solutions**:
1. Check **OAuth consent screen** → **Branding** → **Authorized domains**
2. Ensure `supabase.co` is listed (or your production domain)
3. The redirect URI domain must match an authorized domain

## Expected Behavior

### In Testing Mode:
- **With authorized domain**: Should show "Pier" with logo (after adding `supabase.co` to authorized domains)
- **Without authorized domain**: May show redirect URI domain for security

### In Published Mode:
- Should always show "Pier" with logo
- Requires Google verification for sensitive scopes

## Production vs Development

**For Development (Current)**:
- Add `supabase.co` to authorized domains
- App can stay in Testing mode
- Branding should work after adding authorized domain

**For Production**:
- Use your production domain (`pier.vip` or `joinpier.com`) in authorized domains
- Consider publishing the app for better branding
- May require verification for sensitive scopes

## Verification
After making changes:
1. **Add `supabase.co` to Authorized Domains** (if not already added)
2. **Wait 5-10 minutes** for changes to propagate
3. **Clear browser cache** or use **incognito window**
4. **Revoke previous consent** at [Google Account Permissions](https://myaccount.google.com/permissions)
5. Try connecting Google Calendar again
6. The consent screen should now show "Pier" with your logo

## Quick Fix Checklist
- [ ] App name is set to "Pier" in OAuth consent screen
- [ ] Logo is uploaded and visible in preview
- [ ] `supabase.co` is added to **Authorized domains**
- [ ] Application home page is set to `https://pier.vip/` (or your domain)
- [ ] OAuth client ID matches the one in environment variables
- [ ] Cleared browser cache / using incognito
- [ ] Revoked previous consent
- [ ] Waited 5-10 minutes after making changes

