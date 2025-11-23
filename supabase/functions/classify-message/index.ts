import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import OpenAI from 'npm:openai@4.59.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ClassificationResult {
  intent: 'flight' | 'hotel' | 'dining' | 'experience' | 'cancel' | 'other';
  confidence: number;
  entities: Record<string, any>;
  missing_info: string[];
  next_action: 'search' | 'clarify' | 'acknowledge';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    const rawBody = await req.json();
    
    const body = rawBody.body ? rawBody.body : rawBody;
    
    let request_id: string;
    let text: string;

    if (body.message_id) {
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('id, body, request_id')
        .eq('id', body.message_id)
        .maybeSingle();

      if (messageError || !message) {
        throw new Error(`Message not found: ${body.message_id}`);
      }

      if (!message.request_id) {
        throw new Error(`Message ${body.message_id} has no request_id`);
      }

      request_id = message.request_id;
      text = message.body;
    } else if (body.request_id && body.text) {
      request_id = body.request_id;
      text = body.text;
    } else {
      throw new Error('Missing required fields: either message_id OR (request_id AND text) are required');
    }

    if (!request_id || !text) {
      throw new Error('Missing required fields: request_id and text are required');
    }

    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('id')
      .eq('id', request_id)
      .maybeSingle();

    if (requestError || !request) {
      throw new Error(`Request not found: ${request_id}`);
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const prompt = `You are a luxury travel concierge AI assistant. Analyze the following customer message and classify their intent.

TODAY'S DATE: ${todayDate}
CURRENT YEAR: ${currentYear}

INTENT CATEGORIES:
- "flight": Booking flights, airfare, air travel
- "hotel": Hotel accommodations, lodging, stays
- "dining": Restaurant reservations, culinary experiences
- "experience": Activities, tours, events, entertainment
- "cancel": Canceling or modifying existing bookings
- "other": Greetings, questions, unclear requests

ENTITY EXTRACTION:
Extract ALL relevant details into the entities object as key-value pairs:
- dates: departure/arrival dates, check-in/out, reservation dates (ISO format YYYY-MM-DD)
  IMPORTANT: When extracting dates, ALWAYS use the current year (${currentYear}) or future years.
  Examples: "December 10th" should be "${currentYear}-12-10", "Jan 5" should be "${currentYear}-01-05"
  If a date would be in the past (before ${todayDate}), assume it's for NEXT year (${currentYear + 1})
- origin: departure city/airport (use IATA codes when possible: NYC→JFK/LGA/EWR, London→LHR)
- destination: arrival city/destination (use IATA codes when possible)
- pax: number of travelers/guests (default to 1 if not specified)
- budget: budget amount and currency
- preferences: cabin class, room type, cuisine type, special requests
- timeline: urgency, flexibility
- notes: any other relevant details

CONFIDENCE SCORING:
- 0.9-1.0: Crystal clear intent with key details
- 0.7-0.8: Clear intent, some details missing
- 0.5-0.6: Vague intent or many missing details
- 0.0-0.4: Unclear, greeting, or off-topic

Customer message: """${text}"""

Respond with JSON in this exact format:
{
  "intent": "flight|hotel|dining|experience|cancel|other",
  "confidence": 0.95,
  "entities": {
    "dates": "optional extracted dates",
    "origin": "optional origin city/airport",
    "destination": "optional destination",
    "pax": "optional number of travelers",
    "budget": "optional budget",
    "preferences": "optional preferences",
    "timeline": "optional timeline",
    "notes": "optional notes"
  },
  "missing_info": ["array", "of", "missing", "fields"],
  "next_action": "search|clarify|acknowledge"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const rawContent = completion.choices[0].message.content ?? '{"intent":"other","confidence":0.5,"entities":{},"missing_info":[],"next_action":"acknowledge"}';
    const classification: ClassificationResult = JSON.parse(rawContent);

    const { error: updateError } = await supabase
      .from('requests')
      .update({
        intent: classification.intent,
        entities: classification.entities,
        confidence: classification.confidence,
        mode: classification.confidence > 0.8 ? 'auto' : 'assisted',
      })
      .eq('id', request_id);

    if (updateError) {
      throw new Error(`Failed to update request: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        request_id,
        classification,
        next_action: classification.next_action,
        missing_info: classification.missing_info,
        should_search: classification.next_action === 'search',
        should_clarify: classification.next_action === 'clarify',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Classification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});