import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  userId: string;
  conversationId?: string;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  cabin_class: string;
  departure_time_preference?: string;
}

const flightSearchTool = {
  type: "function",
  function: {
    name: "search_flights",
    description: "Search for flight options when you have gathered enough information from the user. Use this when you have: origin, destination, date, number of passengers, and cabin class.",
    parameters: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "Origin airport code or city (e.g., 'NYC', 'JFK', 'New York')"
        },
        destination: {
          type: "string",
          description: "Destination airport code or city (e.g., 'MIA', 'Miami', 'London')"
        },
        date: {
          type: "string",
          description: "Travel date in YYYY-MM-DD format or natural language like 'December 14th'"
        },
        passengers: {
          type: "number",
          description: "Number of passengers (default: 1)"
        },
        cabin_class: {
          type: "string",
          enum: ["economy", "premium_economy", "business", "first"],
          description: "Cabin class preference"
        },
        departure_time_preference: {
          type: "string",
          enum: ["morning", "afternoon", "evening", "overnight", "any"],
          description: "Preferred departure time window (optional)"
        }
      },
      required: ["origin", "destination", "date", "passengers", "cabin_class"]
    }
  }
};

async function searchFlights(params: FlightSearchParams): Promise<any> {
  console.log('Searching flights with params:', params);

  const mockFlights = [
    {
      airline: "JetBlue",
      flight_number: "B6 1501",
      product: "Mint Business",
      departure_time: "07:00 AM",
      arrival_time: "10:15 AM",
      duration: "3h 15m",
      price: "$649",
      features: ["Lie-flat seats", "Premium dining", "Wi-Fi included"],
      rating: "Excellent"
    },
    {
      airline: "American Airlines",
      flight_number: "AA 1375",
      product: "Flagship Business",
      departure_time: "09:30 AM",
      arrival_time: "12:45 PM",
      duration: "3h 15m",
      price: "$589",
      features: ["Flagship lounge access", "Premium meals", "Priority boarding"],
      rating: "Very Good"
    },
    {
      airline: "Delta",
      flight_number: "DL 1437",
      product: "Delta One",
      departure_time: "11:00 AM",
      arrival_time: "02:20 PM",
      duration: "3h 20m",
      price: "$699",
      features: ["Delta Sky Club access", "Chef-curated meals", "Full lie-flat"],
      rating: "Excellent"
    },
    {
      airline: "Virgin Atlantic",
      flight_number: "VS 4",
      product: "Upper Class",
      departure_time: "08:30 PM",
      arrival_time: "08:10 AM+1",
      duration: "7h 40m",
      price: "$2,899",
      features: ["Bar onboard", "Premium lounge", "Chauffeur service"],
      rating: "Outstanding",
      overnight: true
    }
  ];

  const isOvernight = params.departure_time_preference === 'overnight';
  const relevantFlights = isOvernight
    ? mockFlights.filter(f => f.overnight)
    : mockFlights.filter(f => !f.overnight);

  return {
    results: relevantFlights,
    search_params: params,
    total_results: relevantFlights.length
  };
}

function formatFlightResults(searchResults: any): string {
  const { results, search_params } = searchResults;

  let response = `Great! I found ${results.length} excellent ${search_param.cabin_class.replace('_', ' ')} options for ${search_params.passengers} passenger${search_params.passengers > 1 ? 's' : ''} from ${search_params.origin} to ${search_params.destination}:\n\n`;

  results.forEach((flight: any, idx: number) => {
    response += `**Option ${idx + 1}: ${flight.airline} ${flight.flight_number}** (${flight.rating})\n`;
    response += `• ${flight.product} - ${flight.price}\n`;
    response += `• Departs: ${flight.departure_time} → Arrives: ${flight.arrival_time} (${flight.duration})\n`;
    response += `• Features: ${flight.features.join(', ')}\n\n`;
  });

  if (results.length > 0) {
    response += `All flights are non-stop and include premium amenities. Would you like me to proceed with booking one of these options, or would you like to see different times/airlines?`;
  }

  return response;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, userId, conversationId }: ChatRequest = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Message and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "Conversation ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Concierge chat request:', { userId, conversationId, messageLength: message.length });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      console.warn('OPENAI_API_KEY not configured, using fallback response');
      return new Response(
        JSON.stringify({
          response: "I'm ready to help! To enable full AI capabilities, please configure the OpenAI API key. For now, I can assist you with basic information.",
          metadata: {},
          isFallback: true,
          conversationId
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allMessages } = await supabase
      .from('concierge_messages')
      .select('content, role, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const chatMessages = (allMessages || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    chatMessages.push({ role: 'user', content: message });

    console.log('Calling OpenAI with function calling...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are Paige, an elite luxury travel concierge for Pier Members Club. You're proactive, knowledgeable, and deliver results.

YOUR APPROACH:
1. **Be immediately helpful** - Share insights about routes, airlines, pricing right away
2. **Make smart assumptions** - Default to 1 passenger if not specified, suggest non-stop flights
3. **Call search_flights WHEN READY** - Once you have origin, destination, date, passengers, and cabin class, use the search_flights function to get real options
4. **Present results professionally** - When you get flight results, format them clearly with all details

EXAMPLE FLOW:
User: "I need a flight from NYC to Miami December 14th"
You: "Great! Miami in December is perfect weather. That's a popular route with tons of options throughout the day - about 3 hours flight time. A few quick questions: How many passengers, and what cabin class are you thinking? (I can show you options across economy, premium economy, business, or first class)"

User: "Just me and business class, overnight flight"
You: [CALL search_flights with: {origin: "NYC", destination: "Miami", date: "2025-12-14", passengers: 1, cabin_class: "business", departure_time_preference: "overnight"}]
You: [Format and present the actual flight results you received]

CRITICAL RULES:
- Extract details from conversation history (don't re-ask)
- When user says "just me" = 1 passenger
- When user provides all required info, IMMEDIATELY call search_flights
- After calling search_flights, present the actual results to the user
- Never say you'll search without actually searching
- Be specific and helpful, not vague`
          },
          ...chatMessages
        ],
        tools: [flightSearchTool],
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const choice = openAIData.choices[0];

    let finalMessage = '';
    let flightResults = null;

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];

      if (toolCall.function.name === 'search_flights') {
        const searchParams = JSON.parse(toolCall.function.arguments);
        console.log('AI requested flight search:', searchParams);

        flightResults = await searchFlights(searchParams);

        const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              ...chatMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
              choice.message,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(flightResults)
              }
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        const followUpData = await followUpResponse.json();
        finalMessage = followUpData.choices[0].message.content;
      }
    } else {
      finalMessage = choice.message.content || "I'm processing your request...";
    }

    console.log('Saving conversation to database...');

    await supabase
      .from('concierge_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: finalMessage,
        metadata: {
          model: 'gpt-4o',
          tokens: openAIData.usage?.total_tokens || 0,
          used_function: flightResults ? 'search_flights' : null,
          flight_results: flightResults
        }
      });

    console.log('Successfully processed message');

    return new Response(
      JSON.stringify({
        response: finalMessage,
        metadata: {
          tokens: openAIData.usage?.total_tokens || 0,
          model: 'gpt-4o',
          flight_results: flightResults
        },
        isFallback: false,
        conversationId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in concierge-chat:", error);

    return new Response(
      JSON.stringify({
        response: "I apologize, but I encountered an issue. Let me try that again - what can I help you with?",
        metadata: {},
        isFallback: true,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
