/**
 * Shared Pier+ helper. Must match SQL `membership_is_pier_plus` /
 * `is_pier_plus` (Premium | Executive | Founding Member OR role = admin).
 * Standard is free. Unknown tiers are never treated as Pier+.
 */
export const PIER_PLUS_MEMBERSHIP_LEVELS = ['Premium', 'Executive', 'Founding Member'] as const;

export type PierPlusMembershipLevel = (typeof PIER_PLUS_MEMBERSHIP_LEVELS)[number];

export type PierPlusUserLike = {
  membership_level?: string | null;
  role?: string | null;
} | null | undefined;

export function membershipIsPierPlus(level?: string | null, role?: string | null): boolean {
  if (role === 'admin') return true;
  return (PIER_PLUS_MEMBERSHIP_LEVELS as readonly string[]).includes(level ?? '');
}

export function isPierPlus(user: PierPlusUserLike): boolean {
  if (!user) return false;
  return membershipIsPierPlus(user.membership_level, user.role);
}
