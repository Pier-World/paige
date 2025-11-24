import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers: number;
  cabin_class: string;
  trip_type?: 'one_way' | 'round_trip';
}

interface FlightResult {
  id: string;
  airline: string;
  flight_number: string;
  product_name: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  features: string[];
  rating?: string;
  aircraft?: string;
  booking_class: string;
  provider: string;
  raw_data?: any;
}

async function searchWithDuffel(params: FlightSearchRequest, apiKey: string): Promise<FlightResult[]> {
  console.log('Searching with Duffel API:', params);

  try {
    const duffelRequest = {
      data: {
        slices: [
          {
            origin: params.origin,
            destination: params.destination,
            departure_date: params.departure_date,
          }
        ],
        passengers: Array(params.passengers).fill({
          type: 'adult',
        }),
        cabin_class: params.cabin_class === 'premium_economy' ? 'premium_economy' : params.cabin_class,
        return_offers: false,
      }
    };

    if (params.trip_type === 'round_trip' && params.return_date) {
      duffelRequest.data.slices.push({
        origin: params.destination,
        destination: params.origin,
        departure_date: params.return_date,
      });
    }

    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v1',
        'Accept': 'application/json',
      },
      body: JSON.stringify(duffelRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Duffel API error:', response.status, errorText);
      throw new Error(`Duffel API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Duffel response received:', result.data?.offers?.length || 0, 'offers');

    const offers = result.data?.offers || [];

    return offers.slice(0, 10).map((offer: any): FlightResult => {
      const slice = offer.slices[0];
      const segment = slice.segments[0];

      return {
        id: offer.id,
        airline: segment.marketing_carrier.name,
        flight_number: `${segment.marketing_carrier.iata_code} ${segment.marketing_carrier_flight_number}`,
        product_name: slice.fare_brand_name || `${params.cabin_class} Class`,
        departure_time: new Date(segment.departing_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        arrival_time: new Date(segment.arriving_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        duration: slice.duration,
        stops: slice.segments.length - 1,
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        features: extractFeatures(offer, segment),
        aircraft: segment.aircraft?.name,
        booking_class: segment.passengers[0]?.cabin_class_marketing_name || params.cabin_class,
        provider: 'duffel',
        raw_data: offer
      };
    });

  } catch (error) {
    console.error('Duffel search error:', error);
    throw error;
  }
}

async function searchWithSerpAPI(params: FlightSearchRequest, apiKey: string): Promise<FlightResult[]> {
  console.log('Searching with SerpAPI:', params);

  try {
    const serpParams = new URLSearchParams({
      engine: 'google_flights',
      departure_id: params.origin,
      arrival_id: params.destination,
      outbound_date: params.departure_date,
      currency: 'USD',
      hl: 'en',
      api_key: apiKey,
      type: params.trip_type === 'round_trip' ? '1' : '2',
    });

    if (params.return_date) {
      serpParams.append('return_date', params.return_date);
    }

    const response = await fetch(`https://serpapi.com/search?${serpParams.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', response.status, errorText);
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const result = await response.json();
    const flights = result.best_flights || result.other_flights || [];

    return flights.slice(0, 10).map((flight: any): FlightResult => {
      const firstFlight = flight.flights[0];

      return {
        id: `serp_${flight.flights.map((f: any) => f.flight_number).join('_')}`,
        airline: firstFlight.airline,
        flight_number: firstFlight.flight_number,
        product_name: flight.type || 'Standard',
        departure_time: firstFlight.departure_airport.time,
        arrival_time: flight.flights[flight.flights.length - 1].arrival_airport.time,
        duration: `${Math.floor(flight.total_duration / 60)}h ${flight.total_duration % 60}m`,
        stops: flight.flights.length - 1,
        price: flight.price,
        currency: 'USD',
        features: extractSerpFeatures(flight),
        booking_class: params.cabin_class,
        provider: 'serpapi',
        raw_data: flight
      };
    });

  } catch (error) {
    console.error('SerpAPI search error:', error);
    throw error;
  }
}

function extractFeatures(offer: any, segment: any): string[] {
  const features: string[] = [];

  if (segment.passengers[0]?.baggages?.length > 0) {
    features.push('Baggage included');
  }

  if (offer.available_services?.some((s: any) => s.type === 'seat')) {
    features.push('Seat selection available');
  }

  if (segment.distance) {
    features.push(`${Math.round(segment.distance / 1000)} km`);
  }

  return features;
}

function extractSerpFeatures(flight: any): string[] {
  const features: string[] = [];

  if (flight.carbon_emissions) {
    features.push(`${flight.carbon_emissions.difference_percent} carbon vs avg`);
  }

  if (flight.often_delayed_by_over_30_min) {
    features.push('Often delayed');
  }

  return features;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const searchParams: FlightSearchRequest = await req.json();

    console.log('Flight search request:', searchParams);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: providers } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (!providers || providers.length === 0) {
      throw new Error('No active flight search providers configured');
    }

    let results: FlightResult[] = [];
    let errors: string[] = [];

    for (const provider of providers) {
      try {
        console.log(`Attempting search with ${provider.provider}...`);

        if (provider.provider === 'duffel') {
          results = await searchWithDuffel(searchParams, provider.api_key);
          if (results.length > 0) break;
        } else if (provider.provider === 'serpapi') {
          results = await searchWithSerpAPI(searchParams, provider.api_key);
          if (results.length > 0) break;
        }

      } catch (error) {
        const errorMsg = `${provider.provider}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        continue;
      }
    }

    if (results.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          results: [],
          errors,
          message: 'No flights found from any provider'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    results.sort((a, b) => a.price - b.price);

    return new Response(
      JSON.stringify({
        success: true,
        results: results.slice(0, 10),
        total: results.length,
        search_params: searchParams,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in search-flights:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        results: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
