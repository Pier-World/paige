/**
 * Intercom API Client
 * Functions to interact with Intercom API for sending messages, assigning conversations, etc.
 */

const INTERCOM_ACCESS_TOKEN = import.meta.env.VITE_INTERCOM_ACCESS_TOKEN || '';
const INTERCOM_API_VERSION = '2.11';

/**
 * Send a reply to an Intercom conversation
 */
export async function sendIntercomReply(
  conversationId: string,
  message: string
): Promise<any> {
  const response = await fetch(
    `https://api.intercom.io/conversations/${conversationId}/parts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': INTERCOM_API_VERSION,
      },
      body: JSON.stringify({
        message_type: 'comment',
        type: 'admin',
        body: message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Intercom API error:', error);
    throw new Error(`Failed to send reply: ${response.status}`);
  }

  return response.json();
}

/**
 * Assign a conversation to a human team member
 */
export async function assignConversation(
  conversationId: string,
  adminId: string
): Promise<any> {
  const response = await fetch(
    `https://api.intercom.io/conversations/${conversationId}/parts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': INTERCOM_API_VERSION,
      },
      body: JSON.stringify({
        message_type: 'assignment',
        type: 'admin',
        admin_id: adminId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to assign conversation:', error);
    throw new Error(`Failed to assign: ${response.status}`);
  }

  return response.json();
}

/**
 * Close an Intercom conversation
 */
export async function closeConversation(conversationId: string): Promise<any> {
  const response = await fetch(
    `https://api.intercom.io/conversations/${conversationId}/parts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': INTERCOM_API_VERSION,
      },
      body: JSON.stringify({
        message_type: 'close',
        type: 'admin',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to close conversation:', error);
    throw new Error(`Failed to close: ${response.status}`);
  }

  return response.json();
}

/**
 * Sync user to Intercom (create or update contact)
 */
export async function syncUserToIntercom(userId: string, userData: {
  email?: string;
  name?: string;
  phone?: string;
  membership_level?: string;
}): Promise<string | null> {
  if (!INTERCOM_ACCESS_TOKEN) {
    console.warn('⚠️ INTERCOM_ACCESS_TOKEN not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.intercom.io/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': INTERCOM_API_VERSION,
      },
      body: JSON.stringify({
        external_id: userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        custom_attributes: {
          membership_level: userData.membership_level || 'Standard',
          user_type: 'member',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to sync user to Intercom:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ User synced to Intercom:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error syncing user to Intercom:', error);
    return null;
  }
}

