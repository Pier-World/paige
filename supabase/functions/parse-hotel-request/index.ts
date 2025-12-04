import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ParseHotelRequestInput {
  message: string;
  user_id?: string;
  conversation_history?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

interface ParsedHotelRequest {
  city: string | null;
  neighborhood: string | null;
  dates: {
    check_in: string | null;
    check_out: string | null;
  };
  budget_range: {
    min: number | null;
    max: number | null;
  };
  party_size: number;
  trip_type: 'work' | 'leisure' | 'couples' | 'family' | 'offsite' | null;
  constraints: {
    atmosphere?: string[];
    design_style?: string[];
    must_have?: string[];
    hard_no?: string[];
  };
  missing_fields: string[];
  confidence: number;
  raw_extracted: Record<string, any>;
}

// City mapping for normalization
const CITY_MAP: Record<string, string> = {
  'new york': 'NYC',
  'new york city': 'NYC',
  'nyc': 'NYC',
  'los angeles': 'LA',
  'la': 'LA',
  'san francisco': 'SF',
  'sf': 'SF',
  'san fran': 'SF',
  'london': 'London',
};

const SUPPORTED_CITIES = ['NYC', 'LA', 'SF', 'London'];

// Helper to parse date ranges like "December 12-14" or "Dec 12-14th"
function parseDateRange(dateRange: string): { check_in: string; check_out: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbrevs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Match patterns like "December 12-14", "Dec 12-14th", "12/15-17", etc.
  const rangeMatch = dateRange.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*[-–—]\s*(\d{1,2})(?:st|nd|rd|th)?/i);
  if (rangeMatch) {
    const monthStr = rangeMatch[1].toLowerCase();
    const startDay = parseInt(rangeMatch[2]);
    const endDay = parseInt(rangeMatch[3]);
    
    let monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = monthAbbrevs.indexOf(monthStr);
    }
    
    if (monthIndex !== -1 && startDay && endDay) {
      const checkIn = new Date(currentYear, monthIndex, startDay);
      const checkOut = new Date(currentYear, monthIndex, endDay);
      
      // If the date is in the past, assume next year
      if (checkIn < today) {
        checkIn.setFullYear(currentYear + 1);
        checkOut.setFullYear(currentYear + 1);
      }
      
      return {
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
      };
    }
  }
  
  return null;
}

// Helper to resolve relative dates
function resolveRelativeDate(relativeDate: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lower = relativeDate.toLowerCase().trim();

  if (lower.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  if (lower.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  if (lower.includes('this weekend')) {
    const saturday = new Date(today);
    const dayOfWeek = saturday.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    return saturday.toISOString().split('T')[0];
  }
  if (lower.includes('next weekend')) {
    const nextSaturday = new Date(today);
    const dayOfWeek = nextSaturday.getDay();
    // If today is Saturday or Sunday, "next weekend" is next week's Saturday
    // Otherwise, it's this coming Saturday
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      // Today is weekend, so next weekend is next week
      const daysUntilNextSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      nextSaturday.setDate(nextSaturday.getDate() + daysUntilNextSaturday);
    } else {
      // Today is weekday, next weekend is this coming Saturday
      const daysUntilSaturday = 6 - dayOfWeek;
      nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
    }
    return nextSaturday.toISOString().split('T')[0];
  }

  // Try to parse single dates like "December 12" or "Dec 12th"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbrevs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  const singleDateMatch = relativeDate.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
  if (singleDateMatch) {
    const monthStr = singleDateMatch[1].toLowerCase();
    const day = parseInt(singleDateMatch[2]);
    
    let monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = monthAbbrevs.indexOf(monthStr);
    }
    
    if (monthIndex !== -1 && day) {
      const currentYear = today.getFullYear();
      const checkIn = new Date(currentYear, monthIndex, day);
      // If the date is in the past, assume next year
      if (checkIn < today) {
        checkIn.setFullYear(currentYear + 1);
      }
      return checkIn.toISOString().split('T')[0];
    }
  }

  // Try to parse as ISO date or common formats
  const dateMatch = relativeDate.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  if (dateMatch) {
    const dateStr = dateMatch[0];
    if (dateStr.includes('-')) {
      return dateStr;
    }
    // Parse MM/DD/YYYY or MM/DD/YY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }

  return null;
}

async function parseHotelRequest(
  input: ParseHotelRequestInput,
  supabase: any
): Promise<ParsedHotelRequest> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Get user preferences if user_id provided
  let userPreferences = null;
  if (input.user_id) {
    const { data: prefs } = await supabase
      .from('user_hotel_preferences')
      .select('*')
      .eq('user_id', input.user_id)
      .maybeSingle();
    userPreferences = prefs;
  }

  // Build conversation context
  const conversationContext = input.conversation_history
    ? input.conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')
    : '';

  // Calculate date context for the LLM
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();
  let daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  if (daysUntilSaturday === 0) daysUntilSaturday = 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSunday.getDate() + 1);
  
  const dateContext = {
    today: todayISO,
    nextSaturday: nextSaturday.toISOString().split('T')[0],
    nextSunday: nextSunday.toISOString().split('T')[0],
  };
  
  console.log('Date context for parsing:', dateContext);

  const prompt = `You are parsing a hotel search request. Extract structured parameters from the user's message.

USER MESSAGE: "${input.message}"

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n` : ''}

${userPreferences ? `USER PREFERENCES (merge with request):\n${JSON.stringify(userPreferences, null, 2)}\n` : ''}

SUPPORTED CITIES: ${SUPPORTED_CITIES.join(', ')}

DATE CONTEXT (use these for relative dates):
- Today: ${dateContext.today}
- Next Saturday: ${dateContext.nextSaturday}
- Next Sunday: ${dateContext.nextSunday}

IMPORTANT: If user says "next weekend", use check_in: ${dateContext.nextSaturday} and check_out: ${dateContext.nextSunday}

Return JSON matching this exact schema:
{
  "city": "NYC" | "LA" | "SF" | "London" | null,
  "neighborhood": string | null,
  "dates": {
    "check_in": "YYYY-MM-DD" | null,
    "check_out": "YYYY-MM-DD" | null
  },
  "budget_range": {
    "min": number | null,
    "max": number | null
  },
  "party_size": number (default 1),
  "trip_type": "work" | "leisure" | "couples" | "family" | "offsite" | null,
  "constraints": {
    "atmosphere": string[],
    "design_style": string[],
    "must_have": string[],
    "hard_no": string[]
  },
  "missing_fields": string[],
  "confidence": number (0-1),
  "raw_extracted": {}
}

RULES:
- If city is ambiguous or missing, set city: null and add "city" to missing_fields
- If dates are missing, add "dates" to missing_fields
- Map city aliases: "New York" → "NYC", "San Francisco" → "SF", "Los Angeles" → "LA"
- If dates are relative ("next week", "this weekend", "next weekend"), extract both check_in and check_out:
  * "next weekend" → check_in: Saturday, check_out: Sunday (2 nights)
  * "this weekend" → check_in: This Saturday, check_out: This Sunday
  * "next week" → check_in: Monday of next week, check_out: Friday of next week (or infer reasonable duration)
- If dates are in range format ("December 12-14", "Dec 12-14th"), extract:
  * check_in: December 12 (or Dec 12)
  * check_out: December 14 (or Dec 14)
- For relative dates, return them as-is (e.g., "next weekend") - they will be resolved in post-processing
- For date ranges, extract both dates in ISO format (YYYY-MM-DD)
- Map trip context: business trip → "work", romantic getaway → "couples", team offsite → "offsite", family vacation → "family"
- Extract vibe/atmosphere words into constraints.atmosphere (e.g., "quiet", "scene-y", "romantic")
- Extract design style mentions into constraints.design_style (e.g., "minimalist", "boutique", "classic luxury")
- Set confidence based on how complete the request is (0.9+ if city and dates present, lower if missing)
- Be smart: if user says "next weekend" and you can infer dates, set them and don't add to missing_fields
- Include all extracted raw data in raw_extracted for debugging

Return ONLY valid JSON, no markdown or explanation.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed: ParsedHotelRequest = JSON.parse(data.choices[0].message.content);

    // Post-process: normalize city
    if (parsed.city) {
      const normalized = CITY_MAP[parsed.city.toLowerCase()];
      if (normalized) {
        parsed.city = normalized;
      } else if (!SUPPORTED_CITIES.includes(parsed.city)) {
        parsed.city = null;
        if (!parsed.missing_fields.includes('city')) {
          parsed.missing_fields.push('city');
        }
      }
    }

    // Post-process: Try to parse date ranges first (e.g., "December 12-14")
    // Check if the original message contains a date range
    const dateRange = parseDateRange(input.message);
    if (dateRange) {
      console.log('Parsed date range from message:', dateRange);
      parsed.dates.check_in = dateRange.check_in;
      parsed.dates.check_out = dateRange.check_out;
      // Remove dates from missing_fields if we successfully parsed them
      parsed.missing_fields = parsed.missing_fields.filter((f: string) => f !== 'dates' && f !== 'check_in' && f !== 'check_out');
      parsed.confidence = Math.min(0.95, parsed.confidence + 0.2); // Boost confidence if we parsed dates
    }

    // Post-process: resolve relative dates
    if (parsed.dates.check_in && !parsed.dates.check_in.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const resolved = resolveRelativeDate(parsed.dates.check_in);
      if (resolved) {
        parsed.dates.check_in = resolved;
        // If check_out is not set but check_in is resolved, infer check_out (default 1 night)
        if (!parsed.dates.check_out || !parsed.dates.check_out.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const checkInDate = new Date(resolved);
          checkInDate.setDate(checkInDate.getDate() + 1);
          parsed.dates.check_out = checkInDate.toISOString().split('T')[0];
        }
      } else {
        parsed.dates.check_in = null;
        if (!parsed.missing_fields.includes('dates')) {
          parsed.missing_fields.push('dates');
        }
      }
    }

    if (parsed.dates.check_out && !parsed.dates.check_out.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const resolved = resolveRelativeDate(parsed.dates.check_out);
      if (resolved) {
        parsed.dates.check_out = resolved;
      } else if (parsed.dates.check_in) {
        // If check_in is set but check_out can't be resolved, infer it
        const checkInDate = new Date(parsed.dates.check_in);
        checkInDate.setDate(checkInDate.getDate() + 1);
        parsed.dates.check_out = checkInDate.toISOString().split('T')[0];
      } else {
        parsed.dates.check_out = null;
        if (!parsed.missing_fields.includes('dates')) {
          parsed.missing_fields.push('dates');
        }
      }
    }

    // Special handling for "next weekend" - if check_in is Saturday, check_out should be Sunday
    if (parsed.dates.check_in && parsed.dates.check_in.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const checkInDate = new Date(parsed.dates.check_in);
      const dayOfWeek = checkInDate.getDay();
      // If check-in is Saturday (6) and check-out is not set or is the same day, set check-out to Sunday
      if (dayOfWeek === 6 && (!parsed.dates.check_out || parsed.dates.check_out === parsed.dates.check_in)) {
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        parsed.dates.check_out = checkOutDate.toISOString().split('T')[0];
      }
    }

    // Ensure party_size defaults to 1
    if (!parsed.party_size || parsed.party_size < 1) {
      parsed.party_size = 1;
    }

    return parsed;
  } catch (error) {
    console.error('Parse hotel request error:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const input: ParseHotelRequestInput = await req.json();

    if (!input.message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const parsed = await parseHotelRequest(input, supabase);

    return new Response(
      JSON.stringify({ success: true, parsed_request: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Parse hotel request error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

