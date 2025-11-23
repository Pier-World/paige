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

function extractEntitiesFromText(text: string): Record<string, any> {
  const lower = text.toLowerCase();
  const entities: Record<string, any> = {};

  const cityPatterns = [
    { pattern: /(?:from|depart(?:ing)?\s+from)\s+([a-z\s]+?)(?:\s+to|\s+on|\s+in|$)/i, key: 'origin' },
    { pattern: /(?:to|going\s+to|flying\s+to)\s+([a-z\s]+?)(?:\s+on|\s+in|$)/i, key: 'destination' },
  ];

  for (const { pattern, key } of cityPatterns) {
    const match = text.match(pattern);
    if (match) {
      entities[key] = match[1].trim();
    }
  }

  const datePattern = /(?:on|for)\s+([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i;
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    entities.date = dateMatch[1].trim();
  }

  if (lower.includes('business') || lower.includes('first class')) {
    entities.cabin = lower.includes('first') ? 'first' : 'business';
  }

  const passengerMatch = text.match(/(\d+)\s+(?:passenger|person|people|traveler)/i);
  if (passengerMatch) {
    entities.passengers = parseInt(passengerMatch[1]);
  }

  return entities;
}

function makeDecision(request: any, messages: any[], profile: any, messageCount: number): OrchestratorDecision {
  const rawText = request.raw_text || '';
  const intent = request.intent || 'other';
  const entities = extractEntitiesFromText(rawText);

  const hasOrigin = entities.origin || request.entities?.origin;
  const hasDestination = entities.destination || request.entities?.destination;
  const hasDate = entities.date || request.entities?.date;
  const hasCabin = entities.cabin || request.entities?.cabin;
  const hasPassengers = entities.passengers || request.entities?.passengers;

  if (intent === 'flight' || rawText.toLowerCase().includes('flight') || rawText.toLowerCase().includes('fly')) {
    if (messageCount === 1) {
      const questions = [];
      if (!hasOrigin) questions.push("Which airport will you be departing from?");
      if (!hasPassengers) questions.push("Is this just for you, or will others be joining?");
      if (!hasCabin) questions.push("What's your cabin preference for this trip?");

      if (questions.length === 0) {
        questions.push("Do you prefer nonstop flights or are you flexible?");
        questions.push("Any preferred airlines?");
      }

      const tripDetails = [];
      if (hasOrigin) tripDetails.push(`from ${hasOrigin}`);
      if (hasDestination) tripDetails.push(`to ${hasDestination}`);
      if (hasDate) tripDetails.push(`on ${hasDate}`);

      const acknowledgment = tripDetails.length > 0
        ? `Perfect! I can help you find flights ${tripDetails.join(' ')}. `
        : `I'd be happy to help you with your flight! `;

      return {
        action: 'clarify',
        reasoning: 'First message in flight conversation - need to gather essential details',
        confidence: 0.95,
        message: acknowledgment + questions.join(' '),
        next_steps: ['Gather passenger count, cabin preference, and airport details', 'Search for flight options'],
        clarification_needed: {
          priority_fields: ['passengers', 'cabin', 'origin'],
          questions,
          assumptions_to_confirm: []
        },
        metadata: {
          conversation_stage: 'initial_clarification',
          missing_fields: ['passengers', 'cabin', 'origin'].filter(f => !entities[f])
        }
      };
    }

    if (hasOrigin && hasDestination && hasDate && hasCabin && hasPassengers) {
      return {
        action: 'search',
        reasoning: 'All essential flight information collected',
        confidence: 0.9,
        message: `Perfect! Let me search for ${hasCabin} class flights from ${hasOrigin} to ${hasDestination} for ${hasPassengers} passenger${hasPassengers > 1 ? 's' : ''} on ${hasDate}. I'll have the best options for you shortly.`,
        next_steps: ['Search Duffel API', 'Search Amadeus API', 'Present curated options'],
        search_strategy: {
          apis_to_call: ['duffel_flights', 'amadeus_flights'],
          search_parameters: {
            origin: hasOrigin,
            destination: hasDestination,
            date: hasDate,
            cabin: hasCabin,
            passengers: hasPassengers
          },
          ranking_criteria: ['total_duration', 'price', 'departure_time']
        },
        metadata: {
          conversation_stage: 'searching',
          search_type: 'flights'
        }
      };
    }

    const stillMissing = [];
    if (!hasOrigin) stillMissing.push('departure airport');
    if (!hasPassengers) stillMissing.push('number of passengers');
    if (!hasCabin) stillMissing.push('cabin preference');

    return {
      action: 'clarify',
      reasoning: `Still missing: ${stillMissing.join(', ')}`,
      confidence: 0.85,
      message: `Thanks for that! Just a few more details: ${stillMissing.map((item, i) =>
        i === 0 ? `What's your ${item}?` : `And your ${item}?`
      ).join(' ')}`,
      next_steps: ['Complete information gathering', 'Search for flights'],
      clarification_needed: {
        priority_fields: stillMissing,
        questions: stillMissing.map(item => `What's your ${item}?`),
        assumptions_to_confirm: []
      },
      metadata: {
        conversation_stage: 'gathering_details',
        missing_fields: stillMissing
      }
    };
  }

  return {
    action: 'acknowledge',
    reasoning: 'General inquiry or unclear intent',
    confidence: 0.7,
    message: `I'd be happy to help! I specialize in arranging flights, hotels, restaurant reservations, and experiences. What would you like me to help you with today?`,
    next_steps: ['Wait for customer to specify their needs'],
    metadata: {
      conversation_stage: 'initial_greeting'
    }
  };
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { request_id, conversation_id }: OrchestratorRequest = await req.json();

    console.log('Orchestrator processing:', { request_id, conversation_id });

    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', request_id)
      .maybeSingle();

    if (requestError || !request) {
      throw new Error(`Request not found: ${request_id}`);
    }

    const { data: messages } = await supabase
      .from('concierge_messages')
      .select('content, role, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    const messageCount = messages?.filter(m => m.role === 'user').length || 1;

    const { data: conversation } = await supabase
      .from('concierge_conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .maybeSingle();

    const profile_id = conversation?.user_id || request.profile_id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .maybeSingle();

    console.log('Making decision with:', { messageCount, intent: request.intent });

    const decision = makeDecision(request, messages || [], profile, messageCount);

    console.log('Decision made:', decision.action);

    const { data: newMessage } = await supabase
      .from('concierge_messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: decision.message,
        metadata: decision.metadata || {}
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

    console.log('Orchestrator completed:', {
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
