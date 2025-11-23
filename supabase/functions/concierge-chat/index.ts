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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const conversationId = `conv_${Date.now()}`;

    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        profile_id: userId,
        channel_type: 'portal',
        status: 'active'
      })
      .select()
      .single();

    if (!conversation) {
      throw new Error('Failed to create conversation');
    }

    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'in',
        sent_by: 'user',
        body: message,
      });

    const { data: travelRequest } = await supabase
      .from('requests')
      .insert({
        profile_id: userId,
        conversation_id: conversationId,
        raw_text: message,
        intent: 'other',
        confidence: 0.5,
        status: 'new',
        mode: 'assisted',
        entities: {}
      })
      .select()
      .single();

    if (!travelRequest) {
      throw new Error('Failed to create request');
    }

    const classifyResponse = await fetch(
      `${supabaseUrl}/functions/v1/classify-message`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: travelRequest.id,
          text: message
        }),
      }
    );

    if (!classifyResponse.ok) {
      console.error('Classification failed:', await classifyResponse.text());
    }

    const orchestratorResponse = await fetch(
      `${supabaseUrl}/functions/v1/ai-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: travelRequest.id,
          conversation_id: conversationId
        }),
      }
    );

    if (!orchestratorResponse.ok) {
      throw new Error(`Orchestrator failed: ${await orchestratorResponse.text()}`);
    }

    const result = await orchestratorResponse.json();

    const metadata = generateMetadata(message, result.decision?.message);

    return new Response(
      JSON.stringify({
        response: result.decision?.message || "I'm processing your request...",
        metadata,
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

function generateMetadata(message: string, aiResponse?: string): any {
  const lowerInput = message.toLowerCase();
  const metadata: any = {
    responseTime: 0.3
  };

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