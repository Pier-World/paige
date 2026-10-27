# Staff scripts

## Accepted members (Standard / free)

This tool never sends email. Dry-run is the default. Do not run `--execute` against production until the checklists below are done.

Dry-run (default, no `createUser`, no mail):

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run import:accepted-members -- ./accepted.csv
```

Execute locally:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=... \
PIER_WELCOME_BASE_URL=http://localhost:5173 \
npm run import:accepted-members -- ./accepted.csv --execute
```

Production execute requires `--confirm-production=YES` after the human checklists below. Do not send email from this tool.

### Reconcile (before any `--execute`)

- Work from a **copy** of the Active Master Member Dashboard. Never edit the tab marked don't-edit.
- Reconcile sheet accepted ∩ Memberstack accepted ∩ production `members.email`.
- Columns: name, email, source(s), already_on_platform, current `membership_level`, last_sign_in, include_in_batch, notes.
- Flag duplicates, outdated emails, staff/test/declined, and anyone already Pier+.
- Flag Zap incomplete fields as a ticket; do not block if the reviewed CSV is complete.
- Owners: Laurent + Jess (who is in), Spencer (platform users). Engineering does not decide membership.

### External email-suppression checks (before production execute)

- Supabase Auth: confirm-email on/off, SMTP vs default, Auth Hooks, rate limits, Site URL / redirect allow-list (`https://pier.vip`). Do not use Dashboard Invite.
- Intercom outbound series on contact created / first seen (`w43sil3r`).
- Zapier / Make / DB webhooks on `auth.users`, `members`, `profiles`.
- Confirm `admin.createUser({ email_confirm: true })` does not send mail in this project.
- Local `--execute` first: Inbucket must be empty at create time. OTP only after the person clicks Continue on `/welcome`.

### Go/no-go (before any outreach)

- Internal test batch only, then recipient CSV + welcome URLs reviewed.
- Login via `/welcome?token=` → OTP works; expired token shows “Link expired”.
- Events/Partners (including redemption) work; Deal Flow / Concierge / dashboard deals are gated.
- Stop if failed rate is material or any Pier+ row was modified.
- **Go/no-go.** Only then outreach (Laurent / Intercom / ops). This script never sends.

Rollback: `node scripts/import-accepted-members.mjs --rollback --batch=<uuid>` deletes `auth.users` whose import rows have `action=created` for that batch only. Never deletes `skipped_existing`.

Full runbook duplicate: comment block at the top of `scripts/import-accepted-members.mjs`.

## Capital deals

```bash
npm run import:capital-deals -- ./deals.csv
```
