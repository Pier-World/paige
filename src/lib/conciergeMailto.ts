/** Address every member-facing mailto on the platform should use. */
export const CONCIERGE_EMAIL = 'hello@joinpier.com';

/** Data-room requests go to Vestera, not the general concierge inbox. */
export const DATA_ROOM_EMAIL = 'bpucci@vesteracap.com';

function mailtoHref(email: string, subject: string, body?: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${email}?${params.toString()}`;
}

export function conciergeMailto(subject: string, body?: string): string {
  return mailtoHref(CONCIERGE_EMAIL, subject, body);
}

export function dataRoomMailto(opportunityTitle: string): string {
  return mailtoHref(DATA_ROOM_EMAIL, `Requesting Data Room: ${opportunityTitle}`);
}

export function upgradeRequestMailto(): string {
  return mailtoHref(DATA_ROOM_EMAIL, 'Pier+ upgrade request');
}
