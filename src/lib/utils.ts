type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap((input): string[] => {
      if (!input) return [];
      if (Array.isArray(input)) return [cn(...input)];
      if (typeof input === 'object') {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [String(input)];
    })
    .filter(Boolean)
    .join(' ');
}

export function formatCurrency(amount: number, currency = 'USD', compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${currency} ${(amount / 1_000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'month-day' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'long') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (format === 'month-day') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function truncate(str: string, length: number): string {
  return str.length <= length ? str : `${str.slice(0, length).trimEnd()}...`;
}

export function formatDealReturn(
  metricType: 'irr' | 'moic' | 'yield' | 'custom' | 'none',
  targetIrr: number,
  moicTarget: number,
  returnDisplay: string
): string {
  if (metricType === 'custom' && returnDisplay.trim()) return returnDisplay.trim();
  if (metricType === 'moic' && moicTarget > 0) return `${moicTarget.toFixed(1)}x MOIC`;
  if (metricType === 'yield' && returnDisplay.trim()) return returnDisplay.trim();
  if (metricType === 'irr' && targetIrr > 0) return `${targetIrr}%`;
  if (metricType === 'none') return '—';
  if (returnDisplay.trim()) return returnDisplay.trim();
  if (targetIrr > 0) return `${targetIrr}%`;
  if (moicTarget > 0) return `${moicTarget.toFixed(1)}x`;
  return '—';
}

export const GUEST_ONLY_LOCATION_COPY = 'Location shared with confirmed guests';

export function formatEventLocation(event: {
  location: string;
  locationIsPublic: boolean;
  city: string;
}): string {
  if (event.locationIsPublic && event.location.trim()) return event.location.trim();
  return GUEST_ONLY_LOCATION_COPY;
}

export function formatEventTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
