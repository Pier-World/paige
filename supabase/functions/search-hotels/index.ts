import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface HotelSearchRequest {
  location: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  rooms?: number;
  min_rating?: number;
  max_price?: number;
}

interface HotelResult {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviews_count: number;
  address: string;
  price_per_night: number;
  currency: string;
  total_price: number;
  amenities: string[];
  room_type?: string;
  images: string[];
  distance_from_center?: string;
  provider: string;
  raw_data?: any;
}

async function searchWithSerpAPI(params: HotelSearchRequest, apiKey: string): Promise<HotelResult[]> {
  console.log('Searching hotels with SerpAPI:', params);

  try {
    const checkIn = new Date(params.check_in_date);
    const checkOut = new Date(params.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const serpParams = new URLSearchParams({
      engine: 'google_hotels',
      q: params.location,
      check_in_date: params.check_in_date,
      check_out_date: params.check_out_date,
      adults: params.guests.toString(),
      currency: 'USD',
      gl: 'us',
      hl: 'en',
      api_key: apiKey,
    });

    if (params.min_rating) {
      serpParams.append('min_rating', params.min_rating.toString());
    }

    const response = await fetch(`https://serpapi.com/search?${serpParams.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', response.status, errorText);
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const result = await response.json();
    const hotels = result.properties || [];

    return hotels.slice(0, 10).map((hotel: any): HotelResult => {
      const pricePerNight = hotel.rate_per_night?.lowest ? parseFloat(hotel.rate_per_night.lowest.replace(/[^0-9.]/g, '')) : 0;
      const totalPrice = pricePerNight * nights;

      return {
        id: hotel.property_token || hotel.name.replace(/\s+/g, '_'),
        name: hotel.name,
        description: hotel.description || '',
        rating: hotel.overall_rating || 0,
        reviews_count: hotel.reviews || 0,
        address: hotel.location || '',
        price_per_night: pricePerNight,
        currency: 'USD',
        total_price: totalPrice,
        amenities: hotel.amenities || [],
        images: hotel.images?.map((img: any) => img.thumbnail || img.original_image) || [],
        distance_from_center: hotel.nearby_places?.find((p: any) => p.type === 'City center')?.distance,
        provider: 'serpapi',
        raw_data: hotel
      };
    });

  } catch (error) {
    console.error('SerpAPI hotel search error:', error);
    throw error;
  }
}

function getFallbackHotels(params: HotelSearchRequest): HotelResult[] {
  console.log('Using fallback hotel data');

  const checkIn = new Date(params.check_in_date);
  const checkOut = new Date(params.check_out_date);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const mockHotels = [
    {
      id: 'hotel_1',
      name: 'The Luxury Collection Hotel',
      description: 'Five-star luxury hotel with ocean views',
      rating: 4.8,
      reviews_count: 1250,
      address: `Downtown ${params.location}`,
      price_per_night: 450,
      currency: 'USD',
      total_price: 450 * nights,
      amenities: ['Pool', 'Spa', 'Fine Dining', 'Concierge', 'Valet Parking'],
      images: [],
      distance_from_center: '0.5 miles',
      provider: 'mock'
    },
    {
      id: 'hotel_2',
      name: 'Grand Plaza Hotel',
      description: 'Elegant hotel in the heart of the city',
      rating: 4.6,
      reviews_count: 890,
      address: `Central ${params.location}`,
      price_per_night: 350,
      currency: 'USD',
      total_price: 350 * nights,
      amenities: ['Fitness Center', 'Restaurant', 'Business Center', 'Free WiFi'],
      images: [],
      distance_from_center: '0.3 miles',
      provider: 'mock'
    },
    {
      id: 'hotel_3',
      name: 'Boutique Suites',
      description: 'Modern boutique hotel with personalized service',
      rating: 4.7,
      reviews_count: 650,
      address: `Arts District, ${params.location}`,
      price_per_night: 280,
      currency: 'USD',
      total_price: 280 * nights,
      amenities: ['Rooftop Bar', 'Art Gallery', 'Complimentary Breakfast', 'Pet Friendly'],
      images: [],
      distance_from_center: '1.2 miles',
      provider: 'mock'
    }
  ];

  return mockHotels;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const searchParams: HotelSearchRequest = await req.json();

    console.log('Hotel search request:', searchParams);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: providers } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    let results: HotelResult[] = [];
    let errors: string[] = [];

    if (providers && providers.length > 0) {
      for (const provider of providers) {
        if (!provider.metadata?.supports?.includes('hotels')) {
          continue;
        }

        try {
          console.log(`Attempting hotel search with ${provider.provider}...`);

          if (provider.provider === 'serpapi') {
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
    }

    if (results.length === 0) {
      console.warn('No hotels found from APIs, using fallback');
      results = getFallbackHotels(searchParams);
    }

    results.sort((a, b) => b.rating - a.rating);

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
    console.error("Error in search-hotels:", error);

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
