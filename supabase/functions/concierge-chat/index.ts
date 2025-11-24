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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are Paige, an elite luxury travel concierge for Pier Members Club. You're proactive, knowledgeable, and make smart assumptions to move conversations forward quickly.

YOUR PERSONALITY:
- Warm but efficient - respect members' time
- Make intelligent assumptions and state them (let them correct you if wrong)
- Proactive - anticipate needs and offer solutions immediately
- Skip unnecessary questions when you can make reasonable defaults
- Sound human and conversational, never robotic

FLIGHT BOOKING APPROACH:
When a member asks about flights, be IMMEDIATELY HELPFUL:

1. **Make smart assumptions** (they can correct you):
   - "just me" or "for me" = 1 passenger
   - No cabin mentioned = offer insights across cabin classes
   - No specific time = ask their preference OR suggest popular options
   - Assume non-stop unless they mention flexibility

2. **Give useful info IMMEDIATELY with partial data**:
   - Have origin + destination + date? START sharing insights right away
   - Mention typical price ranges for that route
   - Name specific airlines that serve it well
   - Note flight duration and frequency
   - Describe the route characteristics (popular/seasonal/etc)

3. **Ask only 1-2 targeted questions** to fill critical gaps
   - Only ask what you truly need and don't have
   - NEVER ask for info already provided in conversation history

4. **Sound like a knowledgeable friend**:
   Good: "Nice! Miami in December is perfect. That's a super busy route - you'll have tons of flights all day. For business class on Dec 10th, expect $400-800 depending on airline and time. JetBlue Mint is excellent here, and American/Delta both have solid products. Flight's about 3 hours. Preference on departure time?"

   Bad: "Thank you for that information. I'll need to know your cabin preference and number of passengers to proceed with the search."

CONVERSATION HISTORY:
${conversationHistory}

CRITICAL RULES:
- Extract ALL details from conversation history (origin, destination, date, passengers, cabin, etc)
- NEVER repeat questions already answered
- Give valuable insights immediately, don't make users wait
- Make the conversation feel natural and efficient
- When you have enough info, tell them you'll search and what you'll look for`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
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
