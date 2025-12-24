/**
 * City and location extraction utilities with validation
 */

/**
 * Major US cities for validation
 */
const US_CITIES = new Set([
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
  'Boston', 'Nashville', 'Detroit', 'Portland', 'Las Vegas',
  'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
  'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa',
  'Atlanta', 'Miami', 'Oakland', 'Tulsa', 'Cleveland',
  'Wichita', 'Arlington', 'Tampa', 'New Orleans', 'Anaheim',
  'Minneapolis', 'Honolulu', 'Colorado Springs', 'Raleigh', 'Omaha',
  'Miami Beach', 'Long Beach', 'Virginia Beach', 'Oakland', 'Miami',
  'Oakland', 'Minneapolis', 'Tulsa', 'Cleveland', 'Wichita',
  'Arlington', 'Tampa', 'New Orleans', 'Honolulu', 'Oakland',
  'Oakland', 'Oakland', 'Oakland', 'Oakland', 'Oakland',
  // Add more cities as needed
]);

/**
 * City aliases mapping
 */
const CITY_ALIASES: Record<string, string> = {
  'NYC': 'New York',
  'New York City': 'New York',
  'LA': 'Los Angeles',
  'SF': 'San Francisco',
  'Philly': 'Philadelphia',
  'DC': 'Washington',
  'Washington DC': 'Washington',
  'NOLA': 'New Orleans',
  'Chi-town': 'Chicago',
  'The Bay': 'San Francisco',
  'Bay Area': 'San Francisco',
  'PDX': 'Portland',
  'ATX': 'Austin',
  'MIA': 'Miami',
  'BOS': 'Boston',
  'SEA': 'Seattle',
  'DEN': 'Denver',
  'PHX': 'Phoenix',
  'ATL': 'Atlanta',
  'DAL': 'Dallas',
  'HOU': 'Houston',
  'SFO': 'San Francisco',
  'LAX': 'Los Angeles',
};

/**
 * Common company names to exclude
 */
const COMPANY_NAMES = new Set([
  'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Facebook',
  'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Salesforce', 'Oracle',
  'IBM', 'Intel', 'Cisco', 'Adobe', 'Nvidia', 'PayPal', 'Twitter',
  'LinkedIn', 'Snapchat', 'TikTok', 'Zoom', 'Slack', 'Dropbox',
  'Spotify', 'Pinterest', 'Reddit', 'Discord', 'GitHub', 'GitLab',
]);

/**
 * Validate if a string is a valid city name
 */
function isValidCity(cityName: string): boolean {
  if (!cityName || cityName.trim().length === 0) {
    return false;
  }

  const normalized = normalizeCity(cityName);

  // Check if it's a ZIP code (5 digits or 5+4 format)
  if (/^\d{5}(-\d{4})?$/.test(normalized)) {
    return false;
  }

  // Check if it's a known company name
  if (COMPANY_NAMES.has(normalized)) {
    return false;
  }

  // Check aliases first
  if (CITY_ALIASES[normalized]) {
    return true;
  }

  // Check against city list
  return US_CITIES.has(normalized);
}

/**
 * Extract city name from a location string
 * Handles formats like "City, State", "City, Country", "City, State, Country"
 * Now validates against known cities
 */
export function extractCityFromLocation(location: string | null): string | null {
  if (!location) return null;

  // Common patterns:
  // "Austin Convention Center, Austin, TX"
  // "Seattle Office, Seattle, WA"
  // "Miami Beach, FL"
  // "New York, NY, USA"

  const normalized = location.trim();

  // Try to extract city from comma-separated format
  const parts = normalized.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    // Usually the city is the second-to-last part before state/country
    // "Austin Convention Center, Austin, TX" -> "Austin"
    // "Miami Beach, FL" -> "Miami Beach"
    const cityCandidate = parts[parts.length - 2];

    // Remove common suffixes that aren't part of city name
    const cleaned = cityCandidate
      .replace(/\s+(Convention Center|Office|Airport|Hotel|Restaurant|Cafe|Theater|Stadium|Arena|Building|Tower|Plaza)$/i, '')
      .trim();

    if (cleaned.length > 0 && isValidCity(cleaned)) {
      // Return normalized city name (resolve aliases)
      const normalizedCity = normalizeCity(cleaned);
      return CITY_ALIASES[normalizedCity] || cleaned;
    }
  }

  // If no comma format, try to extract from the beginning
  // "Seattle Downtown" -> "Seattle"
  const firstPart = parts[0];
  const match = firstPart.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (match && match[1]) {
    const candidate = match[1];
    if (isValidCity(candidate)) {
      const normalizedCity = normalizeCity(candidate);
      return CITY_ALIASES[normalizedCity] || candidate;
    }
  }

  // Try the first part as-is if it's a valid city
  if (isValidCity(firstPart)) {
    const normalizedCity = normalizeCity(firstPart);
    // Check if normalized city has an alias
    const upperNormalized = firstPart.toUpperCase();
    if (CITY_ALIASES[upperNormalized]) {
      return CITY_ALIASES[upperNormalized];
    }
    // Check case-insensitive
    for (const [alias, fullName] of Object.entries(CITY_ALIASES)) {
      if (alias.toLowerCase() === normalizedCity) {
        return fullName;
      }
    }
    return firstPart;
  }

  return null;
}

/**
 * Extract city name from event title
 * Looks for patterns like "in City", "to City", "City Conference"
 * Now validates against known cities
 */
export function extractCityFromTitle(title: string | null): string | null {
  if (!title) return null;

  const normalized = title.toLowerCase();

  // Patterns to look for:
  // "Conference in Austin"
  // "Meeting in Seattle"
  // "Flight to NYC"
  // "NYC Office"
  // "Austin Summit"

  // Pattern 1: "in [City]" or "to [City]" - handle both lowercase and original case
  // First try with original title (case-sensitive) for better matching
  const originalTitle = title;
  const inPatternOriginal = /(?:in|to|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
  let match = originalTitle.match(inPatternOriginal);
  
  // If no match, try with normalized (lowercase) and extract words
  if (!match) {
    const inPatternLower = /(?:in|to|at)\s+([a-z]+(?:\s+[a-z]+)*)/;
    match = normalized.match(inPatternLower);
  }
  
  if (match && match[1]) {
    // Capitalize first letter of each word
    const candidate = match[1]
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    
    if (isValidCity(candidate)) {
      const normalizedCity = normalizeCity(candidate);
      return CITY_ALIASES[normalizedCity] || candidate;
    }
    
    // Try checking aliases for the extracted text
    const candidateLower = candidate.toLowerCase();
    for (const [alias, fullName] of Object.entries(CITY_ALIASES)) {
      if (alias.toLowerCase() === candidateLower) {
        return fullName;
      }
    }
  }

  // Pattern 2: Common city abbreviations at start or end
  for (const [abbrev, fullName] of Object.entries(CITY_ALIASES)) {
    if (normalized.includes(abbrev.toLowerCase())) {
      return fullName;
    }
  }

  return null;
}

/**
 * Normalize city name for comparison
 * Handles common aliases and variations
 */
export function normalizeCity(city: string): string {
  if (!city) return '';

  const normalized = city.trim();

  // Check aliases first (case-sensitive for exact matches)
  const upperNormalized = normalized.toUpperCase();
  if (CITY_ALIASES[upperNormalized]) {
    return CITY_ALIASES[upperNormalized].toLowerCase();
  }

  // Check case-insensitive aliases
  for (const [alias, fullName] of Object.entries(CITY_ALIASES)) {
    if (alias.toLowerCase() === normalized.toLowerCase()) {
      return fullName.toLowerCase();
    }
  }

  return normalized.toLowerCase();
}

/**
 * Check if two city names refer to the same city
 */
export function isSameCity(city1: string | null, city2: string | null): boolean {
  if (!city1 || !city2) return false;

  return normalizeCity(city1) === normalizeCity(city2);
}
