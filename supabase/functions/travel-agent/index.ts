/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// ============================================================================
// Inlined Types (from _shared)
// ============================================================================

interface AgentResult {
  success: boolean;
  data?: any;
  requires_human?: boolean;
  confidence?: number;
  message?: string;
}

interface UserContext {
  profile: any;
  preferences: any;
  recentTasks: any[];
  recentSearches: any[];
  pendingTasks: any[];
  upcomingEvents: any[];
  upcomingTrips: any[];
  todaySchedule: any[];
  tomorrowSchedule: any[];
  travelPatterns?: {
    preferredAirlines: string[];
    typicalBookingWindow: number;
    priceVsSchedule: number;
    averageSpendPerTrip: number;
    preferredDepartureTime: 'morning' | 'afternoon' | 'evening' | null;
    frequentDestinations: string[];
    typicalTripDuration: number;
  };
  loyaltyAccounts: any[];
  communicationStyle: {
    verbosity: 'terse' | 'balanced' | 'detailed';
    prefersOptions: boolean;
    preferredResponseFormat: 'text' | 'structured';
  };
  homeAirport?: string;
  timeZone: string;
}

/**
 * Infer return date from calendar events
 */
function inferReturnDate(context: UserContext, departDate: string): string | null {
  if (!departDate) return null;
  
  try {
    const depart = new Date(departDate);
    if (isNaN(depart.getTime())) {
      console.warn('Invalid depart date:', departDate);
      return null;
    }
    
    const typicalDuration = context.travelPatterns?.typicalTripDuration || 3;
    const expectedReturn = new Date(depart);
    expectedReturn.setDate(expectedReturn.getDate() + typicalDuration);

    const eventsAfterReturn = context.upcomingEvents.filter((event: any) => {
      if (!event.start_time) return false;
      try {
        const eventDate = new Date(event.start_time);
        if (isNaN(eventDate.getTime())) return false;
        return eventDate >= expectedReturn && eventDate <= new Date(expectedReturn.getTime() + 7 * 24 * 60 * 60 * 1000);
      } catch {
        return false;
      }
    });

    if (eventsAfterReturn.length > 0) {
      try {
        const firstEvent = new Date(eventsAfterReturn[0].start_time);
        if (!isNaN(firstEvent.getTime())) {
          firstEvent.setDate(firstEvent.getDate() - 1);
          return firstEvent.toISOString().split('T')[0];
        }
      } catch {
        // Fall through to default
      }
    }

    return expectedReturn.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error inferring return date:', error);
    return null;
  }
}

/**
 * Check for time conflicts between flight and calendar events
 */
function isTimeConflict(flightTime: string, eventStart: string, bufferMinutes: number = 120): boolean {
  const flight = new Date(flightTime);
  const event = new Date(eventStart);
  const buffer = bufferMinutes * 60 * 1000;
  return Math.abs(flight.getTime() - event.getTime()) < buffer;
}

/**
 * Get user context (simplified version for travel-agent)
 */
async function getUserContext(supabase: any, userId: string): Promise<UserContext> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, travel_preferences, personal_context, communication_preferences, time_zone')
    .eq('id', userId)
    .single();

  const { data: upcomingEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .order('start_time', { ascending: true })
    .limit(20);

  const { data: upcomingTrips } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', 'trip')
    .gte('data->>start_date', now.toISOString())
    .order('data->>start_date', { ascending: true })
    .limit(10);

  const personalContext = profile?.personal_context || {};
  const travelPatterns = {
    preferredAirlines: personalContext.preferredAirlines || profile?.travel_preferences?.preferred_airlines || [],
    typicalBookingWindow: personalContext.typicalBookingWindow || 14,
    priceVsSchedule: personalContext.priceVsSchedule || 0.5,
    averageSpendPerTrip: personalContext.averageSpendPerTrip || 0,
    preferredDepartureTime: personalContext.preferredDepartureTime || null,
    frequentDestinations: personalContext.frequentDestinations || [],
    typicalTripDuration: personalContext.typicalTripDuration || 3,
  };

  const commPrefs = profile?.communication_preferences || {};
  const communicationStyle = {
    verbosity: commPrefs.verbosity || 'balanced',
    prefersOptions: commPrefs.prefersOptions !== false,
    preferredResponseFormat: commPrefs.preferredResponseFormat || 'structured',
  };

  return {
    profile: profile || {},
    preferences: profile?.travel_preferences || {},
    recentTasks: [],
    recentSearches: [],
    pendingTasks: [],
    upcomingEvents: upcomingEvents || [],
    upcomingTrips: upcomingTrips || [],
    todaySchedule: [],
    tomorrowSchedule: [],
    travelPatterns,
    loyaltyAccounts: [],
    communicationStyle,
    homeAirport: personalContext.homeAirport || profile?.travel_preferences?.home_airport,
    timeZone: profile?.time_zone || 'America/New_York',
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FlightSearchParams {
  origin: string | null;
  destination: string | null;
  date: string;
  passengers?: number;
  cabin_class?: string;
  return_date?: string | null;
}

interface HotelSearchParams {
  location: string;
  check_in: string;
  check_out: string;
  guests?: number;
  rooms?: number;
}

interface TravelAgentRequest {
  userId: string;
  taskId: string;
  parameters: Record<string, any>;
  message: string;
}

/**
 * Parse flight search parameters from intent parameters
 */
function parseFlightParams(parameters: Record<string, any>): FlightSearchParams {
  // Helper to validate and format date
  const parseDate = (dateStr: any): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateStr);
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  return {
    origin: parameters.origin || parameters.from || null,
    destination: parameters.destination || parameters.to || null,
    date: parseDate(parameters.date || parameters.departure_date || parameters.depart_date) || new Date().toISOString().split('T')[0],
    return_date: parseDate(parameters.return_date || parameters.returnDate) || null,
    passengers: parameters.passengers || parameters.adults || 1,
    cabin_class: parameters.cabin_class || parameters.cabin || parameters.class || 'economy',
  };
}

/**
 * Parse hotel search parameters from intent parameters
 */
function parseHotelParams(parameters: Record<string, any>): HotelSearchParams {
  return {
    location: parameters.location || parameters.destination || '',
    check_in: parameters.check_in || parameters.date || new Date().toISOString().split('T')[0],
    check_out: parameters.check_out || '',
    guests: parameters.guests || parameters.passengers || 1,
    rooms: parameters.rooms || 1,
  };
}

/**
 * Calculate flight score based on comprehensive user context
 */
function calculateFlightScore(flight: any, context: UserContext): number {
  let score = 100;

  // Preferred airline bonus
  if (context.travelPatterns?.preferredAirlines?.includes(flight.airline)) {
    score += 20;
  }

  // Nonstop preference
  if (flight.stops === 0) {
    score += 15;
  }

  // Time preference
  if (flight.departure_time) {
    try {
      const departureDate = new Date(flight.departure_time);
      if (!isNaN(departureDate.getTime())) {
        const hour = departureDate.getHours();
        if (context.travelPatterns?.preferredDepartureTime === 'morning' && hour < 12) {
          score += 10;
        } else if (context.travelPatterns?.preferredDepartureTime === 'afternoon' && hour >= 12 && hour < 17) {
          score += 10;
        } else if (context.travelPatterns?.preferredDepartureTime === 'evening' && hour >= 17) {
          score += 10;
        }
      }
    } catch {
      // Ignore date parsing errors
    }
  }

  // Calendar awareness - penalize flights that conflict with events
  const hasConflict = context.upcomingEvents.some((event: any) =>
    isTimeConflict(flight.arrival_time, event.start_time)
  );
  if (hasConflict) {
    score -= 30;
  }

  // Price vs schedule preference
  const priceScore = Math.max(0, (1 - (flight.price / 2000)) * 20); // normalize to 0-20
  let scheduleScore = 10; // default
  if (flight.departure_time) {
    try {
      const departureDate = new Date(flight.departure_time);
      if (!isNaN(departureDate.getTime())) {
        const hour = departureDate.getHours();
        scheduleScore = Math.max(0, (1 - Math.abs(hour - 8) / 12) * 20); // prefer 8am
      }
    } catch {
      // Use default
    }
  }

  const priceWeight = context.travelPatterns?.priceVsSchedule || 0.5;
  score += (priceScore * priceWeight) + (scheduleScore * (1 - priceWeight));

  // Cabin class match
  const cabinPreference = context.preferences?.cabin_preference;
  if (cabinPreference && flight.booking_class === cabinPreference) {
    score += 5;
  }

  return score;
}

/**
 * Rank flight options by comprehensive user preferences and context
 */
function rankFlightsByPreferences(
  flights: any[],
  context: UserContext
): any[] {
  return flights
    .map(flight => ({
      ...flight,
      preference_score: calculateFlightScore(flight, context),
    }))
    .sort((a, b) => {
      // Sort by preference score first, then by price
      if (b.preference_score !== a.preference_score) {
        return b.preference_score - a.preference_score;
      }
      return a.price - b.price;
    });
}

/**
 * Search flights using existing search-flights function
 */
async function searchFlights(
  params: FlightSearchParams,
  supabaseUrl: string,
  serviceKey: string
): Promise<any[]> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/search-flights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: params.origin,
        destination: params.destination,
        departure_date: params.date,
        return_date: params.return_date,
        passengers: params.passengers || 1,
        cabin_class: params.cabin_class || 'economy',
        trip_type: params.return_date ? 'round_trip' : 'one_way',
      }),
    });

    if (!response.ok) {
      // Try to get error details
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          try {
            const parsed = JSON.parse(errorBody);
            errorDetails = parsed.error || parsed.message || errorBody;
          } catch {
            errorDetails = errorBody;
          }
        }
      } catch {
        // Use statusText if parsing fails
      }
      throw new Error(`Flight search failed (${response.status}): ${errorDetails}`);
    }

    const result = await response.json();
    return result.results || [];
  } catch (error) {
    console.error('Flight search error:', error);
    // If search-flights function doesn't exist, return empty array instead of failing
    if (error instanceof Error && error.message.includes('404') || error.message.includes('Not Found')) {
      console.warn('search-flights function not found, returning empty results');
      return [];
    }
    throw error;
  }
}

/**
 * Search hotels using curated inventory matching engine
 */
async function searchHotels(
  params: HotelSearchParams,
  supabaseUrl: string,
  serviceKey: string,
  userId: string
): Promise<any[]> {
  // Use new curated inventory matching engine
  try {
    // Map city name to primary_city enum value
    const cityMap: Record<string, string> = {
      'new york': 'NYC',
      'nyc': 'NYC',
      'new york city': 'NYC',
      'los angeles': 'LA',
      'la': 'LA',
      'san francisco': 'SF',
      'sf': 'SF',
      'london': 'London',
    };
    
    const city = cityMap[params.location.toLowerCase()] || params.location.toUpperCase();
    
    // Parse dates
    const dates = params.check_in && params.check_out ? {
      start: params.check_in,
      end: params.check_out,
    } : null;
    
    // Call new hotel-recommendations function
    const response = await fetch(`${supabaseUrl}/functions/v1/hotel-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        city,
        dates,
        budget_range: null, // Will be extracted from user preferences
        trip_type: null, // Can be inferred from context
        party_size: params.guests || 1,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      console.error('Hotel recommendations error:', response.status, await response.text());
      return [];
    }

    const result = await response.json();
    if (result.success && result.hotels) {
      // Return full recommendation objects with hotel data
      return result.hotels.map((h: any) => ({
        id: h.id,
        name: h.name,
        score: h.score,
        score_breakdown: h.score_breakdown,
        reason: h.reason,
        // Include full hotel data for UI
        neighborhood: h.neighborhood,
        primary_city: h.primary_city,
        rate_mid: h.rate_mid,
        quality_score_internal: h.quality_score_internal,
        pier_perk_level: h.pier_perk_level,
        pier_benefits: h.pier_benefits,
        notes_curated: h.notes_curated,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting hotel recommendations:', error);
    return [];
  }
}

/**
 * Create booking entity and trip entity
 */
async function createBooking(
  supabase: any,
  userId: string,
  bookingData: any,
  bookingType: 'flight' | 'hotel'
): Promise<{ booking: any; trip: any }> {
  // Create booking entity
  const { data: booking, error: bookingError } = await supabase
    .from('entities')
    .insert({
      user_id: userId,
      entity_type: bookingType,
      data: bookingData,
      source: 'agent',
      confidence: 1.0,
    })
    .select()
    .single();

  if (bookingError) {
    throw new Error(`Failed to create booking entity: ${bookingError.message}`);
  }

  // Check if trip already exists for this date range
  const tripStart = bookingData.departure_date || bookingData.check_in;
  const tripEnd = bookingData.return_date || bookingData.check_out;

  let trip;
  const { data: existingTrips } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', 'trip')
    .gte('data->>start_date', tripStart)
    .lte('data->>start_date', tripEnd);

  if (existingTrips && existingTrips.length > 0) {
    // Use existing trip
    trip = existingTrips[0];
  } else {
    // Create new trip entity
    const tripData = {
      name: `${bookingData.origin || bookingData.location} Trip`,
      start_date: tripStart,
      end_date: tripEnd,
      destination: bookingData.destination || bookingData.location,
    };

    const { data: newTrip, error: tripError } = await supabase
      .from('entities')
      .insert({
        user_id: userId,
        entity_type: 'trip',
        data: tripData,
        source: 'agent',
        confidence: 1.0,
      })
      .select()
      .single();

    if (tripError) {
      throw new Error(`Failed to create trip entity: ${tripError.message}`);
    }
    trip = newTrip;
  }

  // Create relationship: trip includes booking
  await supabase
    .from('relationships')
    .insert({
      user_id: userId,
      from_entity_id: trip.id,
      to_entity_id: booking.id,
      relationship_type: 'includes',
      metadata: {},
    });

  return { booking, trip };
}

/**
 * Enrich flight parameters with context - CRITICAL: Auto-fill from context
 */
function enrichFlightParams(
  params: FlightSearchParams,
  context: UserContext
): FlightSearchParams & { assumptions: string[] } {
  const assumptions: string[] = [];

  // Auto-fill origin from home airport or profile
  if (!params.origin && context.homeAirport) {
    params.origin = context.homeAirport;
    assumptions.push(`Using your home airport (${context.homeAirport})`);
  }

  // Use learned preferences
  const preferredAirlines = params.cabin_class ? [] : 
    (context.travelPatterns?.preferredAirlines || 
     context.preferences?.preferred_airlines || []);

  // Infer return date from calendar if not specified
  let returnDate = params.return_date;
  if (!returnDate && params.date) {
    const inferred = inferReturnDate(context, params.date);
    if (inferred) {
      returnDate = inferred;
      assumptions.push(`Inferred return date from your typical trip duration`);
    }
  }

  return {
    ...params,
    return_date: returnDate,
    assumptions,
  };
}

/**
 * Handle flight search request with intelligent enrichment
 */
async function handleFlightSearch(
  supabase: any,
  userId: string,
  taskId: string,
  parameters: Record<string, any>
): Promise<AgentResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Get comprehensive user context
  const context = await getUserContext(supabase, userId);

  // Parse and enrich parameters
  const baseParams = parseFlightParams(parameters);
  const enrichedParams = enrichFlightParams(baseParams, context);

  // Update task UI state with search progress
  await supabase
    .from('tasks')
    .update({
      ui_state: {
        current_step: 'searching_flights',
        progress: 40,
        search_params: enrichedParams,
        assumptions: enrichedParams.assumptions,
      },
    })
    .eq('id', taskId);

  // Validate required parameters
  if (!enrichedParams.destination || !enrichedParams.date) {
    return {
      success: false,
      requires_human: true,
      confidence: 0.5,
      message: 'I need a destination and date to search for flights. Where and when would you like to travel?',
    };
  }

  // Search flights
  let flights: any[] = [];
  try {
    flights = await searchFlights(enrichedParams, supabaseUrl, serviceKey);
  } catch (error) {
    console.error('Flight search failed:', error);
    // Return error result instead of throwing
    await supabase
      .from('tasks')
      .update({
        ui_state: {
          current_step: 'error',
          progress: 0,
          error_message: error instanceof Error ? error.message : 'Flight search failed',
        },
      })
      .eq('id', taskId);

    return {
      success: false,
      requires_human: true,
      confidence: 0.5,
      message: `I encountered an error while searching for flights: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`,
      data: { flights: [], error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }

  if (flights.length === 0) {
    await supabase
      .from('tasks')
      .update({
        ui_state: {
          current_step: 'no_results',
          progress: 100,
        },
      })
      .eq('id', taskId);

    return {
      success: false,
      requires_human: false,
      confidence: 0.9,
      message: `I couldn't find any flights from ${enrichedParams.origin || 'your location'} to ${enrichedParams.destination} on ${enrichedParams.date}. Would you like to try different dates or destinations?`,
      data: { flights: [] },
    };
  }

  // Rank by user preferences and context
  const rankedFlights = rankFlightsByPreferences(flights, context);

  // Generate AI recommendation
  const topFlight = rankedFlights[0];
  const recommendationReason = generateRecommendationReason(topFlight, context);

  // Update task with rich results
  await supabase
    .from('tasks')
    .update({
      status: 'completed',
      output_data: {
        search_type: 'flight',
        parameters: enrichedParams,
        results_count: rankedFlights.length,
        top_options: rankedFlights.slice(0, 3),
      },
      ui_state: {
        current_step: 'results_ready',
        progress: 100,
        rendered_component: 'FlightComparisonGrid',
        results_preview: rankedFlights.slice(0, 5),
        total_results: rankedFlights.length,
        ai_recommendation: {
          flight_id: topFlight.id,
          reason: recommendationReason,
        },
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  return {
    success: true,
    confidence: 0.9,
    message: `I found ${rankedFlights.length} flight options. ${recommendationReason}`,
    data: {
      flights: rankedFlights.slice(0, 10),
      search_params: enrichedParams,
      recommendation: {
        flight: topFlight,
        reason: recommendationReason,
      },
    },
  };
}

/**
 * Generate recommendation reason based on user context
 */
function generateRecommendationReason(flight: any, context: UserContext): string {
  const reasons: string[] = [];

  // Preferred airline
  if (context.travelPatterns?.preferredAirlines?.includes(flight.airline)) {
    reasons.push(`matches your preferred airline (${flight.airline})`);
  }

  // Nonstop preference
  if (flight.stops === 0) {
    reasons.push('nonstop flight');
  }

  // Time preference
  const hour = new Date(flight.departure_time).getHours();
  if (context.travelPatterns?.preferredDepartureTime === 'morning' && hour < 12) {
    reasons.push('morning departure');
  }

  // Calendar awareness
  const hasConflict = context.upcomingEvents.some((event: any) =>
    isTimeConflict(flight.arrival_time, event.start_time)
  );
  if (!hasConflict) {
    reasons.push('no calendar conflicts');
  }

  // Price
  if (flight.price < 500) {
    reasons.push('great value');
  }

  if (reasons.length === 0) {
    return 'This option best matches your preferences.';
  }

  return `I recommend this flight because it's ${reasons.join(', ')}.`;
}

/**
 * Handle hotel search request
 */
async function handleHotelSearch(
  supabase: any,
  userId: string,
  taskId: string,
  parameters: Record<string, any>
): Promise<AgentResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Parse parameters
  const hotelParams = parseHotelParams(parameters);

  if (!hotelParams.location || !hotelParams.check_in || !hotelParams.check_out) {
    return {
      success: false,
      requires_human: true,
      confidence: 0.5,
      message: 'I need more information to search for hotels. Please provide location, check-in, and check-out dates.',
    };
  }

  // Search hotels using curated inventory matching engine
  const hotels = await searchHotels(hotelParams, supabaseUrl, serviceKey, userId);

  if (hotels.length === 0) {
    return {
      success: false,
      requires_human: false,
      confidence: 0.8,
      message: `I couldn't find any hotels in ${hotelParams.location} for those dates. Hotel search is currently being enhanced. Would you like me to help you with flights instead?`,
      data: { hotels: [] },
    };
  }

  // Get current task to preserve ui_state
  const { data: currentTask } = await supabase
    .from('tasks')
    .select('ui_state')
    .eq('id', taskId)
    .single();

  // Update task with results - use new hotel recommendations format
  await supabase
    .from('tasks')
    .update({
      output_data: {
        search_type: 'hotel',
        parameters: hotelParams,
        hotels: hotels, // Full recommendation objects with scores
        results_count: hotels.length,
        top_options: hotels.slice(0, 3),
      },
      ui_state: {
        ...currentTask?.ui_state,
        rendered_component: 'HotelRecommendations',
        current_step: 'results_ready',
        progress: 100,
      },
    })
    .eq('id', taskId);

  return {
    success: true,
    confidence: 0.8,
    message: `I found ${hotels.length} hotel options in ${hotelParams.location}.`,
    data: {
      hotels: hotels.slice(0, 10),
      search_params: hotelParams,
    },
  };
}

/**
 * Handle booking creation
 */
async function handleCreateBooking(
  supabase: any,
  userId: string,
  taskId: string,
  bookingData: any
): Promise<AgentResult> {
  const bookingType = bookingData.type || 'flight';

  try {
    const { booking, trip } = await createBooking(
      supabase,
      userId,
      bookingData,
      bookingType as 'flight' | 'hotel'
    );

    // Update task
    await supabase
      .from('tasks')
      .update({
        status: 'completed',
        output_data: {
          booking_id: booking.id,
          trip_id: trip.id,
          booking_type: bookingType,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return {
      success: true,
      confidence: 1.0,
      message: `I've created your ${bookingType} booking and linked it to your trip. You can view it in your travel page.`,
      data: {
        booking,
        trip,
      },
    };
  } catch (error) {
    console.error('Booking creation error:', error);
    return {
      success: false,
      requires_human: true,
      confidence: 0.5,
      message: 'I encountered an error creating your booking. A human agent will help you complete this.',
    };
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname;

    // Route to appropriate handler
    if (path.includes('/search-flights')) {
      const { userId, taskId, parameters }: TravelAgentRequest = await req.json();

      if (!userId || !taskId) {
        return new Response(
          JSON.stringify({ error: 'userId and taskId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await handleFlightSearch(supabase, userId, taskId, parameters);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.includes('/search-hotels')) {
      const { userId, taskId, parameters }: TravelAgentRequest = await req.json();

      if (!userId || !taskId) {
        return new Response(
          JSON.stringify({ error: 'userId and taskId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await handleHotelSearch(supabase, userId, taskId, parameters);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.includes('/create-booking')) {
      const { userId, taskId, bookingData } = await req.json();

      if (!userId || !taskId || !bookingData) {
        return new Response(
          JSON.stringify({ error: 'userId, taskId, and bookingData are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await handleCreateBooking(supabase, userId, taskId, bookingData);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint. Use /search-flights, /search-hotels, or /create-booking' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Travel agent error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

