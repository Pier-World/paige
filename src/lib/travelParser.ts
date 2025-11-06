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

  const monthDayRegex = /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?/i;
  const monthMatch = text.match(monthDayRegex);
  if (monthMatch) {
    let year = refDate.getFullYear();
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = monthMap[monthMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(monthMatch[2]);
    const date = new Date(year, month, day, 12, 0, 0, 0);
    const refDateMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
    if (date < refDateMidnight) {
      year += 1;
      date.setFullYear(year);
    }
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
    let from: string | undefined;
    let to: string | undefined;

    if (parts.length > 1) {
      from = extractAirportCode(parts[0]);
      const destinationPart = parts[1].split(/\s+on\s+/i)[0];
      to = extractAirportCode(destinationPart);
    }

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
  const missingInfo: string[] = [];
  let routeDescription = '';
  let datesDescription = '';
  let cabinDescription = '';
  let tripType = 'one way';

  if (intent.flight) {
    const { from, to, depart, return: ret, cabin, passengers, nonstop } = intent.flight;

    if (!from) missingInfo.push('departure city');
    if (!to) missingInfo.push('destination');
    if (!depart) missingInfo.push('travel dates');
    if (!cabin) missingInfo.push('cabin preference (Economy, Business, or First class)');

    const fromCity = from && from.length === 3 ? getCityName(from) || from : from;
    const toCity = to && to.length === 3 ? getCityName(to) || to : to;

    if (from && to) {
      routeDescription = `from ${fromCity} to ${toCity}`;
    } else if (to) {
      routeDescription = `to ${toCity}`;
    }

    if (depart) {
      const departDate = new Date(depart + 'T12:00:00Z');
      const formattedDepart = departDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

      if (ret) {
        const returnDate = new Date(ret + 'T12:00:00Z');
        const formattedReturn = returnDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        datesDescription = `on ${formattedDepart}`;
        tripType = 'round trip';
      } else {
        datesDescription = `on ${formattedDepart}`;
        tripType = 'one way';
      }
    }

    if (cabin) {
      cabinDescription = ` ${cabin.toLowerCase()} class`;
    }
  }

  if (missingInfo.length > 0) {
    return `Got it, ${userName}. To provide the best options, could you please share your ${missingInfo.join(', ')}?`;
  }

  if (!routeDescription) {
    return `Got it, ${userName}. I'm working on your request. Can you provide more details about what you're looking for?`;
  }

  return `Perfect, ${userName}! I'm looking into ${tripType}${cabinDescription} flights ${routeDescription} ${datesDescription}. I'll present a few options that should be better than what you'd be able to find regularly.`;
}

function getCityName(code: string): string | undefined {
  const cityMap: Record<string, string> = {
    'JFK': 'New York', 'LGA': 'New York', 'EWR': 'New York',
    'LAX': 'Los Angeles', 'BUR': 'Los Angeles', 'SNA': 'Los Angeles',
    'SFO': 'San Francisco', 'OAK': 'San Francisco', 'SJC': 'San Francisco',
    'ORD': 'Chicago', 'MDW': 'Chicago',
    'DCA': 'Washington DC', 'IAD': 'Washington DC', 'BWI': 'Washington DC',
    'MIA': 'Miami', 'FLL': 'Miami',
    'LHR': 'London', 'LGW': 'London', 'STN': 'London',
    'CDG': 'Paris', 'ORY': 'Paris',
    'NRT': 'Tokyo', 'HND': 'Tokyo',
    'AUS': 'Austin',
    'BOS': 'Boston',
    'SEA': 'Seattle',
    'DEN': 'Denver',
    'ATL': 'Atlanta',
    'PHX': 'Phoenix',
    'LAS': 'Las Vegas',
    'MCO': 'Orlando',
  };

  return cityMap[code.toUpperCase()];
}