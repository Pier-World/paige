/**
 * Pure helpers + injectable importer for accepted Standard (free) members.
 * Never maps unknown → Premium. Never calls signInWithOtp / inviteUserByEmail / generateLink.
 */
import { createHash, randomBytes } from 'crypto';

export const KNOWN_MEMBERSHIP_LEVELS = ['Standard', 'Premium', 'Executive', 'Founding Member'];
export const PIER_PLUS_MEMBERSHIP_LEVELS = ['Premium', 'Executive', 'Founding Member'];
export const INVITE_TTL_DAYS = 14;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function looksLikeProductionUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(host)) return false;
    return true;
  } catch {
    return true;
  }
}

export function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? '']))
  );
}

export function splitName(record) {
  const first = String(record.first_name || record.firstName || '').trim();
  const last = String(record.last_name || record.lastName || '').trim();
  if (first || last) {
    return { first_name: first || last, last_name: last || 'Member' };
  }
  const full = String(record.full_name || record.fullName || record.name || '').trim();
  if (!full) return { first_name: '', last_name: '' };
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first_name: parts[0], last_name: 'Member' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export function parseRequestedTier(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { ok: true, requested: null };
  if (KNOWN_MEMBERSHIP_LEVELS.includes(raw)) return { ok: true, requested: raw };
  return { ok: false, requested: raw, error: `unknown membership_level "${raw}"` };
}

export function plusAddressLocalPart(email) {
  const [local] = email.split('@');
  return local.includes('+') ? local : null;
}

export function hashInviteToken(rawToken) {
  return createHash('sha256').update(String(rawToken).trim(), 'utf8').digest('hex');
}

export function createInviteToken() {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashInviteToken(raw) };
}

export function welcomeUrl(baseUrl, rawToken) {
  const origin = String(baseUrl || 'https://pier.vip').replace(/\/$/, '');
  return `${origin}/welcome?token=${encodeURIComponent(rawToken)}`;
}

export function shouldSendAccessEmail(value) {
  return value !== false;
}

function indexByNormalizedEmail(rows, emailKey = 'email') {
  const map = new Map();
  for (const row of rows || []) {
    const key = normalizeEmail(row[emailKey]);
    if (key) map.set(key, row);
  }
  return map;
}

export function classifyRecord(record, index, existing, options = {}) {
  const email = normalizeEmail(record.email);
  const name = splitName(record);
  const errors = [];
  const flags = [];

  if (!looksLikeEmail(email)) errors.push('email is required and must look like an email');
  if (!name.first_name && !name.last_name) errors.push('name is required (first_name/last_name or full_name)');

  const tier = parseRequestedTier(record.membership_level || record.membershipLevel || record.tier);
  if (!tier.ok) errors.push(tier.error);

  if (plusAddressLocalPart(email)) flags.push('plus_address');

  const member = existing.members.get(email);
  const profile = existing.profiles.get(email);

  let action = 'would_create';
  let error = errors.length ? errors.join('; ') : null;

  if (errors.length) {
    action = 'rejected';
  } else if (member) {
    action = 'skipped_existing';
  } else if (profile && profile.id) {
    action = 'failed';
    error = 'orphan_profile_email_clash';
  }

  return {
    index,
    row_number: index + 1,
    email,
    first_name: name.first_name,
    last_name: name.last_name,
    phone: String(record.phone || '').trim() || null,
    requested_tier: tier.requested,
    action,
    error,
    flags,
    existing_member: member
      ? {
          id: member.id,
          membership_level: member.membership_level,
          role: member.role,
        }
      : null,
    inviteExistingStandard: Boolean(options.inviteExistingStandard),
  };
}

export function dedupeRecords(records) {
  const seen = new Map();
  const unique = [];
  const duplicates = [];
  records.forEach((record, index) => {
    const email = normalizeEmail(record.email);
    if (email && seen.has(email)) {
      duplicates.push({ row: index + 1, email, first_row: seen.get(email) + 1 });
      return;
    }
    if (email) seen.set(email, index);
    unique.push({ record, index });
  });
  return { unique, duplicates };
}

export function loadExistingIndexes({ members = [], profiles = [] }) {
  return {
    members: indexByNormalizedEmail(members),
    profiles: indexByNormalizedEmail(profiles),
  };
}

function assertNoMailCalls(auth) {
  const forbidden = ['signInWithOtp', 'inviteUserByEmail', 'generateLink'];
  for (const name of forbidden) {
    if (typeof auth?.[name] === 'function') {
      const original = auth[name];
      auth[name] = async (...args) => {
        throw new Error(`${name} is forbidden during member import`);
      };
      auth[`${name}__original`] = original;
    }
    if (typeof auth?.admin?.[name] === 'function') {
      const original = auth.admin[name];
      auth.admin[name] = async () => {
        throw new Error(`auth.admin.${name} is forbidden during member import`);
      };
      auth.admin[`${name}__original`] = original;
    }
  }
}

export async function runImport({
  supabase,
  records,
  sourceFilename = 'stdin.csv',
  execute = false,
  confirmProduction = '',
  supabaseUrl = '',
  welcomeBaseUrl = 'https://pier.vip',
  inviteExistingStandard = false,
  now = () => new Date(),
}) {
  if (!supabase) throw new Error('supabase client is required');
  if (execute && looksLikeProductionUrl(supabaseUrl) && confirmProduction !== 'YES') {
    throw new Error(
      'Refusing to execute against a non-local URL. Pass --confirm-production=YES after human review.'
    );
  }

  assertNoMailCalls(supabase.auth);

  const { unique, duplicates } = dedupeRecords(records);
  const { data: memberRows, error: memberError } = await supabase
    .from('members')
    .select('id, email, membership_level, role');
  if (memberError) throw new Error(`Unable to read members: ${memberError.message}`);

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, email');
  if (profileError) throw new Error(`Unable to read profiles: ${profileError.message}`);

  const existing = loadExistingIndexes({ members: memberRows, profiles: profileRows });
  const classified = unique.map(({ record, index }) =>
    classifyRecord(record, index, existing, { inviteExistingStandard })
  );

  const summary = {
    input_rows: records.length,
    unique_emails: unique.length,
    file_duplicates: duplicates,
    would_create: classified.filter((row) => row.action === 'would_create').length,
    skipped_existing: classified.filter((row) => row.action === 'skipped_existing').length,
    rejected: classified.filter((row) => row.action === 'rejected').length,
    failed: classified.filter((row) => row.action === 'failed').length,
    created: 0,
    invites: [],
    rows: classified,
    dry_run: !execute,
  };

  if (!execute) {
    return { ...summary, batch_id: null };
  }

  const { data: batch, error: batchError } = await supabase
    .from('member_import_batches')
    .insert({
      source_filename: sourceFilename,
      source_record_count: records.length,
      dry_run: false,
      status: 'processing',
    })
    .select('id')
    .single();
  if (batchError) throw new Error(`Unable to create import batch: ${batchError.message}`);

  const created = [];
  const invites = [];
  const persisted = [];

  for (const row of classified) {
    let action = row.action;
    let authUserId = row.existing_member?.id || null;
    let error = row.error;

    if (action === 'would_create') {
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: row.email,
        email_confirm: true,
        user_metadata: {
          first_name: row.first_name,
          last_name: row.last_name,
        },
      });

      if (createError || !authData?.user) {
        action = 'failed';
        error = createError?.message || 'createUser returned no user';
      } else {
        authUserId = authData.user.id;
        const { data: updatedMember, error: upsertError } = await supabase
          .from('members')
          .update({
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone,
            role: 'member',
            membership_level: 'Standard',
            stripe_customer_id: null,
            subscription_status: null,
            subscription_tier: null,
            trial_ends_at: null,
            cards: [],
            onboarding_completed: false,
            preferences: { interests: [], preferred_cities: [] },
            updated_at: now().toISOString(),
          })
          .eq('id', authUserId)
          .select('id')
          .maybeSingle();

        if (upsertError || !updatedMember) {
          await supabase.auth.admin.deleteUser(authUserId);
          action = 'failed';
          error = upsertError?.message
            ? `member update failed: ${upsertError.message}`
            : 'member stub missing after createUser';
          authUserId = null;
        } else {
          await supabase.from('profiles').upsert(
            {
              id: authUserId,
              email: row.email,
              full_name: `${row.first_name} ${row.last_name}`.trim(),
              onboarding_completed: false,
              metadata: { source: 'accepted_member_import' },
              updated_at: now().toISOString(),
            },
            { onConflict: 'id' }
          );
          action = 'created';
          created.push(authUserId);

          const token = createInviteToken();
          const expiresAt = new Date(now().getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
          const { error: inviteError } = await supabase.from('member_invites').insert({
            member_id: authUserId,
            batch_id: batch.id,
            email: row.email,
            token_hash: token.hash,
            expires_at: expiresAt.toISOString(),
          });
          if (inviteError) {
            error = `created but invite insert failed: ${inviteError.message}`;
          } else {
            invites.push({
              email: row.email,
              welcome_url: welcomeUrl(welcomeBaseUrl, token.raw),
            });
          }
        }
      }
    }

    persisted.push({
      batch_id: batch.id,
      row_number: row.row_number,
      email: row.email,
      normalized_email: row.email,
      action,
      auth_user_id: authUserId,
      member_id: authUserId,
      error,
      details: {
        flags: row.flags,
        requested_tier: row.requested_tier,
        existing_membership_level: row.existing_member?.membership_level || null,
        existing_role: row.existing_member?.role || null,
      },
    });
  }

  if (persisted.length) {
    const { error: rowsError } = await supabase.from('member_import_rows').insert(persisted);
    if (rowsError) throw new Error(`Unable to log import rows: ${rowsError.message}`);
  }

  const createdCount = persisted.filter((row) => row.action === 'created').length;
  const skippedCount = persisted.filter((row) => row.action === 'skipped_existing').length;
  const failedCount = persisted.filter((row) => ['failed', 'rejected'].includes(row.action)).length;

  await supabase
    .from('member_import_batches')
    .update({
      created_count: createdCount,
      skipped_existing_count: skippedCount,
      failed_count: failedCount,
      status: failedCount > 0 && createdCount === 0 ? 'failed' : 'imported',
      updated_at: now().toISOString(),
      report: { file_duplicates: duplicates },
    })
    .eq('id', batch.id);

  return {
    ...summary,
    dry_run: false,
    created: createdCount,
    skipped_existing: skippedCount,
    failed: failedCount + summary.rejected,
    invites,
    batch_id: batch.id,
    created_ids: created,
    rows: classified.map((row, i) => ({ ...row, action: persisted[i]?.action || row.action, error: persisted[i]?.error || row.error })),
  };
}

export async function rollbackBatch({ supabase, batchId }) {
  const { data: rows, error } = await supabase
    .from('member_import_rows')
    .select('auth_user_id, action')
    .eq('batch_id', batchId)
    .eq('action', 'created');
  if (error) throw new Error(`Unable to load batch rows: ${error.message}`);

  const ids = [...new Set((rows || []).map((row) => row.auth_user_id).filter(Boolean))];
  const deleted = [];
  const failures = [];
  for (const id of ids) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
    if (deleteError) failures.push({ id, error: deleteError.message });
    else deleted.push(id);
  }

  await supabase
    .from('member_import_batches')
    .update({ status: 'rolled_back', notes: `Deleted ${deleted.length} created auth users` })
    .eq('id', batchId);

  return { deleted, failures };
}
