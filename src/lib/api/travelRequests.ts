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

  let conversation = await supabase
    .from('conversations')
    .select('id')
    .eq('channel_id', channel.data.id)
    .maybeSingle();

  if (!conversation.data) {
    const newConversation = await supabase
      .from('conversations')
      .insert({
        channel_id: channel.data.id,
      })
      .select()
      .single();

    conversation = newConversation;
  }

  if (!conversation.data) {
    throw new Error('Failed to create conversation');
  }

  return conversation.data.id;
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

export async function generateMockResults(requestId: string, intent: TravelIntent): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 3000));

  const mockResults: TravelOffer[] = [];

  if (intent.flight) {
    mockResults.push({
      id: `flight-1-${Date.now()}`,
      supplier_type: 'air',
      summary: `${intent.flight.from || 'NYC'} → ${intent.flight.to || 'LAX'} - ${intent.flight.cabin || 'Business'} Class`,
      terms: {
        description: 'Nonstop flight with premium amenities',
        dates: intent.flight.depart || 'TBD',
        highlights: [
          'Lie-flat seats',
          'Priority boarding',
          'Lounge access',
        ],
        per: 'per person',
      },
      price_cents: 289900,
      currency: 'USD',
      rank: 1,
      selected: false,
      image_url: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=800',
    });

    mockResults.push({
      id: `flight-2-${Date.now()}`,
      supplier_type: 'air',
      summary: `${intent.flight.from || 'NYC'} → ${intent.flight.to || 'LAX'} - Premium Economy`,
      terms: {
        description: 'Comfortable seating with extra legroom',
        dates: intent.flight.depart || 'TBD',
        highlights: [
          'Extra legroom',
          'Priority check-in',
          'Complimentary meal',
        ],
        per: 'per person',
      },
      price_cents: 129900,
      currency: 'USD',
      rank: 2,
      selected: false,
      image_url: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=800',
    });
  }

  if (intent.hotel) {
    mockResults.push({
      id: `hotel-1-${Date.now()}`,
      supplier_type: 'hotel',
      summary: `${intent.hotel.brand_prefs?.[0] || 'Luxury Hotel'} - ${intent.hotel.city || 'Downtown'}`,
      terms: {
        description: '5-star luxury accommodation with spa',
        dates: `${intent.hotel.check_in || 'TBD'} - ${intent.hotel.check_out || 'TBD'}`,
        highlights: [
          'Spa & wellness center',
          'Michelin-star restaurant',
          'Rooftop pool',
        ],
        per: 'per night',
      },
      price_cents: 75000,
      currency: 'USD',
      rank: 1,
      selected: false,
      image_url: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
    });

    mockResults.push({
      id: `hotel-2-${Date.now()}`,
      supplier_type: 'hotel',
      summary: `Boutique Hotel - ${intent.hotel.city || 'City Center'}`,
      terms: {
        description: 'Charming boutique property',
        dates: `${intent.hotel.check_in || 'TBD'} - ${intent.hotel.check_out || 'TBD'}`,
        highlights: [
          'Complimentary breakfast',
          'Concierge service',
          'Central location',
        ],
        per: 'per night',
      },
      price_cents: 45000,
      currency: 'USD',
      rank: 2,
      selected: false,
      image_url: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800',
    });
  }

  await updateTravelRequest(requestId, {
    results: mockResults,
    status: 'offered',
  });
}