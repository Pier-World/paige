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

export function formatEventDate(
  date: string | Date,
  format: 'short' | 'long' | 'month-day' = 'short',
  city?: string
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const eventTimeZone = getEventTimeZone(city);
  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : format === 'month-day'
        ? { month: 'short', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };

  return d.toLocaleDateString('en-US', {
    ...options,
    timeZone: eventTimeZone?.timeZone,
  });
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

type EventTimeZone = {
  timeZone: string;
  label?: string;
};

function getEventTimeZone(city?: string): EventTimeZone | undefined {
  const normalizedCity = city?.trim().toLowerCase();

  if (!normalizedCity) return undefined;

  const eventTimeZones: Record<string, EventTimeZone> = {
    amsterdam: { timeZone: 'Europe/Amsterdam' },
    austin: { timeZone: 'America/Chicago', label: 'CT' },
    boston: { timeZone: 'America/New_York', label: 'ET' },
    chicago: { timeZone: 'America/Chicago', label: 'CT' },
    hamptons: { timeZone: 'America/New_York', label: 'ET' },
    nashville: { timeZone: 'America/Chicago', label: 'CT' },
    'new york': { timeZone: 'America/New_York', label: 'ET' },
    'new york city': { timeZone: 'America/New_York', label: 'ET' },
    'san francisco': { timeZone: 'America/Los_Angeles', label: 'PT' },
    'shelter island': { timeZone: 'America/New_York', label: 'ET' },
  };

  return eventTimeZones[normalizedCity];
}

function getShortTimeZoneLabel(date: Date, timeZone: string): string {
  const timeZoneName = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  return timeZoneName ?? '';
}

export function formatEventTime(date: string, city?: string): string {
  const eventTimeZone = getEventTimeZone(city);
  const parsedDate = new Date(date);
  const time = parsedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: eventTimeZone?.timeZone,
  });
  const label = eventTimeZone
    ? eventTimeZone.label ?? getShortTimeZoneLabel(parsedDate, eventTimeZone.timeZone)
    : '';

  return [time, label].filter(Boolean).join(' ');
}
