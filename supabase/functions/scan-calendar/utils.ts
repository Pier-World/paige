/**
 * Utility functions for calendar scanner
 */

/**
 * Calculate distance between two cities (in miles)
 * For MVP, uses a simple lookup table for major cities
 * In production, would use geocoding API
 */
export function calculateDistance(city1: string, city2: string): number {
  if (!city1 || !city2) return Infinity;

  const normalized1 = city1.toLowerCase().trim();
  const normalized2 = city2.toLowerCase().trim();

  if (normalized1 === normalized2) return 0;

  // Major city coordinates (simplified lookup table)
  // In production, use a geocoding service
  const cityCoords: Record<string, { lat: number; lon: number }> = {
    'san francisco': { lat: 37.7749, lon: -122.4194 },
    'new york': { lat: 40.7128, lon: -74.0060 },
    'new york city': { lat: 40.7128, lon: -74.0060 },
    'los angeles': { lat: 34.0522, lon: -118.2437 },
    'chicago': { lat: 41.8781, lon: -87.6298 },
    'austin': { lat: 30.2672, lon: -97.7431 },
    'seattle': { lat: 47.6062, lon: -122.3321 },
    'miami': { lat: 25.7617, lon: -80.1918 },
    'boston': { lat: 42.3601, lon: -71.0589 },
    'denver': { lat: 39.7392, lon: -104.9903 },
    'portland': { lat: 45.5152, lon: -122.6784 },
    'atlanta': { lat: 33.7490, lon: -84.3880 },
    'phoenix': { lat: 33.4484, lon: -112.0740 },
    'houston': { lat: 29.7604, lon: -95.3698 },
    'dallas': { lat: 32.7767, lon: -96.7970 },
    'washington': { lat: 38.9072, lon: -77.0369 },
    'washington dc': { lat: 38.9072, lon: -77.0369 },
  };

  const coords1 = cityCoords[normalized1];
  const coords2 = cityCoords[normalized2];

  if (!coords1 || !coords2) {
    // If cities not in lookup, assume they're different (>50 miles)
    return 100;
  }

  // Haversine formula to calculate distance
  const R = 3959; // Earth radius in miles
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate duration between two dates in full days
 * Fixed to properly calculate day differences (not time differences)
 */
export function calculateDuration(start: Date, end: Date): number {
  // Calculate full days between dates (ignore time component)
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if two trips are duplicates
 * Same destination and dates within 1 day of each other
 */
export function isDuplicate(
  trip1: { destination_city: string | null; start_date: string },
  trip2: { destination_city: string | null; start_date: string }
): boolean {
  if (!trip1.destination_city || !trip2.destination_city) return false;

  // Check if same city
  if (trip1.destination_city.toLowerCase() !== trip2.destination_city.toLowerCase()) {
    return false;
  }

  // Check if dates within 1 day
  const date1 = new Date(trip1.start_date);
  const date2 = new Date(trip2.start_date);
  const diffDays = Math.abs(calculateDuration(date1, date2));

  return diffDays <= 1;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string and return Date object
 * Handles ISO strings and date-only strings
 */
export function parseDate(dateString: string): Date {
  // If it's just a date (YYYY-MM-DD), add time component
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T00:00:00Z');
  }
  return new Date(dateString);
}
