import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface OrchestratorRequest {
  request_id: string;
  conversation_id: string;
}

interface OrchestratorDecision {
  action: 'acknowledge' | 'clarify' | 'search' | 'escalate';
  reasoning: string;
  confidence: number;
  message: string;
  next_steps: string[];
  search_strategy?: {
    apis_to_call: string[];
    search_parameters: Record<string, any>;
    ranking_criteria: string[];
  };
  clarification_needed?: {
    priority_fields: string[];
    questions: string[];
    assumptions_to_confirm: string[];
  };
  metadata: Record<string, any>;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 2000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (error?.status === 429 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2.45.0');
    const OpenAI = (await import('npm:openai@4.59.0')).default;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    const { request_id, conversation_id }: OrchestratorRequest = await req.json();

    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', request_id)
      .maybeSingle();

    if (requestError || !request) {
      throw new Error(`Request not found: ${request_id}`);
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('body, direction, sent_by, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = messages?.map(m => 
      `[${m.created_at}] ${m.direction === 'in' ? 'Customer' : 'Assistant'}: ${m.body}`
    ).join('\n') || '';

    const { data: conversation } = await supabase
      .from('conversations')
      .select('channel_id')
      .eq('id', conversation_id)
      .maybeSingle();

    const { data: channel } = await supabase
      .from('channels')
      .select('profile_id, profiles(*)')
      .eq('id', conversation?.channel_id)
      .maybeSingle();

    const profile = channel?.profiles || {};

    const { data: pastRequests } = await supabase
      .from('requests')
      .select('intent, entities, status, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const customerHistory = pastRequests?.map(r => 
      `${r.intent} request (${r.status}) - ${JSON.stringify(r.entities)}`
    ).join('\n') || 'No previous requests';

    const systemPrompt = `You are an elite AI orchestrator for a luxury travel concierge service. Your role is to analyze customer requests with deep reasoning and decide the optimal next action.\n\nYou have access to:\n- Real-time flight APIs (Duffel, Amadeus)\n- Hotel booking APIs (Mondee, Booking.com)\n- Experience providers (Viator, GetYourGuide)\n- Restaurant reservations (OpenTable, Resy)\n- Customer preferences and history\n\nYour decisions should be:\n1. INTELLIGENT: Consider context, urgency, and customer preferences\n2. EFFICIENT: Minimize back-and-forth while ensuring quality\n3. PERSONALIZED: Use customer history to inform recommendations\n4. PROACTIVE: Suggest related services when appropriate\n5. CONFIDENT: Make smart assumptions when reasonable, confirm when critical\n\nDECISION FRAMEWORK:\n\nACKNOWLEDGE:\n- Use when: Greeting, unclear intent, or need to build rapport\n- Generate: Warm acknowledgment that sets expectations\n- Example: Customer says "Hello" or "Can you help me?"\n\nCLARIFY:\n- Use when: Missing CRITICAL information that blocks search\n- Generate: Smart questions that gather essential missing data\n- Example: Customer wants flight but no dates/destination\n- IMPORTANT: Only clarify what's truly necessary. Make smart assumptions for non-critical details.\n\nSEARCH:\n- Use when: Sufficient information to provide valuable options\n- Generate: Confidence-building message about search process\n- Strategy: Define which APIs to call, search parameters, ranking criteria\n- Example: Customer has destination + dates (even if other details are flexible)\n\nESCALATE:\n- Use when: Complex request requiring human expertise\n- Generate: Explanation of why human agent is better suited\n- Example: Multi-city complex itinerary, VIP customer, complaint\n\nRESPONSE GENERATION:\n- Always write in first person as the assistant\n- Be warm, professional, and reassuring\n- Show expertise and confidence\n- Set clear expectations for next steps\n- Match the customer's tone and urgency level`;

    const userPrompt = `Analyze this customer request and decide the optimal action:\n\nCUSTOMER PROFILE:\nName: ${profile.full_name || 'Guest'}\nEmail: ${profile.email || 'Unknown'}\nTimezone: ${profile.timezone || 'Unknown'}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nCURRENT REQUEST:\nIntent: ${request.intent}\nConfidence: ${request.confidence}\nRaw Text: ${request.raw_text}\nExtracted Entities: ${JSON.stringify(request.entities, null, 2)}\nMode: ${request.mode}\nStatus: ${request.status}\n\nCUSTOMER HISTORY:\n${customerHistory}\n\nANALYZE:\n1. What is the customer truly asking for?\n2. What information do we have vs. what's missing?\n3. Can we make smart assumptions for missing non-critical details?\n4. What's the customer's urgency level?\n5. Should we search immediately or clarify first?\n6. Are there opportunities to proactively suggest complementary services?\n\nDECIDE & GENERATE:\nProvide your decision with a natural, personalized message that:\n- Acknowledges what they've shared\n- Shows you understand their needs\n- Clearly communicates next steps\n- Builds confidence in the service\n\nRespond with JSON only:\n{\n  "action": "acknowledge|clarify|search|escalate",\n  "reasoning": "Detailed explanation of why you chose this action and your thought process",\n  "confidence": 0.95,\n  "message": "The actual message to send to the customer - warm, professional, personalized",\n  "next_steps": ["What will happen next", "Expected timeline"],\n  "search_strategy": {\n    "apis_to_call": ["duffel_flights", "amadeus_flights"],\n    "search_parameters": {\n      "origin": "JFK",\n      "destination": "LHR",\n      "dates": {"departure": "2025-11-01", "return": "2025-11-08"},\n      "cabin": "business",\n      "passengers": 2\n    },\n    "ranking_criteria": ["total_duration", "price", "departure_time", "carrier_reputation"]\n  },\n  "clarification_needed": {\n    "priority_fields": ["dates", "destination"],\n    "questions": ["When are you planning to travel?", "Where would you like to go?"],\n    "assumptions_to_confirm": ["Assuming you prefer nonstop flights"]\n  },\n  "metadata": {\n    "estimated_search_time_seconds": 15,\n    "suggested_budget_range": "$4000-$6000",\n    "opportunities": ["hotel", "car_rental"],\n    "tags": ["urgent", "business_travel", "premium"]\n  }\n}`;

    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
      })
    );

    const decision: OrchestratorDecision = JSON.parse(completion.choices[0].message.content || '{}');

    const { data: newMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        direction: 'out',
        sent_by: 'assistant',
        body: decision.message,
        request_id,
      })
      .select()
      .single();

    await supabase
      .from('requests')
      .update({
        status: decision.action === 'search' ? 'collecting' :
                decision.action === 'clarify' ? 'clarifying' :
                decision.action === 'escalate' ? 'awaiting_approval' : 'new',
        entities: {
          ...request.entities,
          orchestrator_decision: decision,
        },
      })
      .eq('id', request_id);

    await supabase
      .from('activities')
      .insert({
        request_id,
        conversation_id,
        action_type: 'orchestrator_decision',
        actor: 'system',
        details: {
          action: decision.action,
          reasoning: decision.reasoning,
          confidence: decision.confidence,
          metadata: decision.metadata,
        },
      });

    console.log('AI orchestrator decision completed:', {
      conversation_id,
      message_id: newMessage?.id,
      action: decision.action,
      confidence: decision.confidence
    });

    return new Response(
      JSON.stringify({
        success: true,
        decision,
        message_id: newMessage?.id,
        request_id,
        conversation_id,
        intent: request.intent,
        confidence: request.confidence,
        body: request.raw_text,
        id: request_id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI Orchestrator error:', error);
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