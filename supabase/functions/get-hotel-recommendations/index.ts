import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ParsedRequest {
  city: string;
  neighborhood?: string;
  dates?: {
    check_in: string;
    check_out: string;
  };
  budget_range?: {
    min?: number;
    max?: number;
  };
  trip_type?: string;
  party_size?: number;
  constraints?: {
    atmosphere?: string[];
    design_style?: string[];
    must_have?: string[];
    hard_no?: string[];
  };
}

interface HotelRecommendation {
  hotel_id: string;
  id: string;
  name: string;
  neighborhood: string;
  score: number;
  score_breakdown: Record<string, number>;
  reason: string;
  rate_estimate: {
    low: number;
    mid: number;
    high: number;
  };
  pier_benefits: string[];
  website_url?: string;
  image_hero?: string;
}

// Scoring weights - budget and location are most important
const SCORING_WEIGHTS = {
  budget_fit: 30,        // Max 30 points
  location_match: 25,    // Max 25 points  
  vibe_match: 20,        // Max 20 points
  quality: 15,           // Max 15 points
  pier_perks: 10,        // Max 10 points
};

/**
 * Calculate budget fit score (0-30 points)
 * Hotels within budget get full points, over budget loses points proportionally
 */
function scoreBudgetFit(hotel: any, maxBudget: number | null): number {
  if (!maxBudget) return 20; // Neutral score if no budget specified
  
  // Use pier_rate_mid or calculate from low/high
  const hotelRate = hotel.pier_rate_mid || 
    ((hotel.pier_rate_low || 0) + (hotel.pier_rate_high || 1000)) / 2;
  
  if (!hotelRate || hotelRate === 0) return 15; // Unknown rate, neutral
  
  if (hotelRate <= maxBudget) {
    // Within budget - full points, slightly prefer hotels that use more of budget (better value)
    const utilizationBonus = Math.min(5, (hotelRate / maxBudget) * 5);
    return 25 + utilizationBonus;
  } else {
    // Over budget - lose points proportionally
    const overage = (hotelRate - maxBudget) / maxBudget;
    return Math.max(0, 30 - (overage * 50)); // Lose 50 points per 100% overage
  }
}

/**
 * Calculate location/neighborhood match (0-25 points)
 */
function scoreLocationMatch(
  hotel: any, 
  requestedNeighborhood: string | null,
  userPreferredNeighborhoods: string[] | null
): number {
  let score = 15; // Base score
  
  // Exact neighborhood match from request
  if (requestedNeighborhood && hotel.neighborhood) {
    if (hotel.neighborhood.toLowerCase().includes(requestedNeighborhood.toLowerCase()) ||
        requestedNeighborhood.toLowerCase().includes(hotel.neighborhood.toLowerCase())) {
      score = 25;
    }
  }
  
  // User's preferred neighborhoods
  if (userPreferredNeighborhoods && userPreferredNeighborhoods.length > 0) {
    const hotelNeighborhood = (hotel.neighborhood || '').toLowerCase();
    if (userPreferredNeighborhoods.some(n => hotelNeighborhood.includes(n.toLowerCase()))) {
      score = Math.max(score, 22);
    }
  }
  
  return score;
}

/**
 * Calculate vibe/atmosphere match (0-20 points)
 */
function scoreVibeMatch(
  hotel: any,
  requestedAtmosphere: string[] | null,
  requestedStyle: string[] | null,
  tripType: string | null
): number {
  let score = 10; // Base score
  
  const hotelDescription = [
    hotel.description_short,
    hotel.description_long,
    hotel.vibe_tags,
    hotel.design_style,
    hotel.best_for,
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Match requested atmosphere
  if (requestedAtmosphere && requestedAtmosphere.length > 0) {
    const matches = requestedAtmosphere.filter(a => 
      hotelDescription.includes(a.toLowerCase())
    );
    score += (matches.length / requestedAtmosphere.length) * 5;
  }
  
  // Match requested design style
  if (requestedStyle && requestedStyle.length > 0) {
    const matches = requestedStyle.filter(s => 
      hotelDescription.includes(s.toLowerCase())
    );
    score += (matches.length / requestedStyle.length) * 3;
  }
  
  // Match trip type
  if (tripType) {
    const tripTypeMap: Record<string, string[]> = {
      'work': ['business', 'work', 'corporate', 'meeting', 'professional'],
      'business': ['business', 'work', 'corporate', 'meeting', 'professional'],
      'leisure': ['leisure', 'vacation', 'relax', 'getaway', 'escape'],
      'romantic': ['romantic', 'couples', 'honeymoon', 'intimate', 'luxury'],
      'family': ['family', 'kids', 'children', 'spacious'],
      'offsite': ['meeting', 'conference', 'team', 'group', 'corporate'],
    };
    
    const keywords = tripTypeMap[tripType.toLowerCase()] || [];
    if (keywords.some(k => hotelDescription.includes(k))) {
      score += 2;
    }
    
    // Check best_for field specifically
    if (hotel.best_for) {
      const bestFor = Array.isArray(hotel.best_for) ? hotel.best_for : [hotel.best_for];
      if (bestFor.some((b: string) => b.toLowerCase().includes(tripType.toLowerCase()))) {
        score += 3;
      }
    }
  }
  
  return Math.min(20, score);
}

/**
 * Calculate quality score (0-15 points)
 */
function scoreQuality(hotel: any): number {
  let score = 8; // Base score
  
  // Star rating
  if (hotel.star_rating) {
    score = Math.min(12, hotel.star_rating * 2.5);
  }
  
  // Internal quality score if available
  if (hotel.quality_score_internal) {
    score = Math.max(score, hotel.quality_score_internal / 100 * 15);
  }
  
  // Curated/vetted hotels get a bonus
  if (hotel.is_pier_curated || hotel.pier_vetted) {
    score = Math.min(15, score + 2);
  }
  
  return score;
}

/**
 * Calculate Pier perks bonus (0-10 points)
 */
function scorePierPerks(hotel: any): number {
  let score = 0;
  
  // Check for Pier partner status
  if (hotel.pier_partner_tier === 'VIP' || hotel.pier_perk_level === 'VIP partner') {
    score = 10;
  } else if (hotel.pier_partner_tier === 'preferred' || hotel.pier_perk_level === 'preferred') {
    score = 6;
  } else if (hotel.pier_partner_tier || hotel.has_pier_perks) {
    score = 3;
  }
  
  // Check for specific perks
  const perks = hotel.pier_perks || hotel.pier_benefits || [];
  if (Array.isArray(perks) && perks.length > 0) {
    score = Math.max(score, Math.min(10, perks.length * 2));
  }
  
  return score;
}

/**
 * Generate recommendation reason using LLM or fallback
 */
async function generateReasons(
  recommendations: any[],
  tripType: string | null,
  constraints: any
): Promise<Map<string, string>> {
  const reasons = new Map<string, string>();
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiKey || recommendations.length === 0) {
    // Fallback reasons
    recommendations.forEach(rec => {
      const hotel = rec.hotel;
      let reason = `Great choice in ${hotel.neighborhood || hotel.primary_city}`;
      
      if (rec.score_breakdown.budget_fit >= 25) {
        reason += ' within your budget';
      }
      if (rec.score_breakdown.vibe_match >= 15) {
        reason += ' with the vibe you\'re looking for';
      }
      if (hotel.description_short) {
        reason += `. ${hotel.description_short}`;
      }
      
      reasons.set(hotel.id, reason);
    });
    return reasons;
  }
  
  try {
    const hotelSummaries = recommendations.slice(0, 5).map((rec, i) => {
      const h = rec.hotel;
      return `${i + 1}. ${h.name} (${h.neighborhood}) - Score: ${rec.score.toFixed(0)}/100
   ${h.description_short || 'Luxury hotel'}
   Best for: ${h.best_for || 'Various'}`;
    }).join('\n');
    
    const prompt = `You are a luxury hotel concierge. Write a 1-sentence recommendation reason for each hotel.

Trip type: ${tripType || 'leisure'}
Guest preferences: ${JSON.stringify(constraints || {})}

Hotels:
${hotelSummaries}

Return JSON object with hotel names as keys and 1-sentence reasons as values. Be specific about why each hotel fits this trip.
Example: {"Hotel Name": "Perfect for your work trip with its quiet lobby workspace and proximity to Financial District meetings."}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const llmReasons = JSON.parse(data.choices[0].message.content);
      
      recommendations.forEach(rec => {
        const reason = llmReasons[rec.hotel.name] || 
          `Excellent choice in ${rec.hotel.neighborhood}`;
        reasons.set(rec.hotel.id, reason);
      });
    }
  } catch (error) {
    console.error('LLM reason generation error:', error);
  }
  
  // Ensure all hotels have reasons
  recommendations.forEach(rec => {
    if (!reasons.has(rec.hotel.id)) {
      reasons.set(rec.hotel.id, 
        `Great ${tripType || 'luxury'} option in ${rec.hotel.neighborhood || rec.hotel.primary_city}`
      );
    }
  });
  
  return reasons;
}

/**
 * Main recommendation function - ALWAYS returns results
 */
async function getHotelRecommendations(
  supabase: any,
  parsedRequest: ParsedRequest,
  userId: string,
  limit: number = 3,
  includeReasoning: boolean = true
): Promise<{
  success: boolean;
  recommendations: HotelRecommendation[];
  candidates_evaluated: number;
  filters_applied: Record<string, any>;
  event_id?: string;
}> {
  const { city, neighborhood, dates, budget_range, trip_type, party_size, constraints } = parsedRequest;
  
  console.log('=== GET HOTEL RECOMMENDATIONS ===');
  console.log('City:', city);
  console.log('Budget max:', budget_range?.max);
  console.log('Trip type:', trip_type);
  console.log('Constraints:', JSON.stringify(constraints));
  
  // Get user preferences (optional - don't fail if not found)
  let userPreferences: any = null;
  try {
    const { data } = await supabase
      .from('user_hotel_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    userPreferences = data;
  } catch (e) {
    console.log('No user preferences found, using defaults');
  }
  
  // Step 1: Get ALL hotels in the city (no hard filters that could eliminate everything)
  const { data: allHotels, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('primary_city', city);
  
  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
  
  if (!allHotels || allHotels.length === 0) {
    console.log('No hotels found for city:', city);
    return {
      success: true,
      recommendations: [],
      candidates_evaluated: 0,
      filters_applied: { city },
    };
  }
  
  console.log(`Found ${allHotels.length} hotels in ${city}`);
  
  // Step 2: Score ALL hotels (no elimination, just ranking)
  const scoredHotels = allHotels.map(hotel => {
    const budgetScore = scoreBudgetFit(hotel, budget_range?.max || null);
    const locationScore = scoreLocationMatch(
      hotel, 
      neighborhood || null,
      userPreferences?.preferred_neighborhoods?.[city] || null
    );
    const vibeScore = scoreVibeMatch(
      hotel,
      constraints?.atmosphere || null,
      constraints?.design_style || null,
      trip_type || null
    );
    const qualityScore = scoreQuality(hotel);
    const perksScore = scorePierPerks(hotel);
    
    const totalScore = budgetScore + locationScore + vibeScore + qualityScore + perksScore;
    
    return {
      hotel,
      score: totalScore,
      score_breakdown: {
        budget_fit: budgetScore,
        location_match: locationScore,
        vibe_match: vibeScore,
        quality: qualityScore,
        pier_perks: perksScore,
      },
    };
  });
  
  // Step 3: Sort by score (highest first)
  scoredHotels.sort((a, b) => b.score - a.score);
  
  console.log('Top 5 scored hotels:');
  scoredHotels.slice(0, 5).forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.hotel.name}: ${h.score.toFixed(1)} points`);
    console.log(`     Budget: ${h.score_breakdown.budget_fit}, Location: ${h.score_breakdown.location_match}, Vibe: ${h.score_breakdown.vibe_match}`);
  });
  
  // Step 4: Take top N (ALWAYS return at least `limit` hotels if available)
  const topHotels = scoredHotels.slice(0, Math.min(limit, scoredHotels.length));
  
  // Step 5: Generate reasons
  const reasons = includeReasoning 
    ? await generateReasons(topHotels, trip_type || null, constraints)
    : new Map();
  
  // Step 6: Format recommendations
  const recommendations: HotelRecommendation[] = topHotels.map(scored => {
    const hotel = scored.hotel;
    
    // Calculate rate estimate
    const rateLow = hotel.pier_rate_low || hotel.rack_rate_low || 200;
    const rateHigh = hotel.pier_rate_high || hotel.rack_rate_high || 800;
    const rateMid = hotel.pier_rate_mid || Math.round((rateLow + rateHigh) / 2);
    
    // Get pier benefits
    let pierBenefits: string[] = [];
    if (hotel.pier_perks) {
      pierBenefits = Array.isArray(hotel.pier_perks) ? hotel.pier_perks : [hotel.pier_perks];
    } else if (hotel.pier_benefits) {
      pierBenefits = Array.isArray(hotel.pier_benefits) ? hotel.pier_benefits : [hotel.pier_benefits];
    }
    
    return {
      hotel_id: hotel.id,
      id: hotel.id,
      name: hotel.name,
      neighborhood: hotel.neighborhood || '',
      score: scored.score,
      score_breakdown: scored.score_breakdown,
      reason: reasons.get(hotel.id) || `Great option in ${hotel.neighborhood || city}`,
      rate_estimate: {
        low: rateLow,
        mid: rateMid,
        high: rateHigh,
      },
      pier_benefits: pierBenefits,
      website_url: hotel.website_url,
      image_hero: hotel.image_hero_url || hotel.image_url,
    };
  });
  
  // Step 7: Log recommendation event (optional)
  let eventId: string | undefined;
  try {
    const { data: event } = await supabase
      .from('recommendation_events')
      .insert({
        user_id: userId,
        request_params: parsedRequest,
        candidates_count: allHotels.length,
        recommendations_returned: recommendations.length,
        top_recommendation_id: recommendations[0]?.hotel_id,
      })
      .select('id')
      .single();
    eventId = event?.id;
  } catch (e) {
    console.log('Could not log recommendation event:', e);
  }
  
  console.log(`Returning ${recommendations.length} recommendations`);
  
  return {
    success: true,
    recommendations,
    candidates_evaluated: allHotels.length,
    filters_applied: {
      city,
      budget_max: budget_range?.max,
      trip_type,
    },
    event_id: eventId,
  };
}

// Main handler
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    // Support both direct params and parsed_request wrapper
    const parsedRequest: ParsedRequest = body.parsed_request || {
      city: body.city,
      neighborhood: body.neighborhood,
      dates: body.dates,
      budget_range: body.budget_range,
      trip_type: body.trip_type,
      party_size: body.party_size,
      constraints: body.constraints,
    };
    
    const userId = body.user_id;
    const limit = body.limit || 3;
    const includeReasoning = body.include_reasoning !== false;

    if (!parsedRequest.city) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'city is required',
          recommendations: [],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'user_id is required',
          recommendations: [],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const result = await getHotelRecommendations(
      supabase,
      parsedRequest,
      userId,
      limit,
      includeReasoning
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Hotel recommendations error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recommendations: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
