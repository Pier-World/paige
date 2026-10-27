#!/usr/bin/env node
/**
 * Staff-only accepted-member importer (Standard / free). Does not send email.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/import-accepted-members.mjs ./accepted.csv
 *   # Dry-run is the default. No auth.users are created.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/import-accepted-members.mjs ./accepted.csv --execute
 *   # Local execute. Requires --confirm-production=YES if URL is not localhost.
 *
 *   node scripts/import-accepted-members.mjs --rollback --batch=<uuid>
 *
 * CSV columns: email (required), first_name, last_name or full_name, phone optional,
 * membership_level optional (Standard or empty; unknown values are rejected; paid
 * tiers on NEW rows are still created as Standard and never granted Pier+).
 *
 * ---------------------------------------------------------------------------
 * RUNBOOK (humans; do not skip)
 * ---------------------------------------------------------------------------
 * 1. Reconcile Active Master Member Dashboard + Memberstack + production members.
 *    Work from a COPY of the sheet. Never edit the tab marked don't-edit.
 *    Flag Zap incomplete fields as a ticket; do not block if the reviewed CSV is complete.
 *    Columns: name, email, source(s), already_on_platform, current membership_level,
 *    last_sign_in, include_in_batch, notes. Owners: Laurent + Jess (who is in),
 *    Spencer (platform users). Engineering does not decide membership.
 * 2. External email checks BEFORE any production execute:
 *    - Supabase Auth: confirm-email on/off, SMTP vs default, Auth Hooks, rate limits,
 *      Site URL / redirect allow-list (https://pier.vip). Do not use Dashboard Invite.
 *    - Intercom outbound series on contact created / first seen (w43sil3r).
 *    - Zapier / Make / DB webhooks on auth.users, members, profiles.
 *    Confirm admin.createUser({ email_confirm: true }) will not send mail in this project.
 * 3. Local: dry-run, then --execute against local Supabase. Confirm Inbucket is empty
 *    at create time. Login via /welcome?token= then OTP. Check Events/Partners work
 *    and Deal Flow / Concierge / dashboard deals are gated. Mobile sidebar too.
 * 4. Production dry-run (still no createUser). Review the report.
 * 5. Production execute INTERNAL TEST EMAILS ONLY. Verify no mail at create, welcome
 *    token login, permissions. Then recipient CSV + welcome URLs review.
 * 6. Go/no-go. Only then any outreach (Laurent / Intercom / ops). This script never
 *    sends email. Stop if failed rate is material or any Pier+ row was modified
 *    (this importer never updates membership_level/role on a match).
 *
 * Rollback: --rollback --batch=<id> deletes auth.users whose import rows have
 * action=created for that batch only. Never deletes skipped_existing.
 *
 * What could go wrong:
 * - Pointing .env at production without --confirm-production=YES (blocked).
 * - Orphan profiles.email unique clash (row failed, listed in report).
 * - Intercom/Zapier/Auth hooks outside git sending surprise mail (human checklist).
 * - Importing before PR1 RLS is live would give Standard users deal access via API.
 */
import { createClient } from '@supabase/supabase-js';
import { basename, extname, resolve } from 'path';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import {
  parseCsv,
  runImport,
  rollbackBatch,
  looksLikeProductionUrl,
} from './lib/accepted-members-import.mjs';

function parseArgs(argv) {
  const args = {
    file: null,
    execute: false,
    confirmProduction: '',
    rollback: false,
    batch: null,
    inviteExistingStandard: false,
  };
  for (const arg of argv) {
    if (arg === '--execute') args.execute = true;
    else if (arg === '--rollback') args.rollback = true;
    else if (arg === '--invite-existing-standard') args.inviteExistingStandard = true;
    else if (arg.startsWith('--confirm-production=')) args.confirmProduction = arg.slice('--confirm-production='.length);
    else if (arg.startsWith('--batch=')) args.batch = arg.slice('--batch='.length);
    else if (!arg.startsWith('--')) args.file = arg;
  }
  return args;
}

function loadRecords(filePath) {
  const resolved = resolve(filePath);
  const content = readFileSync(resolved, 'utf8');
  const extension = extname(resolved).toLowerCase();
  if (extension === '.json') {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.records ?? parsed.members ?? [];
  }
  if (extension === '.csv') return parseCsv(content);
  throw new Error('Input must be a .json or .csv file.');
}

function writeReports(result, sourceFilename) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = resolve('import-reports');
  mkdirSync(dir, { recursive: true });
  const base = `${stamp}-${result.dry_run ? 'dry-run' : 'execute'}-${basename(sourceFilename || 'members', extname(sourceFilename || ''))}`;
  const jsonPath = resolve(dir, `${base}.json`);
  const csvPath = resolve(dir, `${base}-welcome-urls.csv`);
  writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  const inviteLines = ['email,welcome_url', ...(result.invites || []).map((row) => `${row.email},${row.welcome_url}`)];
  writeFileSync(csvPath, `${inviteLines.join('\n')}\n`);
  return { jsonPath, csvPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const welcomeBaseUrl = process.env.PIER_WELCOME_BASE_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (args.rollback) {
    if (!args.batch) {
      console.error('Rollback requires --batch=<uuid>.');
      process.exit(1);
    }
    if (looksLikeProductionUrl(supabaseUrl) && args.confirmProduction !== 'YES') {
      console.error('Refusing production rollback without --confirm-production=YES.');
      process.exit(1);
    }
    const result = await rollbackBatch({ supabase, batchId: args.batch });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!args.file) {
    console.error('Usage: node scripts/import-accepted-members.mjs <members.csv|json> [--execute] [--confirm-production=YES]');
    process.exit(1);
  }

  const records = loadRecords(args.file);
  const result = await runImport({
    supabase,
    records,
    sourceFilename: basename(args.file),
    execute: args.execute,
    confirmProduction: args.confirmProduction,
    supabaseUrl,
    welcomeBaseUrl,
    inviteExistingStandard: args.inviteExistingStandard,
  });

  const paths = writeReports(result, args.file);
  console.log(
    JSON.stringify(
      {
        dry_run: result.dry_run,
        batch_id: result.batch_id,
        input_rows: result.input_rows,
        would_create: result.would_create,
        created: result.created,
        skipped_existing: result.skipped_existing,
        rejected: result.rejected,
        failed: result.failed,
        file_duplicates: result.file_duplicates,
        report: paths.jsonPath,
        welcome_csv: paths.csvPath,
      },
      null,
      2
    )
  );

  for (const row of result.rows) {
    console.log(
      `${row.row_number}\t${row.action}\t${row.email}\t${row.error || ''}\t${(row.flags || []).join(',')}`
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
