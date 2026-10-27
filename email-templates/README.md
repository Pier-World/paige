# Pier Email Templates for Supabase

These email templates are designed to match Pier's branding and work on both desktop and mobile.

## How to Use

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. Click on each email type
3. Copy the HTML content from the corresponding file below
4. Paste into the "Source" tab in Supabase
5. Save

## Template Files

| Email Type | File |
|------------|------|
| Confirm Sign Up | `confirm-signup.html` |
| Invite User | `invite-user.html` — Set **subject** to "You're invited to Pier" in Supabase. |
| Magic Link | `magic-link.html` — Set **subject** to "Your Pier sign-in code" in Supabase. |
| Change Email Address | `change-email.html` — Set **subject** to "Confirm your new email" in Supabase. |
| Reset Password | `reset-password.html` — Set **subject** to "Reset your password" in Supabase. |
| Reauthentication | `reauthentication.html` |

## Template Variables

Supabase uses these variables in templates:
- `{{ .Token }}` - The OTP token (6-digit code)
- `{{ .TokenHash }}` - Hashed token for a link our app verifies after a click
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address
- `{{ .NewEmail }}` - New email address, on the Change Email Address template only

Do not use `{{ .ConfirmationURL }}`. That URL is `GET /auth/v1/verify`, and mail security scanners (Microsoft Safe Links and similar) open it before the member does. The one-time token is spent, and the 6-digit code in the same email then fails as expired. Links go to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...`, and that page calls `verifyOtp` only when the member clicks Continue.

## Branding

Invite, magic link, change email, and reset password use the current palette:

- Page: `#F6F4EF` (parchment)
- Card: `#FFFFFF`
- Ink: `#0B0E10`
- Slate: `#6B6F76`
- Gilt: `#B8925A`
- Border: `#E2E0DA`

Confirm sign up and reauthentication still use the previous dark templates.
