import { supabase } from '../supabase';
import type { TravelIntent } from '../travelParser';
import type { TravelRequest, TravelMessage, TravelOffer } from '../../stores/travelStore';

export async function getOrCreateConversation(userId: string): Promise<string> {
  let profile = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile.data) {
    try {
      const newProfile = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .maybeSingle();
      profile = newProfile;
    } catch (error: any) {
      if (error?.code === '23505') {
        profile = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
      }
    }
  }

  if (!profile.data) {
    throw new Error('Failed to get profile');
  }

  let channel = await supabase
    .from('channels')
    .select('id')
    .eq('profile_id', profile.data.id)
    .eq('type', 'front')
    .maybeSingle();

  if (!channel.data) {
    const newChannel = await supabase
      .from('channels')
      .insert({
        profile_id: profile.data.id,
        type: 'front',
      })
      .select()
      .single();

    channel = newChannel;
  }

  if (!channel.data) {
    throw new Error('Failed to create channel');
  }

  const newConversation = await supabase
    .from('conversations')
    .insert({
      channel_id: channel.data.id,
    })
    .select()
    .single();

  if (!newConversation.data) {
    throw new Error('Failed to create conversation');
  }

  return newConversation.data.id;
}

export async function createMinimalRequest(
  userId: string,
  rawText: string
): Promise<TravelRequest> {
  let profile = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile.data) {
    try {
      const newProfile = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .maybeSingle();
      profile = newProfile;
    } catch (error: any) {
      if (error?.code === '23505') {
        profile = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
      }
    }
  }

  if (!profile.data) {
    throw new Error('Failed to get profile');
  }

  const { data, error } = await supabase
    .from('requests')
    .insert({
      profile_id: profile.data.id,
      intent: 'other',
      raw_text: rawText,
      entities: { types: [] },
      status: 'collecting',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating minimal request:', error);
    throw error;
  }

  return {
    id: data.id,
    profile_id: data.profile_id,
    intent: data.intent,
    raw_text: data.raw_text,
    entities: data.entities as TravelIntent,
    status: data.status,
    results: data.results || [],
    front_conversation_id: data.front_conversation_id,
    created_at: new Date(data.created_at),
  };
}

export async function createTravelRequest(
  userId: string,
  rawText: string,
  intent: TravelIntent
): Promise<TravelRequest> {
  let profile = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile.data) {
    try {
      const newProfile = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .maybeSingle();
      profile = newProfile;
    } catch (error: any) {
      if (error?.code === '23505') {
        profile = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
      }
    }
  }

  if (!profile.data) {
    throw new Error('Failed to get profile');
  }

  const intentType = intent.types[0] || 'other';

  const { data, error } = await supabase
    .from('requests')
    .insert({
      profile_id: profile.data.id,
      intent: intentType,
      raw_text: rawText,
      entities: intent,
      status: 'collecting',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating travel request:', error);
    throw error;
  }

  return {
    id: data.id,
    profile_id: data.profile_id,
    intent: data.intent,
    raw_text: data.raw_text,
    entities: data.entities as TravelIntent,
    status: data.status,
    results: data.results || [],
    front_conversation_id: data.front_conversation_id,
    created_at: new Date(data.created_at),
  };
}

export async function updateTravelRequest(
  requestId: string,
  updates: Partial<TravelRequest>
): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .update({
      ...(updates.entities && { entities: updates.entities }),
      ...(updates.status && { status: updates.status }),
      ...(updates.results && { results: updates.results }),
      ...(updates.front_conversation_id && { front_conversation_id: updates.front_conversation_id }),
    })
    .eq('id', requestId);

  if (error) {
    console.error('Error updating travel request:', error);
    throw error;
  }
}

export async function createMessage(
  conversationId: string,
  direction: 'in' | 'out',
  sentBy: 'user' | 'paige' | 'agent' | 'assistant',
  body: string,
  requestId?: string
): Promise<TravelMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction,
      sent_by: sentBy,
      body,
      request_id: requestId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw error;
  }

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    direction: data.direction,
    sent_by: data.sent_by,
    body: data.body,
    created_at: new Date(data.created_at),
  };
}

export async function getMessagesForConversation(
  conversationId: string
): Promise<TravelMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data.map((msg) => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    direction: msg.direction,
    sent_by: msg.sent_by,
    body: msg.body,
    created_at: new Date(msg.created_at),
  }));
}

export async function getLatestRequestForUser(userId: string): Promise<TravelRequest | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    profile_id: data.profile_id,
    intent: data.intent,
    raw_text: data.raw_text,
    entities: data.entities as TravelIntent,
    status: data.status,
    results: (data.results || []) as TravelOffer[],
    front_conversation_id: data.front_conversation_id,
    created_at: new Date(data.created_at),
  };
}

export function subscribeToRequestUpdates(
  requestId: string,
  onUpdate: (request: TravelRequest) => void
) {
  const channel = supabase
    .channel(`request:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        const data = payload.new;
        onUpdate({
          id: data.id,
          profile_id: data.profile_id,
          intent: data.intent,
          raw_text: data.raw_text,
          entities: data.entities as TravelIntent,
          status: data.status,
          results: (data.results || []) as TravelOffer[],
          front_conversation_id: data.front_conversation_id,
          created_at: new Date(data.created_at),
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToNewMessages(
  conversationId: string,
  onNewMessage: (message: TravelMessage) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const data = payload.new;
        onNewMessage({
          id: data.id,
          conversation_id: data.conversation_id,
          direction: data.direction,
          sent_by: data.sent_by,
          body: data.body,
          created_at: new Date(data.created_at),
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function searchWithOrchestrator(requestId: string, rawText: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('orchestrate-request', {
      body: {
        request_id: requestId,
        text: rawText,
        source: 'portal'
      }
    });

    if (error) {
      console.error('Orchestrator error:', error);
      await updateTravelRequest(requestId, {
        status: 'failed',
      });
      throw error;
    }

  } catch (error) {
    console.error('Error calling orchestrator:', error);
    await updateTravelRequest(requestId, {
      status: 'failed',
    });
    throw error;
  }
}

export async function syncConversationToFront(
  conversationId: string,
  profileId: string,
  initialMessage?: string
): Promise<string | null> {
  try {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('front_conversation_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversation?.front_conversation_id) {
      return conversation.front_conversation_id;
    }

    const { data, error } = await supabase.functions.invoke('front-inbound', {
      body: {
        conversation_id: conversationId,
        profile_id: profileId,
        initial_message: initialMessage,
        source: 'portal'
      }
    });

    if (error) {
      console.error('Front sync error:', error);
      return null;
    }

    if (data?.front_conversation_id) {
      await supabase
        .from('conversations')
        .update({ front_conversation_id: data.front_conversation_id })
        .eq('id', conversationId);

      return data.front_conversation_id;
    }

    return null;
  } catch (error) {
    console.error('Error syncing to Front:', error);
    return null;
  }
}

export async function requestHumanAgent(requestId: string): Promise<void> {
  try {
    await updateTravelRequest(requestId, {
      status: 'awaiting_approval',
    });

    await supabase
      .from('requests')
      .update({ mode: 'human' })
      .eq('id', requestId);

    const { error } = await supabase.functions.invoke('front-approval', {
      body: {
        request_id: requestId,
        escalate: true
      }
    });

    if (error) {
      console.error('Front approval error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error requesting human agent:', error);
    throw error;
  }
}