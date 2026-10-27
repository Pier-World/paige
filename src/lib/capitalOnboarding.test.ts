import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  applyRoleChange,
  buildOnboardingMemberPreferences,
  buildPersonalContext,
  clampOnboardingStep,
  defaultPrivacyForRole,
  displayEventAudience,
  emptyOnboardingData,
  eventMatchesCapitalRole,
  intentsForRole,
  isOnboardingMarkedComplete,
  normalizeIntentIds,
  parseOnboardingDraft,
  postAuthPath,
  profileNeedsOnboardingDetails,
} from './capitalOnboarding.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('LP privacy defaults are off', () => {
  const privacy = defaultPrivacyForRole('lp');
  assert.equal(privacy.allowIntroRequests, false);
  assert.equal(privacy.shareEventAttendance, false);
});

test('GP privacy defaults are off until opt-in', () => {
  const privacy = defaultPrivacyForRole('gp');
  assert.equal(privacy.allowIntroRequests, false);
  assert.equal(privacy.shareEventAttendance, false);
});

test('complete payload stores capital role and strips travel interests', () => {
  const data = {
    ...emptyOnboardingData(),
    capitalRole: 'lp' as const,
    firm: 'Harbor Family Office',
    title: 'Principal',
    city: 'New York',
    intents: ['gatherings', 'emerging-managers'],
    allowIntroRequests: false,
    shareEventAttendance: false,
  };
  const prefs = buildOnboardingMemberPreferences(data, {
    interests: ['Points Maximization', 'Travel'],
    firm: 'Old',
  });
  assert.equal(prefs.capital_role, 'lp');
  assert.equal(prefs.firm, 'Harbor Family Office');
  assert.equal(prefs.primary_city, 'New York');
  assert.deepEqual(prefs.interests, ['Gatherings worldwide', 'Emerging managers']);
  assert.equal(prefs.member_preferences?.allow_intro_requests, false);
  assert.equal(prefs.member_preferences?.share_event_attendance, false);
});

test('GP opt-in is persisted when enabled', () => {
  const selected = applyRoleChange(emptyOnboardingData(), 'gp');
  const data = { ...selected, shareEventAttendance: true, intents: ['network'] };
  const prefs = buildOnboardingMemberPreferences(data);
  assert.equal(prefs.capital_role, 'gp');
  assert.equal(prefs.member_preferences?.share_event_attendance, true);
  assert.deepEqual(prefs.interests, ['The membership']);
});

test('reselecting the same role does not wipe privacy opt-in', () => {
  const gp = applyRoleChange(emptyOnboardingData(), 'gp');
  const optedIn = { ...gp, shareEventAttendance: true, intents: ['dinners'] };
  const again = applyRoleChange(optedIn, 'gp');
  assert.equal(again.shareEventAttendance, true);
  assert.deepEqual(again.intents, ['dinners']);
  const switched = applyRoleChange(optedIn, 'lp');
  assert.equal(switched.shareEventAttendance, false);
  assert.deepEqual(switched.intents, []);
});

test('skip payload without a role does not invent capital_role', () => {
  const prefs = buildOnboardingMemberPreferences(emptyOnboardingData(), { firm: 'Kept' });
  assert.equal(prefs.capital_role, undefined);
  assert.equal(prefs.firm, 'Kept');
  assert.equal(prefs.member_preferences?.allow_intro_requests, false);
});

test('personal context records skip without travel goals', () => {
  const ctx = buildPersonalContext(emptyOnboardingData(), 'Ada Lovelace', true);
  assert.equal(ctx.skipped, true);
  assert.equal(ctx.capital_role, null);
  assert.equal('goals' in ctx, false);
});

test('completion heuristic ignores leftover travel goals', () => {
  assert.equal(
    isOnboardingMarkedComplete({
      memberCompleted: false,
      personalContext: { name: 'Ada', goals: ['maximize-points'] },
    }),
    false
  );
  assert.equal(
    isOnboardingMarkedComplete({
      personalContext: { capital_role: 'gp' },
    }),
    true
  );
  assert.equal(isOnboardingMarkedComplete({ memberCompleted: true }), true);
});

test('postAuthPath sends incomplete members to onboarding', () => {
  assert.equal(postAuthPath({ onboarding_completed: true }), '/dashboard');
  assert.equal(postAuthPath({ onboarding_completed: false }), '/onboarding');
  assert.equal(postAuthPath(null), '/onboarding');
});

test('event audience matching keeps mixed and untagged events', () => {
  assert.equal(eventMatchesCapitalRole('GPs & LPs', 'lp'), true);
  assert.equal(eventMatchesCapitalRole('LP dinner', 'gp'), false);
  assert.equal(eventMatchesCapitalRole('GPs', 'lp'), false);
  assert.equal(eventMatchesCapitalRole('LPs', 'gp'), false);
  assert.equal(eventMatchesCapitalRole('Fund managers', 'gp'), true);
  assert.equal(eventMatchesCapitalRole('', 'lp'), true);
});

test('event audience display is GPs, LPs, or GPs & LPs', () => {
  assert.equal(displayEventAudience('Members'), 'GPs & LPs');
  assert.equal(displayEventAudience('LP'), 'LPs');
  assert.equal(displayEventAudience('LPs'), 'LPs');
  assert.equal(displayEventAudience('GPs'), 'GPs');
  assert.equal(displayEventAudience('Allocators'), 'LPs');
  assert.equal(displayEventAudience('EM'), 'GPs');
  assert.equal(displayEventAudience('GP/LP'), 'GPs & LPs');
  assert.equal(displayEventAudience(''), 'GPs & LPs');
});

test('onboarding UI is capital markets, not travel', () => {
  const welcome = readFileSync(join(root, 'src/pages/onboarding/steps/WelcomeStep.tsx'), 'utf8');
  const identity = readFileSync(join(root, 'src/pages/onboarding/steps/IdentityStep.tsx'), 'utf8');
  const page = readFileSync(join(root, 'src/pages/onboarding/OnboardingPage.tsx'), 'utf8');
  assert.match(welcome, /private community of fund managers and allocators/);
  assert.doesNotMatch(welcome, /travel benefits|Amex|Maximize Points/);
  assert.match(identity, /Allocator \(LP\)/);
  assert.match(identity, /Fund manager \(GP\)/);
  assert.match(identity, /allocator or fund manager/);
  assert.doesNotMatch(page, /user_hotel_preferences|maximize-points/);
});

test('login shows the brand once on mobile', () => {
  const src = readFileSync(join(root, 'src/pages/auth/AuthShell.tsx'), 'utf8');
  assert.match(src, /hidden flex-col[\s\S]*md:flex/);
  assert.match(src, /mb-10 md:hidden/);
  assert.doesNotMatch(src, /Dinners, managers/);
});

test('auth does not refetch the member row on token refresh or tab focus', () => {
  const src = readFileSync(join(root, 'src/context/AuthContext.tsx'), 'utf8');
  assert.doesNotMatch(src, /TOKEN_REFRESHED/);
  assert.doesNotMatch(src, /visibilitychange/);
  assert.doesNotMatch(src, /addEventListener\('focus'/);
});

test('navigation guard does not strip event hashes', () => {
  const src = readFileSync(join(root, 'src/components/NavigationGuard.tsx'), 'utf8');
  assert.doesNotMatch(src, /split\('#'\)/);
});

test('profile completeness and draft parsing', () => {
  assert.equal(profileNeedsOnboardingDetails({ capital_role: 'lp', firm: 'A', primary_city: 'NY' }), false);
  assert.equal(profileNeedsOnboardingDetails({ capital_role: 'lp' }), true);
  const draft = parseOnboardingDraft(
    JSON.stringify({
      capitalRole: 'gp',
      firm: 'Pier',
      intents: ['dinners'],
      allowIntroRequests: true,
      step: 3,
    })
  );
  assert.equal(draft?.data.capitalRole, 'gp');
  assert.equal(draft?.data.firm, 'Pier');
  assert.equal(draft?.data.allowIntroRequests, true);
  assert.deepEqual(draft?.data.intents, ['gatherings']);
  assert.equal(draft?.step, 3);
  assert.equal(parseOnboardingDraft('not-json'), null);
  assert.equal(clampOnboardingStep(3, null), 1);
  assert.equal(clampOnboardingStep(2, 'lp'), 2);
  assert.equal(clampOnboardingStep(4, 'lp'), 4);
  assert.equal(clampOnboardingStep(8, 'gp'), 4);
});

test('completed accreditation is stored and a skip leaves it unset', () => {
  const verified = {
    ...emptyOnboardingData(),
    capitalRole: 'lp' as const,
    accreditation: {
      confirmed: true,
      basis: 'net_worth' as const,
      qualifiedPurchaser: true,
      declined: false,
    },
  };
  const prefs = buildOnboardingMemberPreferences(verified);
  assert.equal(prefs.accredited_investor, 'Yes');
  assert.equal(prefs.accreditation?.accredited, true);
  assert.equal(prefs.accreditation?.basis, 'net_worth');
  assert.equal(prefs.accreditation?.qualified_purchaser, true);
  assert.equal(typeof prefs.accreditation?.attested_at, 'string');

  const skipped = buildOnboardingMemberPreferences(emptyOnboardingData(), {
    accredited_investor: 'Yes',
  });
  assert.equal(skipped.accredited_investor, 'Yes');
  assert.equal(skipped.accreditation, undefined);

  const ctx = buildPersonalContext(verified, 'Ada Lovelace', false);
  assert.equal(ctx.accreditation_basis, 'net_worth');
  assert.equal(ctx.qualified_purchaser, true);
});

test('onboarding ends on a skippable accreditation step', () => {
  const page = readFileSync(join(root, 'src/pages/onboarding/OnboardingPage.tsx'), 'utf8');
  const step = readFileSync(join(root, 'src/pages/onboarding/steps/AccreditationStep.tsx'), 'utf8');
  const profile = readFileSync(join(root, 'src/pages/capital-markets/CapitalProfilePage.tsx'), 'utf8');
  assert.match(page, /AccreditationStep/);
  assert.match(page, /Verify later/);
  assert.match(step, /verify later in Profile/);
  assert.match(profile, /AccreditationField/);
  assert.doesNotMatch(profile, /<option value="Yes">Yes<\/option>/);
});

test('legacy intent ids map onto the current set', () => {
  assert.deepEqual(normalizeIntentIds(['dinners', 'meet-allocators', 'co-invests', 'dinners']), [
    'gatherings',
    'network',
    'co-invests',
  ]);
  assert.deepEqual(normalizeIntentIds(['credit-real-assets', 'list-opportunity']), [
    'exclusive-funds',
  ]);
});

test('help-first options are role-aware modules with the same keys', () => {
  const lp = intentsForRole('lp');
  const gp = intentsForRole('gp');
  assert.deepEqual(
    lp.map((option) => option.id),
    gp.map((option) => option.id)
  );
  assert.equal(lp.length, 5);
  assert.ok(lp.every((option) => option.title && option.description));
  assert.notEqual(lp[0].title, gp[0].title);
  const step = readFileSync(join(root, 'src/pages/onboarding/steps/IntentStep.tsx'), 'utf8');
  assert.match(step, /option\.description/);
  assert.doesNotMatch(step, /flex-wrap/);
});

test('finishing onboarding queues a one-time membership reveal', () => {
  const page = readFileSync(join(root, 'src/pages/onboarding/OnboardingPage.tsx'), 'utf8');
  const dash = readFileSync(join(root, 'src/pages/capital-markets/DashboardPage.tsx'), 'utf8');
  const reveal = readFileSync(
    join(root, 'src/components/capital-markets/MembershipReveal.tsx'),
    'utf8'
  );
  assert.match(page, /markMembershipRevealPending/);
  assert.match(page, /fromOnboarding: true/);
  assert.match(dash, /MembershipReveal/);
  assert.match(reveal, /You.re in/);
  assert.match(reveal, /prefers-reduced-motion/);
});

test('skip copy does not imply the wizard will resume', () => {
  const shell = readFileSync(join(root, 'src/pages/onboarding/OnboardingShell.tsx'), 'utf8');
  assert.match(shell, /Skip for now/);
  assert.match(shell, /skipHint/);
  assert.doesNotMatch(shell, /Do this later/);
  const page = readFileSync(join(root, 'src/pages/onboarding/OnboardingPage.tsx'), 'utf8');
  assert.match(page, /You can finish in Profile anytime/);
});
