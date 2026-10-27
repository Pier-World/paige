/** Address every member-facing mailto on the platform should use. */
export const CONCIERGE_EMAIL = 'hello@joinpier.com';

export function conciergeMailto(subject: string, body?: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${CONCIERGE_EMAIL}?${params.toString()}`;
}

export function dataRoomMailto(opportunityTitle: string): string {
  return conciergeMailto(`Requesting Data Room: ${opportunityTitle}`);
}
