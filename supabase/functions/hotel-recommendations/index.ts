import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ParsedTravelRequest {
  city: string | null;
  dates: { start: string; end: string } | null;
  budget_range: { min: number; max: number } | null;
  trip_type: string | null;
  party_size: number | null;
  constraints: Record<string, any>;
  missing_fields: string[];
}

interface HotelRecommendation {
  id: string;
  name: string;
  score: number;
  score_breakdown: {
    budget_fit: number;
    vibe_match: number;
    neighborhood_match: number;
    loyalty_bonus: number;
    pier_perks: number;
    taste_similarity: number;
  };
  reason: string;
}

interface RecommendationResponse {
  hotels: HotelRecommendation[];
  filter_stats: {
    total_candidates: number;
    after_hard_filters: number;
    after_scoring: number;
    final_shown: number;
  };
}

// Scoring weights (tunable)
const SCORING_WEIGHTS = {
  budget_fit: 0.25,
  vibe_match: 0.20,
  neighborhood_match: 0.15,
  loyalty_bonus: 0.15,
  pier_perks: 0.10,
  taste_similarity: 0.15,
};

/**
 * Parse travel request using GPT-4 for NLU
 */
async function parseTravelRequest(
  message: string,
  userId: string,
  supabase: any
): Promise<ParsedTravelRequest> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Extract structured travel intent from this message. Return JSON only.

Message: "${message}"

Return JSON in this format:
{
  "city": "NYC" or null,
  "dates": {"start": "2024-12-14", "end": "2024-12-16"} or null,
  "budget_range": {"min": 300, "max": 600} or null,
  "trip_type": "business" | "leisure" | "romantic" | "family" | null,
  "party_size": 1 or null,
  "constraints": {},
  "missing_fields": ["city", "dates", "budget_range"]
}

If a field cannot be determined, use null. missing_fields should list critical missing info.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

/**
 * Apply hard filters to curated inventory
 */
async function applyHardFilters(
  supabase: any,
  city: string,
  budgetRange: { min: number; max: number } | null,
  constraints: Record<string, any>,
  userPreferences: any
): Promise<any[]> {
  let query = supabase
    .from('hotels')
    .select('*')
    .eq('primary_city', city)
    .eq('is_active', true);

  // Budget filter
  if (budgetRange) {
    query = query.or(`rate_mid.gte.${budgetRange.min},rate_mid.lte.${budgetRange.max}`);
  }

  const { data: hotels, error } = await query;

  if (error) throw error;
  if (!hotels) return [];

  // Apply must-have constraints from user preferences
  let filtered = hotels;
  
  if (userPreferences?.must_have && userPreferences.must_have.length > 0) {
    filtered = filtered.filter((hotel: any) => {
      // Check if hotel meets must-have requirements
      const mustHaves = userPreferences.must_have.map((m: string) => m.toLowerCase());
      
      // Simple matching logic - can be enhanced
      const hotelText = JSON.stringify(hotel).toLowerCase();
      return mustHaves.some((m: string) => hotelText.includes(m));
    });
  }

  // Apply hard-no constraints
  if (userPreferences?.hard_no && userPreferences.hard_no.length > 0) {
    const hardNos = userPreferences.hard_no.map((n: string) => n.toLowerCase());
    filtered = filtered.filter((hotel: any) => {
      const hotelText = JSON.stringify(hotel).toLowerCase();
      return !hardNos.some((n: string) => hotelText.includes(n));
    });
  }

  return filtered;
}

/**
 * Score hotels using weighted factors
 */
function scoreHotels(
  hotels: any[],
  userPreferences: any,
  budgetRange: { min: number; max: number } | null,
  tripType: string | null
): Array<{ hotel: any; score: number; breakdown: any }> {
  return hotels.map((hotel) => {
    const breakdown: any = {};

    // Budget Fit (0-1)
    if (budgetRange && hotel.rate_mid) {
      const midRate = hotel.rate_mid;
      if (midRate >= budgetRange.min && midRate <= budgetRange.max) {
        breakdown.budget_fit = 1.0;
      } else if (midRate < budgetRange.min) {
        breakdown.budget_fit = 0.5; // Below budget
      } else {
        const overage = midRate - budgetRange.max;
        const range = budgetRange.max - budgetRange.min;
        breakdown.budget_fit = Math.max(0, 1 - (overage / range));
      }
    } else {
      breakdown.budget_fit = 0.5; // Neutral if no budget
    }

    // Vibe Match (0-1)
    let vibeScore = 0.5;
    if (userPreferences?.atmosphere_ranked && hotel.atmosphere) {
      const userAtmospheres = userPreferences.atmosphere_ranked.map((a: string) => a.toLowerCase());
      const hotelAtmospheres = hotel.atmosphere.map((a: string) => a.toLowerCase());
      const matches = hotelAtmospheres.filter((a: string) => userAtmospheres.includes(a));
      vibeScore = matches.length / Math.max(userAtmospheres.length, 1);
    }
    breakdown.vibe_match = vibeScore;

    // Neighborhood Match (0-1)
    let neighborhoodScore = 0.5;
    if (userPreferences?.preferred_neighborhoods) {
      const cityNeighborhoods = userPreferences.preferred_neighborhoods[hotel.primary_city] || [];
      if (cityNeighborhoods.includes(hotel.neighborhood)) {
        neighborhoodScore = 1.0;
      }
    }
    breakdown.neighborhood_match = neighborhoodScore;

    // Loyalty Bonus (0-1)
    let loyaltyScore = 0;
    if (userPreferences?.loyalty_programs && hotel.loyalty_programs) {
      const userPrograms = userPreferences.loyalty_programs.map((p: any) => p.program?.toLowerCase());
      const hotelPrograms = hotel.loyalty_programs.map((p: string) => p.toLowerCase());
      const matches = hotelPrograms.filter((p: string) => userPrograms.includes(p));
      loyaltyScore = matches.length > 0 ? 1.0 : 0;
    }
    breakdown.loyalty_bonus = loyaltyScore;

    // Pier Perks (0-1)
    breakdown.pier_perks = hotel.pier_perk_level === 'VIP partner' ? 1.0 : 
                           hotel.pier_perk_level === 'preferred' ? 0.5 : 0;

    // Taste Similarity (0-1) - simplified for now
    breakdown.taste_similarity = hotel.quality_score_internal / 100;

    // Calculate weighted score
    const totalScore = 
      breakdown.budget_fit * SCORING_WEIGHTS.budget_fit +
      breakdown.vibe_match * SCORING_WEIGHTS.vibe_match +
      breakdown.neighborhood_match * SCORING_WEIGHTS.neighborhood_match +
      breakdown.loyalty_bonus * SCORING_WEIGHTS.loyalty_bonus +
      breakdown.pier_perks * SCORING_WEIGHTS.pier_perks +
      breakdown.taste_similarity * SCORING_WEIGHTS.taste_similarity;

    return {
      hotel,
      score: totalScore,
      breakdown,
    };
  });
}

/**
 * LLM re-rank top candidates with explanations
 */
async function llmRerank(
  candidates: Array<{ hotel: any; score: number; breakdown: any }>,
  userPreferences: any,
  tripType: string | null,
  topN: number = 3
): Promise<HotelRecommendation[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    // Fallback: return top scored without LLM
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((c) => ({
        id: c.hotel.id,
        name: c.hotel.name,
        score: c.score,
        score_breakdown: c.breakdown,
        reason: `High quality score (${c.hotel.quality_score_internal}/100) with excellent amenities.`,
      }));
  }

  const topCandidates = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 8); // Feed top 8 to LLM

  const prompt = `You are a luxury travel concierge. Rank these hotels for a ${tripType || 'business'} trip.

User preferences: ${JSON.stringify(userPreferences, null, 2)}

Hotels:
${topCandidates.map((c, i) => `
${i + 1}. ${c.hotel.name} (${c.hotel.neighborhood})
   Score: ${c.score.toFixed(2)}
   Notes: ${c.hotel.notes_curated || 'No notes'}
   Quality: ${c.hotel.quality_score_internal}/100
`).join('\n')}

Return JSON array of top ${topN} hotels with natural language "why this one" explanations:
[
  {
    "id": "hotel-uuid",
    "name": "Hotel Name",
    "score": 0.87,
    "reason": "Natural language explanation of why this hotel is perfect for this trip"
  }
]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Merge LLM results with score breakdowns and full hotel data
    return (result.hotels || result).map((llmHotel: any) => {
      const original = topCandidates.find((c) => c.hotel.id === llmHotel.id);
      return {
        ...llmHotel,
        score_breakdown: original?.breakdown || {},
        // Include full hotel data
        ...original?.hotel,
      };
    });
  } catch (error) {
    console.error('LLM rerank error:', error);
    // Fallback to scored results
    return topCandidates.slice(0, topN).map((c) => ({
      id: c.hotel.id,
      name: c.hotel.name,
      score: c.score,
      score_breakdown: c.breakdown,
      reason: c.hotel.notes_curated || `High quality score (${c.hotel.quality_score_internal}/100)`,
    }));
  }
}

/**
 * Main recommendation function
 */
async function getHotelRecommendations(
  supabase: any,
  city: string,
  dates: { start: string; end: string } | null,
  budgetRange: { min: number; max: number } | null,
  tripType: string | null,
  partySize: number | null,
  userId: string
): Promise<RecommendationResponse> {
  // Get user preferences
  const { data: userPreferences } = await supabase
    .from('user_hotel_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Step 1: Hard filters
  const allHotels = await applyHardFilters(supabase, city, budgetRange, {}, userPreferences);
  const totalCandidates = allHotels.length;

  if (totalCandidates === 0) {
    return {
      hotels: [],
      filter_stats: {
        total_candidates: 0,
        after_hard_filters: 0,
        after_scoring: 0,
        final_shown: 0,
      },
    };
  }

  // Step 2: Score hotels
  const scored = scoreHotels(allHotels, userPreferences, budgetRange, tripType);
  const afterScoring = scored.length;

  // Step 3: LLM re-rank
  const finalRecommendations = await llmRerank(scored, userPreferences, tripType, 3);

  return {
    hotels: finalRecommendations,
    filter_stats: {
      total_candidates: totalCandidates,
      after_hard_filters: totalCandidates,
      after_scoring,
      final_shown: finalRecommendations.length,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { city, dates, budget_range, trip_type, party_size, user_id } = await req.json();

    if (!city || !user_id) {
      return new Response(
        JSON.stringify({ error: 'city and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const result = await getHotelRecommendations(
      supabase,
      city,
      dates,
      budget_range,
      trip_type,
      party_size,
      user_id
    );

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Hotel recommendations error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

