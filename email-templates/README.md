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
| Invite User | `invite-user.html` |
| Magic Link | `magic-link.html` — Set **subject** to "Welcome to Pier" in Supabase (used for login and new-member sign-in). |
| Change Email Address | `change-email.html` |
| Reset Password | `reset-password.html` |
| Reauthentication | `reauthentication.html` |

## Template Variables

Supabase uses these variables in templates:
- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - The OTP token (6-digit code)
- `{{ .TokenHash }}` - Hashed token for URL
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Branding

- Primary Background: `#0a0a0a` (near black)
- Card Background: `#141414`
- Accent Color: `#c9b896` (gold/tan)
- Text Primary: `#ffffff`
- Text Secondary: `#a0a0a0`
- Border: `#2a2a2a`
