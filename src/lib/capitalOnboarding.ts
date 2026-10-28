import {
  accreditationPreferences,
  draftFromAccreditation,
  emptyAccreditationDraft,
  parseAccreditationDraft,
  readAccreditation,
} from './accreditation.ts';
import type { User, UserPreferences } from '../types';
import type { CapitalRole, OnboardingData } from '../types/onboarding';

export const ONBOARDING_STEP_COUNT = 5;

export type IntentOption = {
  id: string;
  title: string;
  description: string;
};

export const LP_INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'exclusive-funds',
    title: 'Exclusive Fund Deals',
    description:
      'Exclusive allocations into managers across different ranges of alternatives — brought to you by Vestera Capital Partners.',
  },
  {
    id: 'co-invests',
    title: 'Directs and co-investments',
    description: 'Co-invest or primary opportunities alongside other Pier+ members.',
  },
  {
    id: 'network',
    title: 'Other LPs and GPs',
    description: 'Meet managers and fellow allocators around the globe.',
  },
  {
    id: 'gatherings',
    title: 'Gatherings worldwide',
    description: 'Invitations to member-only gatherings across city chapters.',
  },
  {
    id: 'emerging-managers',
    title: 'Emerging managers',
    description: 'Access to the best new funds and first-time managers.',
  },
];

export const GP_INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'exclusive-funds',
    title: 'Fund circulation',
    description: 'Have your fund considered for Pier’s private circulation to allocators.',
  },
  {
    id: 'co-invests',
    title: 'Directs and co-investments',
    description: 'Share co-invests and directs with allocators in the network.',
  },
  {
    id: 'network',
    title: 'Allocators in the room',
    description: 'Meet allocators and other fellow managers around the globe.',
  },
  {
    id: 'gatherings',
    title: 'Gatherings worldwide',
    description: 'Invitations to member-only gatherings across city chapters.',
  },
  {
    id: 'emerging-managers',
    title: 'Fund showcase',
    description: 'Be included in Pier’s research briefs and highlights to allocators.',
  },
];

export const INTENT_LABELS: Record<string, string> = {
  'exclusive-funds': 'Exclusive Fund Deals',
  'co-invests': 'Directs and co-investments',
  network: 'The membership',
  gatherings: 'Gatherings worldwide',
  'emerging-managers': 'Emerging managers',
  dinners: 'Gatherings worldwide',
  'meet-allocators': 'The membership',
  coverage: 'Emerging managers',
  'list-opportunity': 'Exclusive Fund Deals',
  'credit-real-assets': 'Exclusive Fund Deals',
};

const INTENT_ALIASES: Record<string, string> = {
  dinners: 'gatherings',
  'meet-allocators': 'network',
  coverage: 'emerging-managers',
  'list-opportunity': 'exclusive-funds',
  'credit-real-assets': 'exclusive-funds',
};

const CANONICAL_INTENT_IDS = new Set([
  'exclusive-funds',
  'co-invests',
  'network',
  'gatherings',
  'emerging-managers',
]);

export function normalizeIntentIds(ids: string[]): string[] {
  const next: string[] = [];
  for (const raw of ids) {
    const mapped = INTENT_ALIASES[raw] || raw;
    if (!CANONICAL_INTENT_IDS.has(mapped)) continue;
    if (!next.includes(mapped)) next.push(mapped);
  }
  return next;
}

const LEGACY_TRAVEL_INTERESTS = new Set([
  'Points Maximization',
  'Travel',
  'Lounge Access',
  'Status Matching',
  'Elite Status Perks',
  'Elite Perks',
  'Hotel Upgrades',
  'Flight Deals',
  'Travel Insurance',
  'Concierge Services',
  'points-maximization',
  'lounge-access',
  'status-matching',
  'elite-perks',
  'hotel-upgrades',
  'flight-deals',
  'travel-insurance',
  'concierge',
]);

export function emptyOnboardingData(): OnboardingData {
  return {
    capitalRole: null,
    firm: '',
    title: '',
    city: '',
    intents: [],
    allowIntroRequests: false,
    shareEventAttendance: false,
    accreditation: emptyAccreditationDraft(),
  };
}

export function defaultPrivacyForRole(_role: CapitalRole | null): {
  allowIntroRequests: boolean;
  shareEventAttendance: boolean;
} {
  return { allowIntroRequests: false, shareEventAttendance: false };
}

export function applyRoleChange(data: OnboardingData, role: CapitalRole): OnboardingData {
  if (data.capitalRole === role) return data;
  const privacy = defaultPrivacyForRole(role);
  return {
    ...data,
    capitalRole: role,
    intents: [],
    allowIntroRequests: privacy.allowIntroRequests,
    shareEventAttendance: privacy.shareEventAttendance,
  };
}

export function intentsForRole(role: CapitalRole | null) {
  if (role === 'gp') return GP_INTENT_OPTIONS;
  return LP_INTENT_OPTIONS;
}

export function buildOnboardingMemberPreferences(
  data: OnboardingData,
  existing?: UserPreferences | null
): UserPreferences {
  const existingInterests = Array.isArray(existing?.interests) ? existing.interests : [];
  const intentLabels = normalizeIntentIds(data.intents).map((id) => INTENT_LABELS[id] || id);
  const mergedInterests = Array.from(
    new Set([
      ...existingInterests.filter((item) => !LEGACY_TRAVEL_INTERESTS.has(item)),
      ...intentLabels,
    ])
  );

  const city = data.city.trim();
  const preferredCities = city
    ? Array.from(new Set([...(existing?.preferred_cities ?? []), city]))
    : existing?.preferred_cities;

  return {
    ...existing,
    ...(data.capitalRole ? { capital_role: data.capitalRole } : {}),
    firm: data.firm.trim() || existing?.firm,
    role_label: data.title.trim() || existing?.role_label,
    primary_city: city || existing?.primary_city,
    preferred_cities: preferredCities,
    interests: mergedInterests,
    member_preferences: {
      allow_intro_requests:
        data.allowIntroRequests ?? existing?.member_preferences?.allow_intro_requests ?? false,
      share_event_attendance:
        data.shareEventAttendance ?? existing?.member_preferences?.share_event_attendance ?? false,
    },
    ...(accreditationPreferences(data.accreditation) ?? {}),
  };
}

export function buildPersonalContext(
  data: OnboardingData,
  name: string,
  skipped = false
): Record<string, unknown> {
  const accreditation = accreditationPreferences(data.accreditation);
  return {
    name: name.trim() || null,
    capital_role: data.capitalRole,
    firm: data.firm.trim() || null,
    title: data.title.trim() || null,
    city: data.city.trim() || null,
    intents: normalizeIntentIds(data.intents),
    skipped,
    ...(accreditation?.accreditation
      ? {
          accredited_investor: accreditation.accredited_investor,
          accreditation_basis: accreditation.accreditation.basis,
          qualified_purchaser: accreditation.accreditation.qualified_purchaser,
        }
      : {}),
  };
}

export function isOnboardingMarkedComplete(args: {
  memberCompleted?: boolean | null;
  profileCompleted?: boolean | null;
  personalContext?: unknown;
}): boolean {
  if (args.memberCompleted === true || args.profileCompleted === true) return true;
  const pc = args.personalContext;
  if (pc && typeof pc === 'object') {
    const role = (pc as { capital_role?: unknown }).capital_role;
    if (role === 'gp' || role === 'lp') return true;
  }
  return false;
}

export function postAuthPath(
  user: { onboarding_completed?: boolean } | null | undefined
): '/onboarding' | '/dashboard' {
  return user?.onboarding_completed === true ? '/dashboard' : '/onboarding';
}

function audienceMentionsGp(aud: string): boolean {
  return /\bgps?\b|general partner|fund manager|emerging manager|\bem\b/.test(aud);
}

function audienceMentionsLp(aud: string): boolean {
  return /\blps?\b|allocator|family office/.test(aud);
}

export function displayEventAudience(audience: string | null | undefined): string {
  const aud = (audience || '').trim().toLowerCase();
  if (!aud) return 'GPs & LPs';
  const mentionsGp = audienceMentionsGp(aud);
  const mentionsLp = audienceMentionsLp(aud);
  if (mentionsGp && !mentionsLp) return 'GPs';
  if (mentionsLp && !mentionsGp) return 'LPs';
  return 'GPs & LPs';
}

export function eventMatchesCapitalRole(
  audience: string | null | undefined,
  role: CapitalRole | null | undefined
): boolean {
  if (!role) return true;
  const aud = (audience || '').toLowerCase();
  if (!aud.trim()) return true;
  const mentionsGp = audienceMentionsGp(aud);
  const mentionsLp = audienceMentionsLp(aud);
  if (mentionsGp && mentionsLp) return true;
  if (!mentionsGp && !mentionsLp) return true;
  return role === 'gp' ? mentionsGp : mentionsLp;
}

export function profileNeedsOnboardingDetails(prefs?: UserPreferences | null): boolean {
  return !prefs?.capital_role || !prefs.firm?.trim() || !prefs.primary_city?.trim();
}

export function onboardingDraftKey(userId: string): string {
  return `pier_onboarding_draft_${userId}`;
}

export function dashboardIntroKey(userId: string): string {
  return `pier_get_oriented_dismissed_${userId}`;
}

export function membershipRevealKey(userId: string): string {
  return `pier_membership_reveal_${userId}`;
}

export function markMembershipRevealPending(userId: string): void {
  try {
    sessionStorage.setItem(membershipRevealKey(userId), 'pending');
  } catch {
    /* private mode */
  }
}

export function consumeMembershipReveal(userId?: string, fromOnboarding = false): boolean {
  if (!userId) return false;
  try {
    const key = membershipRevealKey(userId);
    const current = sessionStorage.getItem(key);
    if (current === 'shown') return false;
    if (current === 'pending' || fromOnboarding) {
      sessionStorage.setItem(key, 'shown');
      return true;
    }
    return false;
  } catch {
    return fromOnboarding;
  }
}

export function clampOnboardingStep(step: number, role: CapitalRole | null): number {
  const max = ONBOARDING_STEP_COUNT - 1;
  const safe = Number.isInteger(step) ? Math.max(0, Math.min(max, step)) : 0;
  if (safe > 1 && !role) return 1;
  return safe;
}

export function parseOnboardingDraft(raw: string | null): { data: OnboardingData; step: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingData> & { step?: unknown };
    const role = parsed.capitalRole === 'gp' || parsed.capitalRole === 'lp' ? parsed.capitalRole : null;
    const data: OnboardingData = {
      capitalRole: role,
      firm: typeof parsed.firm === 'string' ? parsed.firm : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      city: typeof parsed.city === 'string' ? parsed.city : '',
      intents: normalizeIntentIds(
        Array.isArray(parsed.intents) ? parsed.intents.filter((item) => typeof item === 'string') : []
      ),
      allowIntroRequests: parsed.allowIntroRequests === true,
      shareEventAttendance: parsed.shareEventAttendance === true,
      accreditation: parseAccreditationDraft(
        (parsed as { accreditation?: unknown }).accreditation
      ),
    };
    const step = typeof parsed.step === 'number' ? parsed.step : 0;
    return { data, step: clampOnboardingStep(step, data.capitalRole) };
  } catch {
    return null;
  }
}

export function serializeOnboardingDraft(data: OnboardingData, step: number): string {
  return JSON.stringify({ ...data, step: clampOnboardingStep(step, data.capitalRole) });
}

export function prefillOnboardingFromUser(user: User | null): OnboardingData {
  const base = emptyOnboardingData();
  if (!user) return base;
  const role = user.preferences?.capital_role;
  return {
    ...base,
    capitalRole: role === 'gp' || role === 'lp' ? role : null,
    firm: user.preferences?.firm || '',
    title: user.preferences?.role_label || '',
    city: user.preferences?.primary_city || '',
    allowIntroRequests: user.preferences?.member_preferences?.allow_intro_requests === true,
    shareEventAttendance: user.preferences?.member_preferences?.share_event_attendance === true,
    accreditation: draftFromAccreditation(readAccreditation(user.preferences)),
  };
}
