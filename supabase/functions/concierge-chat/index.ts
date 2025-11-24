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

    const { data: conversation } = await supabase
      .from('concierge_conversations')
      .select('openai_thread_id')
      .eq('id', conversationId)
      .maybeSingle();

    const { data: allMessages } = await supabase
      .from('concierge_messages')
      .select('content, role, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const conversationHistory = (allMessages || [])
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    console.log('Calling OpenAI with conversation history...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Paige, a professional luxury travel concierge for Pier Members Club. You're warm, knowledgeable, and efficient.

Your role:
- Help members book flights, hotels, restaurants, and experiences
- Ask clarifying questions to gather complete trip details
- Be conversational and remember what the user has already told you
- Once you have all details, confirm and let them know you'll search for options

For flight bookings, you need:
1. Origin airport/city
2. Destination airport/city
3. Travel dates
4. Number of passengers
5. Cabin class (economy, premium economy, business, first)

CRITICAL RULES:
- NEVER ask for information the user has already provided
- Review the conversation history carefully before asking questions
- When the user answers "1 and premium economy", understand this means 1 passenger + premium economy cabin
- When the user says "just me" or "for me", this means 1 passenger
- Be natural and conversational, not robotic
- Keep responses concise (2-3 sentences max)

Current conversation history:
${conversationHistory}

Latest user message: ${message}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiMessage = openAIData.choices[0]?.message?.content || "I'm processing your request...";

    console.log('OpenAI response received, saving to database...');

    await supabase
      .from('concierge_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiMessage,
        metadata: {
          model: 'gpt-4o-mini',
          tokens: openAIData.usage?.total_tokens || 0
        }
      });

    await supabase
      .from('requests')
      .insert({
        profile_id: userId,
        conversation_id: conversationId,
        raw_text: message,
        intent: 'flight',
        confidence: 0.8,
        status: 'new',
        mode: 'assisted',
        entities: {
          ai_response: aiMessage,
          conversation_context: true
        }
      });

    console.log('Successfully processed message and saved response');

    return new Response(
      JSON.stringify({
        response: aiMessage,
        metadata: {
          tokens: openAIData.usage?.total_tokens || 0,
          model: 'gpt-4o-mini'
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
