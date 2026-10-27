/** Join first / last, skipping blanks. */
export function composeFullName(
  first?: string | null,
  last?: string | null
): string {
  return [first, last]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

/** First token + remainder. A single word leaves last_name empty. */
export function splitFullName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export function emailLocalPart(email?: string | null): string {
  return (email || '').split('@')[0]?.trim() || '';
}

/** Auth bootstrap used "<email local> Member" when metadata had no name. */
export function isPlaceholderName(
  name: string | null | undefined,
  email?: string | null
): boolean {
  const trimmed = (name || '').trim();
  if (!trimmed) return true;
  const local = emailLocalPart(email);
  if (!local) return false;
  const lower = trimmed.toLowerCase();
  const localLower = local.toLowerCase();
  return lower === localLower || lower === `${localLower} member`;
}

/** Prefer a real member name over a profile stub like "sc Member". */
export function resolveFullName(args: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const composed = composeFullName(args.firstName, args.lastName);
  const profile = args.fullName?.trim() || '';
  const profileOk = profile && !isPlaceholderName(profile, args.email);
  const composedOk = composed && !isPlaceholderName(composed, args.email);
  if (profileOk) return profile;
  if (composedOk) return composed;
  return profile || composed;
}
