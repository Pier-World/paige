/** Address every member-facing mailto on the platform should use. */
export const CONCIERGE_EMAIL = 'hello@joinpier.com';

/** Data-room requests go to Vestera, not the general concierge inbox. */
export const DATA_ROOM_EMAIL = 'bpucci@vesteracap.com';

/** Member dealflow submissions go to Spencer at Vestera. */
export const SUBMIT_OPPORTUNITY_EMAIL = 'sc@vesteracap.com';

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

export function opportunityInquiryMailto(opportunityTitle: string): string {
  return mailtoHref(
    DATA_ROOM_EMAIL,
    `Opportunity inquiry: ${opportunityTitle}`,
    `I would like to learn more about ${opportunityTitle}.`
  );
}

export function submitOpportunityMailto(): string {
  return mailtoHref(
    SUBMIT_OPPORTUNITY_EMAIL,
    'Pier dealflow submission',
    [
      'I would like to submit an opportunity to Pier dealflow.',
      '',
      'Type (fund / co-invest / secondary / SPV):',
      'Name:',
      'My relationship (investor / GP / vouching for):',
      'Brief thesis:',
      'Fees or carry (Pier+ only; leave blank if none):',
    ].join('\n')
  );
}
