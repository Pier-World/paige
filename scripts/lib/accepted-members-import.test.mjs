import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  classifyRecord,
  dedupeRecords,
  hashInviteToken,
  loadExistingIndexes,
  looksLikeProductionUrl,
  normalizeEmail,
  parseRequestedTier,
  runImport,
  shouldSendAccessEmail,
  splitName,
} from './accepted-members-import.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  Ada@Example.COM '), 'ada@example.com');
});

test('splitName uses full_name when needed', () => {
  assert.deepEqual(splitName({ full_name: 'Ada Lovelace' }), {
    first_name: 'Ada',
    last_name: 'Lovelace',
  });
  assert.deepEqual(splitName({ first_name: 'Ada' }), { first_name: 'Ada', last_name: 'Member' });
});

test('unknown tier in CSV is rejected and never mapped to Premium', () => {
  const parsed = parseRequestedTier('Pro');
  assert.equal(parsed.ok, false);
  const existing = loadExistingIndexes({ members: [], profiles: [] });
  const row = classifyRecord({ email: 'ada@example.com', full_name: 'Ada Lovelace', membership_level: 'Gold' }, 0, existing);
  assert.equal(row.action, 'rejected');
  assert.match(row.error, /unknown membership_level/);
});

test('empty tier is Standard-bound (would_create)', () => {
  const existing = loadExistingIndexes({ members: [], profiles: [] });
  const row = classifyRecord({ email: 'ada@example.com', full_name: 'Ada Lovelace' }, 0, existing);
  assert.equal(row.action, 'would_create');
  assert.equal(row.requested_tier, null);
});

test('existing Premium is skipped and not overwritten', () => {
  const existing = loadExistingIndexes({
    members: [{ id: 'prem-1', email: 'vip@example.com', membership_level: 'Premium', role: 'member' }],
    profiles: [],
  });
  const row = classifyRecord(
    { email: 'vip@example.com', full_name: 'Existing Vip', membership_level: 'Standard' },
    0,
    existing
  );
  assert.equal(row.action, 'skipped_existing');
  assert.equal(row.existing_member.membership_level, 'Premium');
});

test('file dedupe keeps the first email', () => {
  const { unique, duplicates } = dedupeRecords([
    { email: 'a@x.com' },
    { email: 'A@x.com' },
    { email: 'b@x.com' },
  ]);
  assert.equal(unique.length, 2);
  assert.equal(duplicates.length, 1);
});

test('production URL guard', () => {
  assert.equal(looksLikeProductionUrl('http://127.0.0.1:54321'), false);
  assert.equal(looksLikeProductionUrl('https://oifchjaqembbkdyfjctp.supabase.co'), true);
  assert.equal(looksLikeProductionUrl('https://pier.vip'), true);
});

test('sendAccessEmail defaults true and false skips', () => {
  assert.equal(shouldSendAccessEmail(undefined), true);
  assert.equal(shouldSendAccessEmail(true), true);
  assert.equal(shouldSendAccessEmail(false), false);
});

test('create-member source defaults sendAccessEmail true and skips OTP when false', () => {
  const src = readFileSync(join(root, 'supabase/functions/create-member/index.ts'), 'utf8');
  assert.match(src, /sendAccessEmail !== false/);
  assert.match(src, /if \(sendAccessEmail\)/);
  assert.doesNotMatch(src, /inviteUserByEmail/);
  assert.doesNotMatch(src, /generateLink/);
});

test('dry-run does not createUser and never calls OTP/invite APIs', async () => {
  const calls = { createUser: 0, signInWithOtp: 0, inviteUserByEmail: 0, generateLink: 0 };
  const supabase = {
    from(table) {
      return {
        select() {
          return Promise.resolve({ data: table === 'members' ? [] : [], error: null });
        },
        insert() {
          throw new Error(`dry-run must not insert ${table}`);
        },
        update() {
          throw new Error(`dry-run must not update ${table}`);
        },
        upsert() {
          throw new Error(`dry-run must not upsert ${table}`);
        },
      };
    },
    auth: {
      signInWithOtp: async () => {
        calls.signInWithOtp += 1;
        return { data: null, error: null };
      },
      admin: {
        createUser: async () => {
          calls.createUser += 1;
          return { data: { user: { id: 'new' } }, error: null };
        },
        inviteUserByEmail: async () => {
          calls.inviteUserByEmail += 1;
        },
        generateLink: async () => {
          calls.generateLink += 1;
        },
      },
    },
  };

  const result = await runImport({
    supabase,
    records: [{ email: 'new@example.com', full_name: 'New Person' }],
    execute: false,
    supabaseUrl: 'http://127.0.0.1:54321',
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.would_create, 1);
  assert.equal(calls.createUser, 0);
  assert.equal(calls.signInWithOtp, 0);
  assert.equal(calls.inviteUserByEmail, 0);
  assert.equal(calls.generateLink, 0);
});

test('execute against production URL without confirm throws and does not createUser', async () => {
  let created = 0;
  const supabase = {
    from() {
      return { select: async () => ({ data: [], error: null }) };
    },
    auth: {
      admin: {
        createUser: async () => {
          created += 1;
          return { data: { user: { id: 'x' } }, error: null };
        },
      },
    },
  };
  await assert.rejects(
    () =>
      runImport({
        supabase,
        records: [{ email: 'a@b.co', full_name: 'A B' }],
        execute: true,
        supabaseUrl: 'https://oifchjaqembbkdyfjctp.supabase.co',
      }),
    /confirm-production/
  );
  assert.equal(created, 0);
});

test('execute creates users as Standard and never calls OTP/invite APIs', async () => {
  const calls = { createUser: 0, signInWithOtp: 0, inviteUserByEmail: 0, generateLink: 0, inserts: [] };
  const chain = (result) => {
    const api = {
      select: () => api,
      insert: (rows) => {
        calls.inserts.push(rows);
        return api;
      },
      update: () => api,
      upsert: () => api,
      eq: () => api,
      maybeSingle: async () => result,
      single: async () => result,
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return api;
  };

  const supabase = {
    from(table) {
      if (table === 'members' || table === 'profiles') {
        return {
          select: async () => ({ data: [], error: null }),
          update: () => chain({ data: { id: 'user-1' }, error: null }),
          upsert: () => chain({ data: { id: 'user-1' }, error: null }),
          insert: (rows) => {
            calls.inserts.push({ table, rows });
            return chain({ data: { id: 'batch-1' }, error: null });
          },
        };
      }
      return {
        insert: (rows) => {
          calls.inserts.push({ table, rows });
          return chain({ data: { id: table === 'member_import_batches' ? 'batch-1' : 'row-1' }, error: null });
        },
        update: () => chain({ data: null, error: null }),
        select: () => chain({ data: { id: 'batch-1' }, error: null }),
      };
    },
    auth: {
      signInWithOtp: async () => {
        calls.signInWithOtp += 1;
        return { data: null, error: null };
      },
      admin: {
        createUser: async (payload) => {
          calls.createUser += 1;
          assert.equal(payload.email_confirm, true);
          assert.equal(payload.email, 'new@example.com');
          return { data: { user: { id: 'user-1' } }, error: null };
        },
        inviteUserByEmail: async () => {
          calls.inviteUserByEmail += 1;
        },
        generateLink: async () => {
          calls.generateLink += 1;
        },
        deleteUser: async () => ({ data: null, error: null }),
      },
    },
  };

  const result = await runImport({
    supabase,
    records: [{ email: 'new@example.com', full_name: 'New Person' }],
    execute: true,
    supabaseUrl: 'http://127.0.0.1:54321',
    welcomeBaseUrl: 'http://localhost:5173',
  });

  assert.equal(calls.createUser, 1);
  assert.equal(calls.signInWithOtp, 0);
  assert.equal(calls.inviteUserByEmail, 0);
  assert.equal(calls.generateLink, 0);
  assert.equal(result.created, 1);
  assert.equal(result.invites.length, 1);
  assert.match(result.invites[0].welcome_url, /\/welcome\?token=/);
});

test('invite hash is sha256 hex', () => {
  assert.equal(hashInviteToken('abc').length, 64);
});

test('TypeScript isPierPlus uses membership_level only; admin is staff, not Pier+', () => {
  const src = readFileSync(join(root, 'src/lib/membership.ts'), 'utf8');
  assert.match(src, /'Premium', 'Executive', 'Founding Member'/);
  assert.match(src, /return membershipIsPierPlus\(user.membership_level\)/);
  assert.match(src, /export function isStaffAdmin/);
  assert.doesNotMatch(src, /unknown → Premium|unknown -> Premium/);
});

test('UpgradePrompt uses Pier+ copy and a request CTA, not Stripe checkout', () => {
  const src = readFileSync(join(root, 'src/components/capital-markets/UpgradePrompt.tsx'), 'utf8');
  assert.match(src, /Pier\+/);
  assert.match(src, /Request upgrade/);
  assert.doesNotMatch(src, /checkout|Stripe/);
});

test('client cannot self-promote: updateMembershipLevel is gone', () => {
  const src = readFileSync(join(root, 'src/context/AuthContext.tsx'), 'utf8');
  assert.doesNotMatch(src, /updateMembershipLevel/);
});

test('welcome page shows expired copy and requests OTP via existing helper', () => {
  const src = readFileSync(join(root, 'src/pages/WelcomePage.tsx'), 'utf8');
  const auth = readFileSync(join(root, 'src/context/AuthContext.tsx'), 'utf8');
  assert.match(src, /Link expired/);
  assert.match(src, /sendMagicLink/);
  assert.match(auth, /shouldCreateUser:\s*false/);
  assert.doesNotMatch(src, /inviteUserByEmail/);
  assert.doesNotMatch(src, /generateLink/);
});

test('leftover orchestrator conversation route is Pier+ gated', () => {
  const src = readFileSync(join(root, 'src/App.tsx'), 'utf8');
  const conversationIdx = src.indexOf('path="/conversation/:taskId?"');
  assert.ok(conversationIdx >= 0);
  const slice = src.slice(conversationIdx, conversationIdx + 700);
  assert.match(slice, /PierPlusGate/);
});
