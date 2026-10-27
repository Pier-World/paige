export const CONCIERGE_EMAIL = 'concierge@joinpier.com';

export function conciergeMailto(subject: string, body?: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${CONCIERGE_EMAIL}?${params.toString()}`;
}
