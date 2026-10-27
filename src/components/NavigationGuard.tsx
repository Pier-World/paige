/**
 * Kept as a mount point for route-level side effects. Hash fragments (e.g. /events#event-id)
 * must not be stripped — dashboard deep-links depend on them.
 */
export function NavigationGuard() {
  return null;
}
