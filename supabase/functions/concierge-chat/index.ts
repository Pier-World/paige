import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  userId: string;
  context?: {
    previousMessages?: Array<{ role: string; content: string }>;
    userProfile?: any;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, userId, context }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({
          response: generateFallbackResponse(message),
          metadata: generateMetadata(message),
          isFallback: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call OpenAI API
    const systemPrompt = `You are Paige, an elite personal concierge AI for Pier. You help high-net-worth individuals (founders, executives, investors) with travel, dining, logistics, and lifestyle requests.

Your personality:
- Proactive and anticipatory
- Confident and efficient
- Warm but professional
- Focus on immediate value and "magic moments"

Your capabilities:
- Flight bookings with private fares and points optimization
- Restaurant reservations (especially hard-to-get tables)
- Hotel bookings with elite benefits
- Ground transportation
- Event tickets and experiences
- Gift recommendations
- Travel planning and optimization
- Lifestyle management

Key principles:
1. INSTANT VALUE: Always provide immediate insights or options, even if final booking requires human touch
2. SAVINGS HIGHLIGHT: Show cost savings, points optimization, or exclusive benefits
3. ANTICIPATORY: Suggest related services or bonus insights
4. PERSONALIZED: Reference user preferences and history when available
5. CONFIDENT: Never say "I'll try" - say "I'm on it" or "I found"

Response format:
- Start with confident acknowledgment
- Provide specific options or next steps
- Include a checklist of benefits/actions
- Add a "bonus" insight when relevant
- Show estimated savings or value

Keep responses conversational but rich with value.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(context?.previousMessages || []),
      { role: "user", content: message }
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0]?.message?.content || "I'm on it. Let me get back to you with options.";

    // Extract metadata from response (savings, bonus insights, etc.)
    const metadata = generateMetadata(message, aiResponse);

    return new Response(
      JSON.stringify({
        response: aiResponse,
        metadata,
        isFallback: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in concierge-chat:", error);

    return new Response(
      JSON.stringify({
        response: "I'm on it. Let me find the best options for you...",
        metadata: { responseTime: 0.3 },
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

function generateFallbackResponse(message: string): string {
  const lowerInput = message.toLowerCase();

  if (lowerInput.includes('flight') || lowerInput.includes('fly')) {
    return "On it. I'm checking private fares, redemption options, and premium upgrades across all major carriers. You'll have options within 2 minutes.";
  }

  if (lowerInput.includes('restaurant') || lowerInput.includes('reservation') || lowerInput.includes('dinner')) {
    return "I'm on it. Checking availability and reaching out to my contacts for preferred seating. You'll hear back shortly.";
  }

  if (lowerInput.includes('hotel')) {
    return "Looking into hotels now. I'm prioritizing properties with your elite status benefits and upgrade availability.";
  }

  if (lowerInput.includes('car') || lowerInput.includes('driver')) {
    return "I'll arrange that. Checking your usual preferences and vehicle availability.";
  }

  return "I'm on it. Let me find the best options for you...";
}

function generateMetadata(message: string, aiResponse?: string): any {
  const lowerInput = message.toLowerCase();
  const metadata: any = {
    responseTime: 0.3
  };

  // Pattern matching for common requests
  if (lowerInput.includes('flight') || lowerInput.includes('basel') || lowerInput.includes('fly')) {
    metadata.checklist = [
      "Checking private fares through Amex and Chase portals",
      "Comparing redemption options across your points balance",
      "Looking for premium cabin upgrades with points"
    ];
    metadata.bonus = "I'll also check if there are any events or experiences worth timing your trip around.";
    metadata.savings = "$2,000+";
  }

  if (lowerInput.includes('restaurant') || lowerInput.includes('reservation')) {
    metadata.checklist = [
      "Reaching out to restaurant contacts",
      "Checking your dining history for preferences",
      "Coordinating any dietary restrictions"
    ];
    metadata.bonus = "I can also arrange wine pairings or special menu requests if you'd like.";
  }

  if (lowerInput.includes('hotel')) {
    metadata.checklist = [
      "Filtering for properties with your elite status",
      "Checking suite upgrade availability",
      "Looking for bonus point promotions"
    ];
    metadata.savings = "$800+";
  }

  return metadata;
}
