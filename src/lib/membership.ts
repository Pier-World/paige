/**
 * Member-facing Pier+ check uses membership_level only.
 *
 * Canonical DB column: members.membership_level
 *   Standard = free
 *   Premium | Executive | Founding Member = Pier+
 *
 * Ignore members.subscription_tier (defaults to 'pro' and is unused billing leftover)
 * and members.subscription_status (defaults to 'trialing'). Those are not product access.
 *
 * Staff `role = admin` still bypasses RLS so /admin/deals works, but the member UI
 * follows membership_level. That lets a Standard admin see the free experience.
 * SQL `is_pier_plus(uuid)` remains: Pier+ membership OR admin.
 */
export const PIER_PLUS_MEMBERSHIP_LEVELS = ['Premium', 'Executive', 'Founding Member'] as const;

export type PierPlusMembershipLevel = (typeof PIER_PLUS_MEMBERSHIP_LEVELS)[number];

export type PierPlusUserLike = {
  membership_level?: string | null;
  role?: string | null;
} | null | undefined;

export function normalizeMembershipLevel(level?: string | null): string {
  return (level ?? '').trim();
}

export function membershipIsPierPlus(level?: string | null): boolean {
  return (PIER_PLUS_MEMBERSHIP_LEVELS as readonly string[]).includes(
    normalizeMembershipLevel(level)
  );
}

export function isPierPlus(user: PierPlusUserLike): boolean {
  if (!user) return false;
  return membershipIsPierPlus(user.membership_level);
}

export function isStaffAdmin(user: PierPlusUserLike): boolean {
  return user?.role === 'admin';
}

export function membershipBadgeLabel(user: PierPlusUserLike): string {
  if (!user) return 'Standard';
  return isPierPlus(user) ? 'Pier+' : 'Standard';
}
