import type { User, UserPreferences } from '../types';
import type { CapitalRole, OnboardingData } from '../types/onboarding';

export const LP_INTENT_OPTIONS = [
  { id: 'dinners', label: 'Dinners and member gatherings' },
  { id: 'emerging-managers', label: 'Emerging managers' },
  { id: 'co-invests', label: 'Co-investments' },
  { id: 'credit-real-assets', label: 'Credit and real assets' },
] as const;

export const GP_INTENT_OPTIONS = [
  { id: 'meet-allocators', label: 'Meet allocators' },
  { id: 'dinners', label: 'Dinners and member gatherings' },
  { id: 'coverage', label: 'Be considered for Pier coverage' },
  { id: 'list-opportunity', label: 'Share a fund with Pier later' },
] as const;

export const INTENT_LABELS: Record<string, string> = {
  dinners: 'Dinners and member gatherings',
  'emerging-managers': 'Emerging managers',
  'co-invests': 'Co-investments',
  'credit-real-assets': 'Credit and real assets',
  'meet-allocators': 'Meet allocators',
  coverage: 'Pier coverage',
  'list-opportunity': 'Share a fund with Pier later',
};

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
  const intentLabels = data.intents.map((id) => INTENT_LABELS[id] || id);
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
  };
}

export function buildPersonalContext(
  data: OnboardingData,
  name: string,
  skipped = false
): Record<string, unknown> {
  return {
    name: name.trim() || null,
    capital_role: data.capitalRole,
    firm: data.firm.trim() || null,
    title: data.title.trim() || null,
    city: data.city.trim() || null,
    intents: data.intents,
    skipped,
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

export function eventMatchesCapitalRole(
  audience: string | null | undefined,
  role: CapitalRole | null | undefined
): boolean {
  if (!role) return true;
  const aud = (audience || '').toLowerCase();
  if (!aud.trim()) return true;
  const mentionsGp = /\bgp\b|general partner|fund manager/.test(aud);
  const mentionsLp = /\blp\b|allocator|family office/.test(aud);
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
  return `pier_dashboard_intro_dismissed_${userId}`;
}

export function clampOnboardingStep(step: number, role: CapitalRole | null): number {
  const safe = Number.isInteger(step) ? Math.max(0, Math.min(3, step)) : 0;
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
      intents: Array.isArray(parsed.intents) ? parsed.intents.filter((item) => typeof item === 'string') : [],
      allowIntroRequests: parsed.allowIntroRequests === true,
      shareEventAttendance: parsed.shareEventAttendance === true,
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
  };
}
