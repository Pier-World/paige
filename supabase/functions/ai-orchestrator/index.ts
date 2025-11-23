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
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const isRateLimitError = error?.status === 429 ||
                               error?.error?.type === 'rate_limit_exceeded' ||
                               error?.message?.includes('rate limit');

      if (isRateLimitError && attempt < maxRetries) {
        const jitter = Math.random() * 1000;
        const delay = (initialDelay * Math.pow(2, attempt)) + jitter;
        console.log(`Rate limited. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (attempt < maxRetries && !isRateLimitError) {
        const delay = 500 * (attempt + 1);
        console.log(`Request failed. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
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
      .from('concierge_messages')
      .select('content, role, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = messages?.map(m =>
      `[${m.created_at}] ${m.role === 'user' ? 'Customer' : 'Paige'}: ${m.content}`
    ).join('\n') || '';

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

    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('profile_id', profile_id)
      .maybeSingle();

    const { data: pastRequests } = await supabase
      .from('requests')
      .select('intent, entities, status, created_at, raw_text')
      .eq('profile_id', profile_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const customerHistory = pastRequests?.map(r => 
      `${r.intent} request (${r.status}) - ${JSON.stringify(r.entities)}`
    ).join('\n') || 'No previous requests';

    const todayDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const systemPrompt = `You are an elite AI orchestrator for a luxury travel concierge service. Your role is to analyze customer requests with deep reasoning and decide the optimal next action.

CURRENT DATE: ${todayDate}
CURRENT YEAR: ${currentYear}

KNOWLEDGE BASE - Major Events:
- Art Basel Miami Beach 2025: December 5-7, 2025 (VIP Preview: December 4)
  Location: Miami Beach Convention Center
  Note: Art Week runs Nov 30 - Dec 7 with satellite fairs and events
- Art Basel Hong Kong 2025: March 27-29, 2025
- Art Basel Basel 2025: June 12-15, 2025

You have access to:
- Real-time flight APIs (Duffel, Amadeus)
- Hotel booking APIs (Mondee, Booking.com)
- Experience providers (Viator, GetYourGuide)
- Restaurant reservations (OpenTable, Resy)
- Customer preferences and history

Your decisions should be:
1. INTELLIGENT: Consider context, urgency, and customer preferences
2. EFFICIENT: Minimize back-and-forth while ensuring quality
3. PERSONALIZED: Use customer history to inform recommendations
4. PROACTIVE: Suggest related services when appropriate
5. CONFIDENT: Make smart assumptions when reasonable, confirm when critical
6. KNOWLEDGEABLE: Use your knowledge base to provide specific dates and details

DECISION FRAMEWORK:

ACKNOWLEDGE:
- Use when: Greeting, unclear intent, or need to build rapport
- Generate: Warm acknowledgment that sets expectations
- Example: Customer says \"Hello\" or \"Can you help me?\"

CLARIFY:
- Use when: Missing CRITICAL information that blocks search OR when you want to personalize the experience
- Generate: Conversational, friendly questions that gather information organically
- Ask 2-3 questions at a time to maintain natural flow
- Examples:
  * "Do you prefer nonstop flights or best-value fares?"
  * "Any preferred airlines or cabin class?"
  * "What's your hotel style - boutique, resort, or city stay?"
- IMPORTANT: Always acknowledge what they've already told you, then ask for what's needed
- When you know event dates from your knowledge base, USE THEM and suggest them proactively
- Guide the conversation through: Flights → Hotels → Dining → Experiences → Confirmation

SEARCH:
- Use when: Sufficient information to provide valuable options
- Generate: Confidence-building message about search process
- Strategy: Define which APIs to call, search parameters, ranking criteria
- Example: Customer has destination + dates (even if other details are flexible)

ESCALATE:
- Use when: Complex request requiring human expertise
- Generate: Explanation of why human agent is better suited
- Example: Multi-city complex itinerary, VIP customer, complaint

RESPONSE GENERATION:
- Always write in first person as the assistant
- Be warm, professional, and reassuring
- Show expertise and confidence
- Set clear expectations for next steps
- Match the customer's tone and urgency level
- When referencing events, provide SPECIFIC dates from your knowledge base
- Suggest optimal travel dates based on event schedules`;

    const userPrompt = `Analyze this customer request and decide the optimal action:

CUSTOMER PROFILE:
Name: ${profile.full_name || 'Guest'}
Email: ${profile.email || 'Unknown'}
Timezone: ${profile.timezone || 'Unknown'}

USER PREFERENCES:
${userPreferences ? JSON.stringify(userPreferences, null, 2) : 'No preferences set yet - learn as you go'}

CONVERSATION HISTORY:
${conversationHistory}

CURRENT REQUEST:
Intent: ${request.intent}
Confidence: ${request.confidence}
Raw Text: ${request.raw_text}
Extracted Entities: ${JSON.stringify(request.entities, null, 2)}
Mode: ${request.mode}
Status: ${request.status}

CUSTOMER HISTORY:
${customerHistory}

ANALYZE:
1. What is the customer truly asking for?
2. What information do we have vs. what's missing?
3. Can we make smart assumptions for missing non-critical details?
4. Does this relate to any known events in the knowledge base? If so, provide specific dates.
5. What's the customer's urgency level?
6. Should we search immediately or clarify first?
7. Are there opportunities to proactively suggest complementary services?

DECIDE & GENERATE:
Provide your decision with a natural, personalized message that:
- Acknowledges what they've shared
- Shows you understand their needs
- Provides specific dates when relevant (especially for events like Art Basel)
- Clearly communicates next steps
- Builds confidence in the service

Respond with JSON only:
{
  \"action\": \"acknowledge|clarify|search|escalate\",
  \"reasoning\": \"Detailed explanation of why you chose this action and your thought process\",
  \"confidence\": 0.95,
  \"message\": \"The actual message to send to the customer - warm, professional, personalized, with specific dates when relevant\",
  \"next_steps\": [\"What will happen next\", \"Expected timeline\"],
  \"search_strategy\": {
    \"apis_to_call\": [\"duffel_flights\", \"amadeus_flights\"],
    \"search_parameters\": {
      \"origin\": \"JFK\",
      \"destination\": \"MIA\",
      \"dates\": {\"departure\": \"2025-12-04\", \"return\": \"2025-12-08\"},
      \"cabin\": \"business\",
      \"passengers\": 1
    },
    \"ranking_criteria\": [\"total_duration\", \"price\", \"departure_time\", \"carrier_reputation\"]
  },
  \"clarification_needed\": {
    \"priority_fields\": [\"origin\"],
    \"questions\": [\"Where will you be departing from?\"],
    \"assumptions_to_confirm\": [\"I'm suggesting arrival on December 4th for VIP Preview access and departure on December 8th\"]
  },
  \"metadata\": {
    \"estimated_search_time_seconds\": 15,
    \"suggested_budget_range\": \"$2000-$4000\",
    \"opportunities\": [\"hotel\", \"art_week_experiences\"],
    \"tags\": [\"art_basel\", \"vip_preview\", \"premium\"]
  }
}`;

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