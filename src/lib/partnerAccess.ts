/**
 * Label shown on a partner in the directory.
 *
 * Founding Member benefits are marked Pier+.
 * Premium, Executive, and Standard are unlabeled — they read as available
 * to every member. The mark is informational; it does not hide the partner.
 */
export function partnerAccessLabel(minimumLevel?: string | null): 'Pier+' | null {
  const level = (minimumLevel ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return level === 'founding member' ? 'Pier+' : null;
}
