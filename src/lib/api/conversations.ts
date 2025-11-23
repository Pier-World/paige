import { supabase } from '../supabase';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: any;
  created_at: string;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('concierge_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('concierge_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data || [];
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('concierge_conversations')
    .insert({
      user_id: userId,
      title: title
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return data;
}

export async function createMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
): Promise<Message> {
  const { data, error } = await supabase
    .from('concierge_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw error;
  }

  return data;
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('concierge_conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('concierge_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

export function generateConversationTitle(message: string): string {
  const cleaned = message.trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + '...';
}
