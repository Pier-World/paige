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
    const { message, userId, conversationId, context }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      console.error('Profile not found for user:', userId);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Creating travel request');

    const { data: travelRequest, error: requestError } = await supabase
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

    if (requestError || !travelRequest) {
      console.error('Failed to create request:', requestError);
      throw new Error(`Failed to create request: ${requestError?.message}`);
    }

    console.log('Travel request created:', travelRequest.id);
    console.log('Calling classify-message');

    try {
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
        const errorText = await classifyResponse.text();
        console.error('Classification failed:', classifyResponse.status, errorText);
      } else {
        console.log('Classification successful');
      }
    } catch (error) {
      console.error('Classification error (non-fatal):', error);
    }

    console.log('Calling ai-orchestrator');

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
      const errorText = await orchestratorResponse.text();
      console.error('Orchestrator failed:', orchestratorResponse.status, errorText);
      throw new Error(`Orchestrator failed: ${orchestratorResponse.status} - ${errorText}`);
    }

    const result = await orchestratorResponse.json();
    console.log('Orchestrator response received:', result.decision?.action);

    return new Response(
      JSON.stringify({
        response: result.decision?.message || "I'm processing your request...",
        metadata: result.decision?.metadata || {},
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

