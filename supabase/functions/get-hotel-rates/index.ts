import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GetHotelRatesInput {
  hotel_ids: string[];
  check_in: string;
  check_out: string;
  guests: number;
}

interface HotelRateResult {
  hotel_id: string;
  rates: {
    source: string;
    rate_per_night: number;
    total: number;
    cancellation: string;
    perks: string[];
  }[];
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const input: GetHotelRatesInput = await req.json();

    if (!input.hotel_ids || input.hotel_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'hotel_ids is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!input.check_in || !input.check_out) {
      return new Response(
        JSON.stringify({ error: 'check_in and check_out are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // V1: Return stored rates from hotels table
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, rate_low, rate_mid, rate_high, pier_benefits, booking_partners')
      .in('id', input.hotel_ids);

    if (error) {
      throw error;
    }

    if (!hotels || hotels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hotels found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nights = calculateNights(input.check_in, input.check_out);

    const results: HotelRateResult[] = hotels.map((hotel) => ({
      hotel_id: hotel.id,
      rates: [
        {
          source: 'stored',
          rate_per_night: hotel.rate_mid || 0,
          total: (hotel.rate_mid || 0) * nights,
          cancellation: 'varies',
          perks: hotel.pier_benefits || [],
        },
      ],
    }));

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get hotel rates error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

