/** Static concierge quotes until live concierge is wired. */
export const CONCIERGE_QUOTES = [
  'I can assist with fund introductions, event logistics, partner access, and private reservations.',
  'Tell us what you need—we typically coordinate introductions within 48 hours.',
  'For hard tables, partner intros, or trip planning, start here and we will route it quietly.',
];

export function pickConciergeQuote(seed: number): string {
  const index = Math.abs(seed) % CONCIERGE_QUOTES.length;
  return CONCIERGE_QUOTES[index];
}

/** Stable within a calendar day — suitable for dashboard teaser rotation without re-render flicker. */
export function dailyConciergeQuoteSeed(): number {
  return Math.floor(Date.now() / 86_400_000);
}

export const CONCIERGE_QUICK_REQUESTS = [
  'Fund introduction',
  'Dinner reservation',
  'Event access',
  'Partner access',
  'Plan a trip',
] as const;
