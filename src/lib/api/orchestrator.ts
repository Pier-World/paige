import { supabase } from '../supabase';
import type { OrchestratorRequest, OrchestratorResponse } from '../../types/orchestrator';

export async function callOrchestrator(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const conversationId = request.conversationId || `conv_${Date.now()}`;

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        profile_id: profile.id,
        channel_type: 'portal',
        status: 'active'
      })
      .select()
      .single();

    if (convError && convError.code !== '23505') {
      console.error('Conversation creation error:', convError);
    }

    const { data: userMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'in',
        sent_by: 'user',
        body: request.input,
      })
      .select()
      .single();

    const { data: travelRequest } = await supabase
      .from('requests')
      .insert({
        profile_id: profile.id,
        conversation_id: conversationId,
        raw_text: request.input,
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
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-message`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: travelRequest.id,
          text: request.input
        }),
      }
    );

    if (!classifyResponse.ok) {
      console.error('Classification failed:', await classifyResponse.text());
    }

    const orchestratorResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

    return {
      conversationId,
      messages: [{
        role: 'assistant',
        text: result.decision?.message || "I'm processing your request...",
        modules: []
      }]
    };
  } catch (error) {
    console.error('Error calling orchestrator:', error);
    throw error;
  }
}
