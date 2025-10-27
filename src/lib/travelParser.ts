export interface FlightEntities {
  from?: string;
  to?: string;
  depart?: string;
  return?: string;
  cabin?: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  nonstop?: boolean;
  budget_pp_usd?: number;
  passengers?: number;
  airline_prefs?: string[];
  bags?: number;
}

export interface HotelEntities {
  city?: string;
  check_in?: string;
  check_out?: string;
  budget_nightly_usd?: number;
  brand_prefs?: string[];
  amenities?: string[];
  rooms?: number;
}

export interface AddOns {
  driver?: boolean;
  airport_transfer?: boolean;
  dining?: boolean;
  lounge?: boolean;
  experiences?: boolean;
}

export interface TravelIntent {
  types: string[];
  flight?: FlightEntities;
  hotel?: HotelEntities;
  add_ons?: AddOns;
}

const AIRPORT_CODES: Record<string, string[]> = {
  'NYC': ['JFK', 'LGA', 'EWR'],
  'New York': ['JFK', 'LGA', 'EWR'],
  'LA': ['LAX', 'BUR', 'SNA'],
  'Los Angeles': ['LAX', 'BUR', 'SNA'],
  'SF': ['SFO', 'OAK', 'SJC'],
  'San Francisco': ['SFO', 'OAK', 'SJC'],
  'Chicago': ['ORD', 'MDW'],
  'Washington': ['DCA', 'IAD', 'BWI'],
  'DC': ['DCA', 'IAD', 'BWI'],
  'Miami': ['MIA', 'FLL'],
  'London': ['LHR', 'LGW', 'STN'],
  'Paris': ['CDG', 'ORY'],
  'Tokyo': ['NRT', 'HND'],
};

const CABIN_KEYWORDS: Record<string, 'Economy' | 'Premium Economy' | 'Business' | 'First'> = {
  'economy': 'Economy',
  'coach': 'Economy',
  'premium economy': 'Premium Economy',
  'premium': 'Premium Economy',
  'business': 'Business',
  'business class': 'Business',
  'first': 'First',
  'first class': 'First',
};

const HOTEL_BRANDS = [
  'Ritz', 'Four Seasons', 'St. Regis', 'Park Hyatt', 'Aman',
  'Mandarin Oriental', 'Peninsula', 'Rosewood', 'Belmond', 'Bulgari',
  'Edition', 'W Hotel', 'Andaz', 'Conrad', 'Waldorf Astoria'
];

const AMENITIES = [
  'Spa', 'Pool', 'Gym', 'Breakfast', 'Lounge', 'Concierge',
  'Restaurant', 'Bar', 'Room Service', 'WiFi', 'Parking'
];

function extractAirportCode(text: string): string | undefined {
  const upperText = text.toUpperCase();

  for (const [city, codes] of Object.entries(AIRPORT_CODES)) {
    if (upperText.includes(city.toUpperCase())) {
      return codes[0];
    }
  }

  const airportRegex = /\b([A-Z]{3})\b/g;
  const matches = text.match(airportRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }

  return undefined;
}

function extractCabin(text: string): FlightEntities['cabin'] | undefined {
  const lowerText = text.toLowerCase();

  for (const [keyword, cabin] of Object.entries(CABIN_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return cabin;
    }
  }

  return undefined;
}

function extractDate(text: string, refDate: Date = new Date()): string | undefined {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(refDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  if (lowerText.includes('next week')) {
    const nextWeek = new Date(refDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  if (lowerText.includes('this weekend')) {
    const today = refDate.getDay();
    const daysUntilFriday = (5 - today + 7) % 7;
    const friday = new Date(refDate);
    friday.setDate(friday.getDate() + daysUntilFriday);
    return friday.toISOString().split('T')[0];
  }

  if (lowerText.includes('next weekend')) {
    const today = refDate.getDay();
    const daysUntilNextFriday = ((5 - today + 7) % 7) + 7;
    const friday = new Date(refDate);
    friday.setDate(friday.getDate() + daysUntilNextFriday);
    return friday.toISOString().split('T')[0];
  }

  const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
  const match = text.match(dateRegex);
  if (match) {
    return match[0];
  }

  const monthDayRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})/i;
  const monthMatch = text.match(monthDayRegex);
  if (monthMatch) {
    const year = refDate.getFullYear();
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = monthMap[monthMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(monthMatch[2]);
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  }

  return undefined;
}

function extractBudget(text: string): number | undefined {
  const budgetRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:usd|dollars?)?/i;
  const match = text.match(budgetRegex);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return undefined;
}

function extractPassengers(text: string): number {
  const passengerRegex = /(\d+)\s*(?:passenger|pax|person|people|traveler)/i;
  const match = text.match(passengerRegex);
  if (match) {
    return parseInt(match[1]);
  }
  return 1;
}

export function parseTravelRequest(text: string): TravelIntent {
  const lowerText = text.toLowerCase();
  const intent: TravelIntent = {
    types: [],
  };

  const hasFlightKeywords = /flight|fly|air|plane|jet|round trip|one way/i.test(text);
  const hasHotelKeywords = /hotel|stay|room|suite|accommodation|lodging/i.test(text);
  const hasPrivateJetKeywords = /private jet|charter/i.test(text);

  if (hasFlightKeywords || hasPrivateJetKeywords) {
    intent.types.push(hasPrivateJetKeywords ? 'private_jet' : 'flight');

    const parts = text.split(/\s+(?:to|→)\s+/i);
    const from = parts.length > 1 ? extractAirportCode(parts[0]) : undefined;
    const to = parts.length > 1 ? extractAirportCode(parts[1]) : undefined;

    intent.flight = {
      from,
      to,
      depart: extractDate(text),
      cabin: extractCabin(text),
      nonstop: lowerText.includes('nonstop') || lowerText.includes('direct'),
      passengers: extractPassengers(text),
      budget_pp_usd: extractBudget(text),
    };

    if (lowerText.includes('round trip') || lowerText.includes('return')) {
      const returnMatch = text.match(/return[ing]?\s+(.+?)(?:\.|$)/i);
      if (returnMatch) {
        intent.flight.return = extractDate(returnMatch[1]);
      }
    }
  }

  if (hasHotelKeywords) {
    intent.types.push('hotel');

    const cityMatch = text.match(/(?:hotel|stay|room|suite)\s+(?:in|at|near)\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|\.|\bon\b)/);
    const city = cityMatch ? cityMatch[1].trim() : undefined;

    intent.hotel = {
      city,
      check_in: extractDate(text),
      budget_nightly_usd: extractBudget(text),
      brand_prefs: HOTEL_BRANDS.filter(brand =>
        text.toLowerCase().includes(brand.toLowerCase())
      ),
      amenities: AMENITIES.filter(amenity =>
        text.toLowerCase().includes(amenity.toLowerCase())
      ),
    };

    const nightsMatch = text.match(/(\d+)\s*nights?/i);
    if (nightsMatch && intent.hotel.check_in) {
      const checkInDate = new Date(intent.hotel.check_in);
      checkInDate.setDate(checkInDate.getDate() + parseInt(nightsMatch[1]));
      intent.hotel.check_out = checkInDate.toISOString().split('T')[0];
    }
  }

  intent.add_ons = {
    driver: lowerText.includes('driver') || lowerText.includes('chauffeur'),
    airport_transfer: lowerText.includes('airport transfer') || lowerText.includes('pickup'),
    dining: lowerText.includes('dining') || lowerText.includes('restaurant reservation'),
    lounge: lowerText.includes('lounge'),
    experiences: lowerText.includes('experience') || lowerText.includes('activity'),
  };

  if (intent.types.length === 0) {
    intent.types.push('other');
  }

  return intent;
}

export function generateSummaryMessage(intent: TravelIntent, userName: string): string {
  const parts: string[] = [];

  if (intent.flight) {
    const { from, to, depart, return: ret, cabin, passengers } = intent.flight;
    const route = [from, to].filter(Boolean).join(' → ');
    const dates = [depart, ret].filter(Boolean);

    if (route) {
      parts.push(`${route}`);
    }
    if (dates.length > 0) {
      parts.push(`on ${dates.join(' to ')}`);
    }
    if (cabin) {
      parts.push(`in ${cabin} class`);
    }
    if (passengers && passengers > 1) {
      parts.push(`for ${passengers} passengers`);
    }
  }

  if (intent.hotel) {
    const { city, check_in, check_out, brand_prefs } = intent.hotel;
    if (city) {
      parts.push(`hotel in ${city}`);
    }
    if (check_in && check_out) {
      parts.push(`${check_in} to ${check_out}`);
    }
    if (brand_prefs && brand_prefs.length > 0) {
      parts.push(`preferably ${brand_prefs.join(' or ')}`);
    }
  }

  if (parts.length === 0) {
    return `Got it, ${userName}. I'm working on your request. Can you provide more details about what you're looking for?`;
  }

  return `Perfect, ${userName}. I'm searching for ${parts.join(', ')}. I'll have options for you in just a moment.`;
}