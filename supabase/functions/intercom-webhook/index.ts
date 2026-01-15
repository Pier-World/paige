/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hub-Signature-256',
};

// Intercom API configuration
const INTERCOM_ACCESS_TOKEN = Deno.env.get('INTERCOM_ACCESS_TOKEN') || '';
const INTERCOM_WEBHOOK_SECRET = Deno.env.get('INTERCOM_WEBHOOK_SECRET')?.trim() || '';
const INTERCOM_DEFAULT_ASSIGNEE_ID = Deno.env.get('INTERCOM_DEFAULT_ASSIGNEE_ID') || '';

// Bot/Admin IDs - used to detect when we should NOT respond
const PIER_BOT_ADMIN_ID = '9666521'; // Pier Concierge (our AI)
const FIN_BOT_ID = '9649226'; // Fin (Intercom's bot)

/**
 * Verify webhook signature from Intercom
 * Supports both SHA1 (X-Hub-Signature) and SHA256 (X-Hub-Signature-256)
 */
async function verifyWebhookSignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature || !INTERCOM_WEBHOOK_SECRET) {
    console.warn('⚠️ Missing signature or secret');
    return false;
  }

  try {
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();
    const key = encoder.encode(INTERCOM_WEBHOOK_SECRET);
    const data = encoder.encode(body);

    // Detect signature algorithm from prefix (sha1= or sha256=)
    const isSHA1 = signature.startsWith('sha1=');
    const isSHA256 = signature.startsWith('sha256=');
    
    if (!isSHA1 && !isSHA256) {
      console.warn('⚠️ Unknown signature format:', signature.substring(0, 20));
      return false;
    }

    const algorithm = isSHA1 ? 'SHA-1' : 'SHA-256';
    const expectedPrefix = isSHA1 ? 'sha1=' : 'sha256=';

    console.log('🔐 Verifying signature with algorithm:', algorithm);

    // Use Web Crypto API for HMAC
    const importedKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', importedKey, data);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const expectedSignature = `${expectedPrefix}${hashHex}`;
    
    // Log for debugging (first 30 chars only)
    console.log('🔐 Signature check:', {
      received: signature.substring(0, 30) + '...',
      expected: expectedSignature.substring(0, 30) + '...',
      algorithm,
      length_match: signature.length === expectedSignature.length,
    });
    
    // Use timing-safe comparison
    if (signature.length !== expectedSignature.length) {
      console.warn('⚠️ Signature length mismatch', {
        received_length: signature.length,
        expected_length: expectedSignature.length,
      });
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    const isValid = result === 0;
    if (!isValid) {
      console.warn('⚠️ Signature mismatch');
    } else {
      console.log('✅ Signature verified successfully');
    }
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Generate contextually aware acknowledgment message
 */
function generateAcknowledgmentMessage(
  message: string, 
  profile: any, 
  conversationHistory: any[]
): string {
  const category = message.toLowerCase().includes('hotel') ? 'hotel' :
                   message.toLowerCase().includes('flight') ? 'flight' :
                   message.toLowerCase().includes('restaurant') ? 'dining' :
                   'travel';
  
  const name = profile?.full_name?.split(' ')[0] || '';
  
  // Check if this is the first message in the conversation (no previous assistant messages)
  const isFirstMessage = conversationHistory.filter((msg: any) => msg.sent_by === 'assistant').length === 0;
  
  // Check if we've already sent an acknowledgment in recent messages
  const recentAcknowledgment = conversationHistory
    .slice(-5)
    .some((msg: any) => 
      msg.sent_by === 'assistant' && 
      (msg.body?.toLowerCase().includes('we\'re on it') || 
       msg.body?.toLowerCase().includes('recs inbound') ||
       msg.body?.toLowerCase().includes('looking at') ||
       msg.body?.toLowerCase().includes('let\'s do it') ||
       msg.body?.toLowerCase().includes('go ahead'))
    );
  
  // First message in thread - be friendly and casual
  if (isFirstMessage && !recentAcknowledgment) {
    return `<p>Hey ${name || 'there'}! Let's do it. I'll go ahead and pull together the best ${category} options for you, just give me a minute.</p>`;
  }
  
  // If we've already acknowledged, be more concise and conversational
  if (recentAcknowledgment) {
    return `<p>Got it! ${name ? `${name}, ` : ''}I'm pulling together the best ${category} options for you now.</p>`;
  }
  
  // Extract context from message
  const hasDates = message.toLowerCase().match(/(next weekend|this weekend|feb|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})/);
  const hasLocation = message.toLowerCase().match(/(nyc|new york|san francisco|sf|los angeles|la|chicago|miami|boston|seattle)/);
  const isTeamTrip = message.toLowerCase().includes('team') || message.toLowerCase().includes('group');
  
  let contextNote = '';
  if (hasDates && hasLocation && isTeamTrip) {
    contextNote = `I see you're looking for ${hasLocation[0]} for your team${hasDates[0] ? ` ${hasDates[0]}` : ''}. `;
  } else if (hasLocation) {
    contextNote = `I see you're looking in ${hasLocation[0]}. `;
  } else if (hasDates) {
    contextNote = `I see you're planning for ${hasDates[0]}. `;
  }
  
  const loyaltyNote = profile?.members?.[0]?.loyalty_accounts?.length 
    ? 'I\'ll check your loyalty accounts to maximize points and perks. ' 
    : '';
  
  return `<p>${name ? `Hey ${name}, ` : ''}${contextNote}${loyaltyNote}I'm pulling together the best ${category} options for you now.</p>`;
}

/**
 * Format response for Intercom with proper HTML formatting
 */
function formatResponseForIntercom(response: string, profile: any): string {
  // Remove <pre><code> wrapper if present (OpenAI sometimes wraps HTML in code blocks)
  let cleaned = response.trim();
  
  // Check for various code block patterns
  if (cleaned.includes('<pre>') || cleaned.includes('<code>')) {
    // Remove <pre><code> wrapper (with or without closing tags)
    cleaned = cleaned
      .replace(/^<pre><code>/i, '')
      .replace(/<\/code><\/pre>$/i, '')
      .replace(/^<pre>/i, '')
      .replace(/<\/pre>$/i, '')
      .replace(/^<code>/i, '')
      .replace(/<\/code>$/i, '');
    
    // Unescape HTML entities (common when HTML is in code blocks)
    cleaned = cleaned
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\\n/g, '\n') // Unescape newlines
      .replace(/\\"/g, '"'); // Unescape quotes
  }

  // If response already contains HTML, use it (after cleaning)
  if (cleaned.includes('<p>') || cleaned.includes('<strong>') || cleaned.includes('<em>') || cleaned.includes('<br>')) {
    return cleaned;
  }

  // Convert markdown-style formatting to HTML
  let formatted = cleaned
    // Bold text **text** -> <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic text *text* -> <em>text</em>
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped
  if (!formatted.startsWith('<')) {
    formatted = `<p>${formatted}</p>`;
  }

  // Clean up empty paragraphs
  formatted = formatted.replace(/<p><\/p>/g, '');
  formatted = formatted.replace(/<p><br><\/p>/g, '');
  
  // Remove trailing whitespace and empty lines at the end
  formatted = formatted.trim();
  // Remove trailing <br> tags
  formatted = formatted.replace(/(<br\s*\/?>)+$/gi, '');
  // Remove trailing empty paragraphs
  formatted = formatted.replace(/(<p>\s*<\/p>)+$/gi, '');
  // Remove excessive spacing at the end
  formatted = formatted.replace(/\s+$/, '');

  return formatted;
}

/**
 * Send hotel recommendations with proper formatting and follow-up
 */
async function sendHotelRecommendationsWithFollowUp(
  conversationId: string,
  data: any,
  profile: any,
  originalMessage: string
): Promise<void> {
  const recommendations = data.recommendations || [];
  const parsedRequest = data.parsed_request || {};
  
  if (recommendations.length === 0) {
    await sendIntercomReply(
      conversationId,
      '<p>I couldn\'t find any hotel recommendations at this time. Let me know if you\'d like to try different search criteria.</p>'
    );
    return;
  }
  
  // Get user preferences for intro text
  const preferences = (profile as any)?.preferences || {};
  const preferenceTexts: string[] = [];
  if (preferences.luxury) preferenceTexts.push('luxury');
  if (preferences.food) preferenceTexts.push('food');
  if (preferences.culture) preferenceTexts.push('culture');
  if (preferences.activities) preferenceTexts.push('activities');
  
  const preferenceText = preferenceTexts.length > 0 
    ? preferenceTexts.join(', ')
    : 'luxury travel';
  
  // Check if user has memberships
  const hasMemberships = (profile as any)?.members?.[0]?.loyalty_accounts?.length > 0;
  const membershipText = hasMemberships 
    ? ', while also optimizing the use of your rewards and memberships'
    : '';
  
  // Build and send intro text
  const city = parsedRequest.city || 'your destination';
  const dates = parsedRequest.dates;
  let introText = `<p>Here are some of our top hotel recommendations in-network for your upcoming trip to ${city}`;
  
  if (dates?.check_in && dates?.check_out) {
    const checkIn = new Date(dates.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const checkOut = new Date(dates.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    introText += ` (${checkIn} - ${checkOut})`;
  }
  
  introText += `. Each option has been selected to match your preferences for ${preferenceText}${membershipText}.</p>`;
  
  await sendIntercomReply(conversationId, introText);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  
  // Send each hotel separately with delay
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    const hotelHTML = formatSingleHotelRecommendation(rec);
    await sendIntercomReply(conversationId, hotelHTML);
    
    // Delay between hotels (except after the last one)
    if (i < recommendations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
    }
  }
  
  // Send follow-up message after all hotels
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  const followUp = generateFollowUpMessage(data, originalMessage, profile);
  if (followUp) {
    await sendIntercomReply(conversationId, followUp);
    console.log('✅ Follow-up message sent');
  }
}

/**
 * Format a single hotel recommendation
 */
function formatSingleHotelRecommendation(rec: any): string {
  let html = '';
  
  // Hotel image (first, before name)
  if (rec.image_hero) {
    html += `<p><img src="${rec.image_hero}" alt="${rec.name}" style="max-width: 100%; height: auto; border-radius: 8px;"></p>`;
  }
  
  // Hotel name (bold, on its own line)
  html += `<p><strong>${rec.name}</strong></p>`;
  
  // Location (italic, on its own line - separate from name)
  if (rec.neighborhood) {
    html += `<p><em>Located in ${rec.neighborhood}</em></p>`;
  }
  
  // Description
  if (rec.reason) {
    html += `<p>${rec.reason}</p>`;
  }
  
  // Rate
  const rate = rec.rate_estimate?.mid || rec.rate_estimate?.high || 'TBD';
  html += `<p><strong>Rate:</strong> $${rate} per night</p>`;
  
  // Perks
  if (rec.pier_benefits && rec.pier_benefits.length > 0) {
    const perksText = rec.pier_benefits
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(', ');
    html += `<p><strong>Perks:</strong> ${perksText}</p>`;
  }
  
  // Website link
  if (rec.website_url) {
    html += `<p><a href="${rec.website_url}" rel="nofollow noopener noreferrer" target="_blank" class="intercom-content-link">Visit Website</a></p>`;
  }
  
  return html;
}

/**
 * Build hotel recommendations HTML directly from data (DEPRECATED - use sendHotelRecommendationsWithFollowUp instead)
 */
function buildHotelRecommendationsHTML(
  data: any,
  profile: any,
  originalMessage: string
): string {
  const recommendations = data.recommendations || [];
  const parsedRequest = data.parsed_request || {};
  
  if (recommendations.length === 0) {
    return '<p>I couldn\'t find any hotel recommendations at this time. Let me know if you\'d like to try different search criteria.</p>';
  }
  
  // Get user preferences for intro text
  const preferences = profile?.preferences || {};
  const preferenceTexts: string[] = [];
  if (preferences.luxury) preferenceTexts.push('luxury');
  if (preferences.food) preferenceTexts.push('food');
  if (preferences.culture) preferenceTexts.push('culture');
  if (preferences.activities) preferenceTexts.push('activities');
  
  const preferenceText = preferenceTexts.length > 0 
    ? preferenceTexts.join(', ')
    : 'luxury travel';
  
  // Check if user has memberships
  const hasMemberships = profile?.members?.[0]?.loyalty_accounts?.length > 0;
  const membershipText = hasMemberships 
    ? ', while also optimizing the use of your rewards and memberships'
    : '';
  
  // Build intro text
  const city = parsedRequest.city || 'your destination';
  const dates = parsedRequest.dates;
  let introText = `<p>Here are some of our top hotel recommendations in-network for your upcoming trip to ${city}`;
  
  if (dates?.check_in && dates?.check_out) {
    const checkIn = new Date(dates.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const checkOut = new Date(dates.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    introText += ` (${checkIn} - ${checkOut})`;
  }
  
  introText += `. Each option has been selected to match your preferences for ${preferenceText}${membershipText}.</p>`;
  
  // Build hotel recommendations HTML
  let hotelsHTML = '';
  
  recommendations.forEach((rec: any, index: number) => {
    // Add HR separator before each hotel (except the first)
    if (index > 0) {
      hotelsHTML += '<hr>';
    }
    
    // Hotel image (first, before name)
    if (rec.image_hero) {
      hotelsHTML += `<p><img src="${rec.image_hero}" alt="${rec.name}" style="max-width: 100%; height: auto; border-radius: 8px;"></p>`;
    }
    
    // Hotel name (bold, on its own line)
    hotelsHTML += `<p><strong>${rec.name}</strong></p>`;
    
    // Location (italic, on its own line - separate from name)
    if (rec.neighborhood) {
      hotelsHTML += `<p><em>Located in ${rec.neighborhood}</em></p>`;
    }
    
    // Description
    if (rec.reason) {
      hotelsHTML += `<p>${rec.reason}</p>`;
    }
    
    // Rate
    const rate = rec.rate_estimate?.mid || rec.rate_estimate?.high || 'TBD';
    hotelsHTML += `<p><strong>Rate:</strong> $${rate} per night</p>`;
    
    // Perks
    if (rec.pier_benefits && rec.pier_benefits.length > 0) {
      const perksText = rec.pier_benefits
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(', ');
      hotelsHTML += `<p><strong>Perks:</strong> ${perksText}</p>`;
    }
    
    // Website link
    if (rec.website_url) {
      hotelsHTML += `<p><a href="${rec.website_url}" rel="nofollow noopener noreferrer" target="_blank">Visit Website</a></p>`;
    }
  });
  
  return introText + hotelsHTML;
}

/**
 * Generate follow-up message after hotel recommendations
 */
function generateFollowUpMessage(
  data: any, 
  originalMessage: string, 
  profile: any
): string | null {
  const recommendations = data.recommendations || [];
  const parsedRequest = data.parsed_request || {};
  
  if (recommendations.length === 0) {
    return null;
  }
  
  const hasDates = parsedRequest.dates?.check_in && parsedRequest.dates?.check_out;
  const isTeamTrip = originalMessage.toLowerCase().includes('team') ||
                     originalMessage.toLowerCase().includes('group') ||
                     (parsedRequest.party_size && parsedRequest.party_size > 1);
  const partySize = parsedRequest.party_size || 1;
  
  let questions: string[] = [];
  
  // Ask about dates if not specified
  if (!hasDates) {
    questions.push('What dates are you looking to stay?');
  }
  
  // Ask about booking/hold if multiple rooms or team trip
  if (isTeamTrip || partySize > 1) {
    questions.push('Would you like me to put a hold on room' + (partySize > 1 ? 's' : '') + '?');
  }
  
  // Always offer to look at other options
  questions.push('Would you like to see other options in or out of network?');
  
  // Always offer to speak with a specialist
  questions.push('Would you like to speak with a specialist?');
  
  const name = (profile as any)?.full_name?.split(' ')[0] || '';
  const greeting = name ? `${name}, ` : '';
  
  // Build the follow-up message
  let followUp = `<p>What do you think of these options? I can help you with:</p>`;
  
  if (questions.length > 0) {
    followUp += '<p>';
    questions.forEach((q, i) => {
      if (i > 0) followUp += '<br>';
      followUp += `• ${q}`;
    });
    followUp += '</p>';
  }
  
  return followUp;
}

/**
 * Send reply to Intercom conversation
 */
async function sendIntercomReply(conversationId: string, message: string): Promise<void> {
  // Intercom requires admin_id when sending as admin
  const adminId = INTERCOM_DEFAULT_ASSIGNEE_ID;
  
  if (!adminId) {
    throw new Error('INTERCOM_DEFAULT_ASSIGNEE_ID is not configured');
  }

  const requestBody: any = {
    message_type: 'comment',
    type: 'admin',
    body: message,
  };

  // Add admin_id if sending as admin
  if (requestBody.type === 'admin') {
    requestBody.admin_id = adminId;
  }

  console.log('📤 Sending reply to Intercom:', {
    conversationId,
    messageLength: message.length,
    adminId: adminId ? `${adminId.substring(0, 4)}...` : 'none',
  });

  const response = await fetch(
    `https://api.intercom.io/conversations/${conversationId}/parts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': '2.11',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Intercom API error:', error);
    console.error('❌ Request body:', JSON.stringify(requestBody, null, 2));
    throw new Error(`Failed to send reply: ${response.status}`);
  }

  const responseData = await response.json();
  console.log('✅ Reply sent to Intercom conversation:', conversationId);
  console.log('✅ Response:', JSON.stringify(responseData, null, 2));
}

/**
 * Assign conversation to human team member
 */
async function assignToHuman(conversationId: string): Promise<void> {
  const adminId = INTERCOM_DEFAULT_ASSIGNEE_ID;
  
  if (!adminId) {
    console.warn('⚠️ INTERCOM_DEFAULT_ASSIGNEE_ID not set, cannot assign to human');
    return;
  }

  // Use admin_assignee_id for assignment (not admin_id)
  const response = await fetch(
    `https://api.intercom.io/conversations/${conversationId}/parts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': '2.11',
      },
      body: JSON.stringify({
        message_type: 'assignment',
        type: 'admin',
        admin_assignee_id: parseInt(adminId, 10), // Must be integer
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to assign conversation:', error);
    // Don't throw - assignment is non-critical, just log the error
    return;
  }

  console.log('✅ Conversation assigned to human:', adminId);
}

/**
 * Get user ID from Intercom conversation
 * Returns the Intercom contact/user ID
 */
async function getIntercomUser(conversation: any): Promise<string | null> {
  // Try multiple paths for user/contact ID
  // 1. Direct user or contact
  if (conversation.user?.id) {
    return conversation.user.id;
  }
  if (conversation.contact?.id) {
    return conversation.contact.id;
  }
  
  // 2. From contacts list (most common in webhook payloads)
  if (conversation.contacts?.contacts && conversation.contacts.contacts.length > 0) {
    const contact = conversation.contacts.contacts[0];
    if (contact.id) {
      return contact.id;
    }
  }
  
  // 3. From source author (fallback)
  if (conversation.source?.author?.id) {
    return conversation.source.author.id;
  }
  
  return null;
}

/**
 * Get Supabase user ID from Intercom conversation
 * Returns the Supabase user ID (external_id) if available
 */
async function getSupabaseUserIdFromConversation(conversation: any): Promise<string | null> {
  // Check contacts for external_id (this is our Supabase user ID)
  if (conversation.contacts?.contacts && conversation.contacts.contacts.length > 0) {
    const contact = conversation.contacts.contacts[0];
    if (contact.external_id) {
      return contact.external_id;
    }
  }
  
  // Fallback: check source author
  if (conversation.source?.author?.external_id) {
    return conversation.source.author.external_id;
  }
  
  return null;
}

/**
 * Map Intercom user ID to Supabase profile
 */
async function getSupabaseProfile(supabase: any, intercomUserId: string): Promise<any | null> {
  // First try to find by intercom_user_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('intercom_user_id', intercomUserId)
    .maybeSingle();

  if (profile) {
    // Fetch member data separately
    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('id', profile.id)
      .maybeSingle();
    
    return {
      ...profile,
      members: memberData ? [memberData] : []
    };
  }

  // If not found, the intercomUserId might actually be our Supabase user ID (external_id)
  // Try to find by id directly
  const { data: profileById } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', intercomUserId)
    .maybeSingle();

  if (profileById) {
    // Fetch member data separately
    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('id', profileById.id)
      .maybeSingle();
    
    return {
      ...profileById,
      members: memberData ? [memberData] : []
    };
  }

  return null;
}

/**
 * Handle generic conversation event
 * This handles the "conversation" type which Intercom sends for various conversation updates
 */
async function handleConversationEvent(supabase: any, data: any): Promise<void> {
  const conversation = data;
  const conversationId = conversation.id;

  if (!conversationId) {
    console.warn('⚠️ No conversation ID in conversation event');
    return;
  }

  console.log('💬 Handling conversation event:', conversationId);
  console.log('💬 Conversation state:', conversation.state);
  console.log('💬 Conversation open:', conversation.open);

  // Check if there are conversation parts (messages)
  const conversationParts = conversation.conversation_parts?.conversation_parts || [];
  console.log('💬 Conversation parts count:', conversationParts.length);

  if (conversationParts.length === 0) {
    console.log('ℹ️ No conversation parts, skipping');
    return;
  }

  // Find the latest message (check if it's from user or admin)
  const allMessages = (conversationParts as any[]).filter(
    (part: any) => part.part_type === 'comment'
  );

  if (allMessages.length === 0) {
    console.log('ℹ️ No messages found');
    return;
  }

  const latestMessage = allMessages[allMessages.length - 1];
  const latestAuthorType = latestMessage.author?.type;

  // If the latest message is from an admin (us), skip processing
  // This prevents processing webhooks triggered by our own replies
  if (latestAuthorType === 'admin') {
    console.log('ℹ️ Latest message is from admin (our reply), skipping to prevent loop');
    return;
  }

  // Only process user messages
  if (latestAuthorType !== 'user') {
    console.log('ℹ️ Latest message is not from user, skipping');
    return;
  }

  const latestUserMessage = latestMessage;
  const messageId = latestUserMessage.id;
  
  // Extract text from HTML if needed
  let userMessage = (latestUserMessage.body || latestUserMessage.text || '') as string;
  
  // Strip HTML tags if present
  if (userMessage.includes('<')) {
    userMessage = userMessage.replace(/<[^>]*>/g, '').trim();
  }

  if (!userMessage) {
    console.log('ℹ️ Latest user message is empty');
    return;
  }

  console.log('💬 Found user message:', userMessage.substring(0, 100));
  console.log('💬 Message ID:', messageId);

  // Check if we've already processed this specific message by ID
  // Store processed message IDs in the database to prevent duplicates
  const { data: existingRequest } = await supabase
    .from('requests')
    .select('*')
    .eq('front_conversation_id', conversationId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check if we've processed this exact message ID recently
  if (existingRequest) {
    // Check if we have metadata with the processed message ID
    const processedMessageId = existingRequest.metadata?.processed_message_id;
    if (processedMessageId === messageId) {
      console.log('ℹ️ Already processed this message ID, skipping');
      return;
    }
    
    // Also check by message text and recency (fallback)
    const requestAge = Date.now() - new Date(existingRequest.updated_at).getTime();
    if (requestAge < 120000 && existingRequest.raw_text === userMessage) {
      console.log('ℹ️ Already processed this message recently, skipping');
      return;
    }
  }

  // Process as a user reply
  await handleUserReply(supabase, data);
}

/**
 * Handle new conversation created
 */
async function handleConversationCreated(supabase: any, data: any): Promise<void> {
  // Data is already the conversation object (not wrapped in data.item)
  const conversation = data.item || data.conversation || data;
  const conversationId = conversation.id;
  const intercomUserId = await getIntercomUser(conversation);

  if (!intercomUserId) {
    console.warn('⚠️ No user ID in conversation');
    return;
  }

  console.log('🆕 New conversation:', conversationId, 'User:', intercomUserId);

  const profile = await getSupabaseProfile(supabase, intercomUserId);

  if (!profile) {
    console.warn('⚠️ User not found for Intercom ID:', intercomUserId);
    return;
  }

  // Create request record
  await supabase.from('requests').insert({
    profile_id: (profile as any).id,
    front_conversation_id: conversationId,
    status: 'new',
    source_type: 'chat',
    created_at: new Date().toISOString(),
  });

  console.log('✅ Request created for conversation:', conversationId);
}

/**
 * Handle user message (MAIN LOGIC)
 */
async function handleUserReply(supabase: any, data: any, providedMessageId?: string): Promise<void> {
  console.log('💬 handleUserReply called with data structure:', {
    hasItem: !!data.item,
    hasConversation: !!data.conversation,
    dataKeys: Object.keys(data),
  });

  // Handle both direct conversation object and nested item structure
  const conversation = data.item || data.conversation || data;
  const conversationId = conversation.id;

  if (!conversationId) {
    console.error('❌ No conversation ID found in data:', JSON.stringify(data, null, 2));
    return;
  }

  // 🔴 CRITICAL: Check if conversation has human or bot participation FIRST
  // Check if assigned to human (not our bot)
  if (conversation.admin_assignee_id && 
      conversation.admin_assignee_id !== PIER_BOT_ADMIN_ID &&
      conversation.admin_assignee_id !== FIN_BOT_ID) {
    console.log('👤 Conversation assigned to human, skipping AI response');
    return;
  }

  // Check if human teammates have participated
  const teammates = conversation.teammates?.admins || [];
  const humanTeammates = teammates.filter((t: any) => {
    const adminId = String(t.id || t);
    return adminId !== PIER_BOT_ADMIN_ID && adminId !== FIN_BOT_ID;
  });

  if (humanTeammates.length > 0) {
    console.log('👥 Human teammates in conversation, skipping AI response');
    return;
  }

  // Check conversation parts - skip if latest message is from admin/bot
  const conversationParts = conversation.conversation_parts?.conversation_parts || [];
  
  if (conversationParts.length > 0) {
    const latestPart = conversationParts[conversationParts.length - 1];
    
    // Skip if latest message is from admin (our AI) or bot (Fin)
    if (latestPart.author?.type === 'admin' || latestPart.author?.type === 'bot') {
      const authorId = String(latestPart.author?.id || '');
      if (authorId === PIER_BOT_ADMIN_ID || authorId === FIN_BOT_ID || 
          latestPart.author?.type === 'bot') {
        console.log(`ℹ️ Latest message from ${latestPart.author?.type} (${authorId}), skipping to prevent loop`);
        return;
      }
    }
  }

  // Check source if conversation was just created
  if (conversation.source?.author?.type === 'admin' || 
      conversation.source?.author?.type === 'bot') {
    const sourceAuthorId = String(conversation.source?.author?.id || '');
    if (sourceAuthorId === PIER_BOT_ADMIN_ID || sourceAuthorId === FIN_BOT_ID) {
      console.log('ℹ️ Source message is from admin/bot, skipping');
      return;
    }
  }

  console.log('💬 Processing conversation:', conversationId);

  // Try to get Supabase user ID directly from external_id (preferred)
  let profile = null;
  const supabaseUserId = await getSupabaseUserIdFromConversation(conversation);
  
  if (supabaseUserId) {
    console.log('👤 Found Supabase user ID from external_id:', supabaseUserId);
    
    // First check if profile exists
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUserId)
      .maybeSingle();
    
    // If profile exists, fetch member data separately
    if (profileData) {
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', supabaseUserId)
        .maybeSingle();
      
      profile = {
        ...profileData,
        members: memberData ? [memberData] : []
      };
    }
    
    // If profile doesn't exist, check if user is a member and create profile
    if (!profile) {
      console.log('📝 Profile not found, checking if user is a member...');
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', supabaseUserId)
        .maybeSingle();
      
      if (member) {
        console.log('✅ User is a member, creating profile...');
        // Create profile for member (without join to avoid foreign key error)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ id: supabaseUserId })
          .select()
          .maybeSingle();
        
        if (createError) {
          // If profile already exists (race condition), fetch it
          if (createError.code === '23505') {
            console.log('ℹ️ Profile was created concurrently, fetching...');
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select()
              .eq('id', supabaseUserId)
              .maybeSingle();
            profile = existingProfile;
          } else {
            console.error('❌ Failed to create profile:', createError);
          }
        } else {
          profile = newProfile;
        }
        
        // If profile was created/found, attach member data manually
        if (profile) {
          (profile as any).members = [member];
          console.log('✅ Profile created/found with member data');
        }
      } else {
        console.warn('⚠️ User is not a member, cannot create profile');
      }
    }
  }

  // If not found by external_id, try Intercom contact ID
  if (!profile) {
    const intercomUserId = await getIntercomUser(conversation);
    
    if (!intercomUserId) {
      console.warn('⚠️ No user ID found in conversation');
      console.warn('⚠️ Conversation contacts:', JSON.stringify(conversation.contacts, null, 2));
      return;
    }

    console.log('👤 Found Intercom contact ID:', intercomUserId);
    profile = await getSupabaseProfile(supabase, intercomUserId);
    
    // If still not found, try to sync user to Intercom and get external_id
    if (!profile) {
      console.log('🔄 Attempting to sync user to Intercom to get external_id...');
      // We can't sync without knowing the Supabase user ID, so we'll need to return
      console.error('❌ Cannot proceed without user profile');
      return;
    }
  }

  if (!profile) {
    console.error('❌ User not found in Supabase database');
    console.error('❌ Intercom contact ID:', await getIntercomUser(conversation));
    console.error('❌ Supabase user ID (external_id):', supabaseUserId);
    return;
  }

  console.log('✅ Found user profile:', (profile as any).id);

  // Get the latest message from the conversation
  // Intercom can structure this differently - try multiple paths
  let allConversationParts: any[] = [];
  
  if (conversation.conversation_parts?.conversation_parts) {
    allConversationParts = conversation.conversation_parts.conversation_parts;
  } else if (conversation.conversation_parts) {
    allConversationParts = Array.isArray(conversation.conversation_parts) 
      ? conversation.conversation_parts 
      : [];
  } else if (data.conversation_parts) {
    allConversationParts = Array.isArray(data.conversation_parts) 
      ? data.conversation_parts 
      : data.conversation_parts?.conversation_parts || [];
  }

  console.log('💬 Found conversation parts:', allConversationParts.length);

  // Find the latest user message
  const userMessages = (allConversationParts as any[]).filter(
    (part: any) => part.part_type === 'comment' && part.author?.type === 'user'
  );
  
  const latestMessage = (userMessages[userMessages.length - 1] || allConversationParts[allConversationParts.length - 1]) as any;

  if (!latestMessage) {
    console.log('ℹ️ No message found in conversation parts');
    console.log('ℹ️ Conversation parts structure:', JSON.stringify(allConversationParts, null, 2));
    return;
  }

  if (latestMessage.part_type !== 'comment' || latestMessage.author?.type !== 'user') {
    console.log('ℹ️ Latest message is not a user comment:', {
      part_type: latestMessage.part_type,
      author_type: latestMessage.author?.type,
    });
    return;
  }

  // Extract text from HTML if needed
  let userMessage = (latestMessage.body || latestMessage.text || '') as string;
  const messageId = providedMessageId || latestMessage.id; // Use provided ID or extract
  
  // Strip HTML tags if present
  if (userMessage.includes('<')) {
    userMessage = userMessage.replace(/<[^>]*>/g, '').trim();
  }
  
  if (!userMessage) {
    console.warn('⚠️ User message is empty');
    return;
  }

  console.log('💬 User message:', userMessage);
  console.log('💬 Message ID:', messageId);
  console.log('👤 Profile ID:', (profile as any).id);
  console.log('🆔 Conversation ID:', conversationId);

  // Get existing request and check if we've already processed this message
  const { data: existingRequest } = await supabase
    .from('requests')
    .select('*')
    .eq('front_conversation_id', conversationId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // CRITICAL: Check if we've already processed this exact message ID (most reliable check)
  // Do this FIRST before any processing to prevent duplicates
  if (existingRequest?.metadata?.processed_message_id === messageId) {
    console.log('ℹ️ Already processed this message ID, skipping');
    return;
  }
  
  // Check if response was already sent for this message ID (prevent duplicate sends)
  if (existingRequest?.metadata?.response_message_id === messageId && 
      existingRequest?.metadata?.response_sent === true) {
    console.log('ℹ️ Response already sent for this message ID, skipping duplicate');
    return;
  }
  
  // Mark as processing IMMEDIATELY to prevent race conditions
  // Use an atomic update: only update if processed_message_id is NOT already set to this messageId
  // This prevents two concurrent webhooks from both processing the same message
  if (existingRequest) {
    // Only update if the processed_message_id is different (or null)
    const currentProcessedId = existingRequest.metadata?.processed_message_id;
    if (currentProcessedId && currentProcessedId !== messageId) {
      // Another message is being processed, but check if it's the same user message
      const requestAge = Date.now() - new Date(existingRequest.updated_at).getTime();
      if (requestAge < 5000 && existingRequest.raw_text === userMessage) {
        // Very recent update with same text - likely a duplicate webhook
        console.log('ℹ️ Another instance is processing this message, skipping duplicate');
        return;
      }
    }
    
    // Update to mark as processing
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        metadata: {
          ...(existingRequest.metadata || {}),
          processed_message_id: messageId,
          processing_started_at: new Date().toISOString(),
        },
      })
      .eq('id', existingRequest.id)
      .eq('metadata->>processed_message_id', currentProcessedId || 'null');
    
    // If update affected 0 rows, another process already set processed_message_id
    if (updateError) {
      console.error('❌ Error updating request:', updateError);
    } else {
      // Re-fetch to verify the update succeeded
      const { data: verifyRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('id', existingRequest.id)
        .maybeSingle();
      
      if (verifyRequest?.metadata?.processed_message_id !== messageId) {
        console.log('ℹ️ Another process already processing this message, skipping duplicate');
        return;
      }
    }
  } else {
    // Create request record immediately to track processing
    const { error: insertError } = await supabase.from('requests').insert({
      profile_id: (profile as any).id,
      front_conversation_id: conversationId,
      status: 'in_progress',
      raw_text: userMessage,
      source_type: 'chat',
      metadata: {
        processed_message_id: messageId,
        processing_started_at: new Date().toISOString(),
      },
    });
    
    // If insert fails due to duplicate, fetch and check
    if (insertError && insertError.code === '23505') {
      const { data: fetchedRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('front_conversation_id', conversationId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchedRequest?.metadata?.processed_message_id === messageId) {
        console.log('ℹ️ Request already exists and message already processed, skipping duplicate');
        return;
      }
    }
  }
  
  // Also check by message text and recency (fallback for edge cases)
  if (existingRequest) {
    const requestAge = Date.now() - new Date(existingRequest.updated_at).getTime();
    if (requestAge < 120000 && existingRequest.raw_text === userMessage) {
      // Only skip if we've actually sent a response
      if (existingRequest.metadata?.response_sent === true) {
        console.log('ℹ️ Already processed this message recently and response sent, skipping');
        return;
      }
    }
  }
  
  // Check if user wants to speak to a specialist - handle immediately
  const wantsSpecialist = userMessage.toLowerCase().match(/\b(speak|talk|connect|handoff|transfer|specialist|human|agent|representative)\b/);
  if (wantsSpecialist) {
    console.log('👤 User requested to speak with specialist, assigning to human');
    try {
      await assignToHuman(conversationId);
      await sendIntercomReply(
        conversationId,
        '<p>I\'m connecting you with a specialist now. They\'ll be with you shortly!</p>'
      );
      // Mark as processed and escalated
      if (existingRequest) {
        await supabase
          .from('requests')
          .update({
            status: 'awaiting_human',
            metadata: {
              ...(existingRequest.metadata || {}),
              processed_message_id: messageId,
              response_sent: true,
              escalated_to_human: true,
            },
          })
          .eq('id', existingRequest.id);
      }
    } catch (error) {
      console.error('⚠️ Failed to assign to specialist:', error);
    }
    return; // Don't process further - hand off to human
  }

  // Get conversation history from Intercom (only user and assistant messages, exclude admin)
  const conversationHistory = allConversationParts
    .filter((part: any) => {
      // Only include comments, and exclude admin messages
      if (part.part_type !== 'comment') return false;
      // Exclude messages from admins (only process user messages and bot messages)
      const authorType = part.author?.type;
      return authorType === 'user' || authorType === 'bot';
    })
    .map((part: any) => {
      // Extract text from HTML
      let body = part.body || '';
      if (body.includes('<')) {
        body = body.replace(/<[^>]*>/g, '').trim();
      }
      return {
        sent_by: part.author.type === 'user' ? 'user' : 'assistant',
        body: body,
        created_at: part.created_at,
        message_id: part.id,
      };
    })
    .filter((msg: any) => msg.body && msg.body.length > 0); // Remove empty messages

  console.log('💬 Conversation history:', conversationHistory.length, 'messages');

  // Check if this is a "Confirm" message - link to existing task
  const isConfirmMessage = userMessage.toLowerCase().trim() === 'confirm';
  let relatedTaskId: string | undefined = undefined;
  
  if (isConfirmMessage) {
    // Find the most recent awaiting_human task with preview_confirm strategy
    const { data: recentTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', (profile as any).id)
      .eq('status', 'awaiting_human')
      .eq('decision_strategy', 'preview_confirm')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (recentTask) {
      const taskAge = Date.now() - new Date(recentTask.created_at || 0).getTime();
      if (taskAge < 10 * 60 * 1000) { // Within 10 minutes
        relatedTaskId = recentTask.id;
        console.log('🔗 Linking "Confirm" to existing task:', relatedTaskId);
      }
    }
  }

  // Send immediate acknowledgment for hotel searches (only if we haven't already)
  const isHotelSearch = userMessage.toLowerCase().includes('hotel') || 
                        userMessage.toLowerCase().includes('accommodation') ||
                        userMessage.toLowerCase().includes('stay');
  
  // Re-fetch request to get latest state (might have been updated)
  const { data: currentRequestForAck } = await supabase
    .from('requests')
    .select('*')
    .eq('front_conversation_id', conversationId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  // Check if we've already sent an acknowledgment for this message
  const hasAcknowledgment = currentRequestForAck?.metadata?.acknowledgment_sent === true;
  const ackMessageId = currentRequestForAck?.metadata?.acknowledgment_message_id;
  
  // Also check if acknowledgment was sent for this specific message ID
  if (ackMessageId === messageId && hasAcknowledgment) {
    console.log('ℹ️ Acknowledgment already sent for this message ID, skipping duplicate');
  } else if (isHotelSearch && !isConfirmMessage && !hasAcknowledgment) {
    // Mark as sent BEFORE sending to prevent duplicates
    if (currentRequestForAck) {
      await supabase
        .from('requests')
        .update({
          metadata: {
            ...(currentRequestForAck.metadata || {}),
            acknowledgment_sent: true,
            acknowledgment_message_id: messageId,
            processed_message_id: messageId,
          },
        })
        .eq('id', currentRequestForAck.id);
    } else {
      // Create request record to track acknowledgment
      await supabase.from('requests').insert({
        profile_id: (profile as any).id,
        front_conversation_id: conversationId,
        status: 'in_progress',
        raw_text: userMessage,
        source_type: 'chat',
        metadata: {
          processed_message_id: messageId,
          acknowledgment_sent: true,
          acknowledgment_message_id: messageId,
        },
      });
    }
    
    const acknowledgment = generateAcknowledgmentMessage(userMessage, profile, conversationHistory);
    await sendIntercomReply(conversationId, acknowledgment);
    console.log('✅ Sent acknowledgment message');
  }

  // Call orchestrator
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const orchestratorUrl = `${supabaseUrl}/functions/v1/orchestrator`;

  console.log('🤖 Calling orchestrator:', {
    url: orchestratorUrl,
    userId: (profile as any).id,
    messageLength: userMessage.length,
    historyLength: conversationHistory.length,
    relatedTaskId,
  });

  try {
    const orchestratorResponse = await fetch(orchestratorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: (profile as any).id,
        message: userMessage,
        relatedTaskId: relatedTaskId,
        conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
      }),
    });

    if (!orchestratorResponse.ok) {
      const errorText = await orchestratorResponse.text();
      console.error('❌ Orchestrator failed:', {
        status: orchestratorResponse.status,
        statusText: orchestratorResponse.statusText,
        error: errorText,
      });
      throw new Error(`Orchestrator failed: ${orchestratorResponse.status} - ${errorText}`);
    }

    const result = await orchestratorResponse.json();

    console.log('🤖 Orchestration result:', {
      success: result.success,
      intent: result.intent,
      confidence: result.confidence,
      hasResponse: !!result.response,
      responseLength: result.response?.length || 0,
      taskStatus: result.task?.status,
    });

    // Send reply back to Intercom (only if we haven't already sent a response for this message)
    // Re-fetch request to get latest state (might have been updated by another instance)
    const { data: currentRequest } = await supabase
      .from('requests')
      .select('*')
      .eq('front_conversation_id', conversationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Check BEFORE sending to prevent duplicates
    const responseSent = currentRequest?.metadata?.response_sent === true;
    const responseMessageId = currentRequest?.metadata?.response_message_id;
    
    // Also check if we've already sent a response for this specific message ID
    if (responseMessageId === messageId && responseSent) {
      console.log('ℹ️ Response already sent for this message ID, skipping duplicate');
      return; // Exit early to prevent any further processing
    }
    
    if (result.response && !responseSent) {
      // Mark as sent IMMEDIATELY before sending to prevent race conditions
      if (currentRequest) {
        await supabase
          .from('requests')
          .update({
            metadata: {
              ...(currentRequest.metadata || {}),
              response_sent: true,
              response_message_id: messageId,
            },
          })
          .eq('id', currentRequest.id);
      }
      
      // Check if we should escalate (but don't escalate for low confidence on hotel searches)
      const shouldEscalate = 
        (result.task?.status === 'awaiting_human' && result.strategy === 'escalate') ||
        (result.strategy === 'escalate' && result.intent !== 'travel_search_hotels');

      if (shouldEscalate) {
        console.log('👤 Escalating to human');
        try {
          await assignToHuman(conversationId);
        } catch (assignError) {
          console.error('⚠️ Failed to assign to human (non-critical):', assignError);
          // Don't throw - assignment failure shouldn't block response
        }
      }

      // For hotel recommendations, send separately with proper formatting
      if (result.intent === 'travel_search_hotels' && result.data?.recommendations) {
        await sendHotelRecommendationsWithFollowUp(
          conversationId,
          result.data,
          profile,
          userMessage
        );
      } else {
        // For other intents, use the orchestrator response
        let formattedResponse = formatResponseForIntercom(result.response, profile);
        
        // Remove "Hello [Name]," or "Hi [Name]," from the beginning if present
        const name = (profile as any)?.full_name?.split(' ')[0] || '';
        if (name) {
          formattedResponse = formattedResponse
            .replace(new RegExp(`<p>Hello ${name},`, 'gi'), '<p>')
            .replace(new RegExp(`<p>Hi ${name},`, 'gi'), '<p>')
            .replace(new RegExp(`<p>${name},`, 'gi'), '<p>');
        }
        
        await sendIntercomReply(conversationId, formattedResponse);
        console.log('✅ Reply sent to Intercom');
      }
      
      // Send follow-up message for hotel recommendations (only if not already sent)
      // Re-fetch request to get latest state
      const { data: latestRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('front_conversation_id', conversationId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const followUpSent = latestRequest?.metadata?.follow_up_sent === true;
      if (result.intent === 'travel_search_hotels' && result.data?.recommendations && !followUpSent) {
        const followUp = generateFollowUpMessage(result.data, userMessage, profile);
        if (followUp) {
          // Mark follow-up as sent BEFORE sending to prevent duplicates
          if (latestRequest) {
            await supabase
              .from('requests')
              .update({
                metadata: {
                  ...(latestRequest.metadata || {}),
                  follow_up_sent: true,
                },
              })
              .eq('id', latestRequest.id);
          }
          
          // Small delay to ensure recommendations message is sent first
          await new Promise(resolve => setTimeout(resolve, 1500));
          await sendIntercomReply(conversationId, followUp);
          console.log('✅ Follow-up message sent');
        }
      } else if (followUpSent) {
        console.log('ℹ️ Follow-up already sent, skipping duplicate');
      }
    } else if (result.response && responseSent) {
      console.log('ℹ️ Response already sent for this message, skipping duplicate');
    } else if (!result.response) {
      console.warn('⚠️ No response from orchestrator');
      // Only send fallback if we haven't sent anything yet
      if (!responseSent && !existingRequest?.metadata?.acknowledgment_sent) {
        await sendIntercomReply(
          conversationId,
          'I received your message and am processing it. Please give me a moment.'
        );
      }
    }

    // Update request in database
    const requestStatus = result.task?.status === 'awaiting_human' 
      ? 'awaiting_human' 
      : result.task?.status || 'in_progress';

    if (existingRequest) {
      await supabase
        .from('requests')
        .update({
          status: requestStatus,
          intent: result.intent,
          raw_text: userMessage,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(existingRequest.metadata || {}),
            processed_message_id: messageId,
            acknowledgment_sent: existingRequest.metadata?.acknowledgment_sent || false,
            response_sent: existingRequest.metadata?.response_sent || false,
          },
        })
        .eq('id', existingRequest.id);
    } else {
      // Create if doesn't exist
      await supabase.from('requests').insert({
        profile_id: (profile as any).id,
        front_conversation_id: conversationId,
        status: requestStatus,
        intent: result.intent,
        raw_text: userMessage,
        source_type: 'chat',
        metadata: {
          processed_message_id: messageId,
          acknowledgment_sent: isHotelSearch && !isConfirmMessage,
          response_sent: false, // Will be set to true when response is sent
        },
      });
    }
  } catch (error) {
    console.error('❌ Orchestrator error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Send error message to user (only if we haven't already sent an error)
    const errorSent = existingRequest?.metadata?.error_sent === true;
    if (!errorSent) {
      try {
        await sendIntercomReply(
          conversationId,
          'I encountered an error processing your request. Our team has been notified and will help you shortly.'
        );
        
        // Mark error as sent
        if (existingRequest) {
          await supabase
            .from('requests')
            .update({
              metadata: {
                ...(existingRequest.metadata || {}),
                error_sent: true,
              },
            })
            .eq('id', existingRequest.id);
        } else {
          // Create request record to track error
          await supabase.from('requests').insert({
            profile_id: (profile as any).id,
            front_conversation_id: conversationId,
            status: 'error',
            raw_text: userMessage,
            source_type: 'chat',
            metadata: {
              processed_message_id: messageId,
              error_sent: true,
            },
          });
        }
        
        // Try to assign to human (non-blocking)
        try {
          await assignToHuman(conversationId);
        } catch (assignError) {
          console.error('⚠️ Failed to assign to human (non-critical):', assignError);
        }
      } catch (sendError) {
        console.error('❌ Failed to send error message to Intercom:', sendError);
      }
    } else {
      console.log('ℹ️ Error message already sent, skipping duplicate');
    }
  }
}

/**
 * Handle admin (human) reply
 */
async function handleAdminReply(supabase: any, data: any): Promise<void> {
  const conversation = data.item || data.conversation || data;
  const conversationId = conversation.id;

  console.log('👤 Admin replied in conversation:', conversationId);

  // Update status to show human is handling
  await supabase
    .from('requests')
    .update({
      status: 'human_handling',
      updated_at: new Date().toISOString(),
    })
    .eq('front_conversation_id', conversationId);
}

/**
 * Handle assignment to human
 */
async function handleAdminAssigned(supabase: any, data: any): Promise<void> {
  const conversation = data.item || data.conversation || data;
  const assignee = conversation.assignee;

  console.log('👤 Assigned to:', assignee?.name);

  await supabase
    .from('requests')
    .update({
      status: 'awaiting_human',
      assigned_agent: assignee?.name || 'Human Concierge',
      updated_at: new Date().toISOString(),
    })
    .eq('front_conversation_id', conversation.id);
}

/**
 * Handle conversation closed
 */
async function handleConversationClosed(supabase: any, data: any): Promise<void> {
  const conversation = data.item || data.conversation || data;

  console.log('✅ Conversation closed:', conversation.id);

  await supabase
    .from('requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('front_conversation_id', conversation.id);
}

/**
 * Sync user to Intercom (create/update contact)
 */
async function syncUserToIntercom(supabase: any, userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, members(*)')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.warn('⚠️ Profile not found for sync:', userId);
    return;
  }

  try {
    // Create or update user in Intercom
    const response = await fetch('https://api.intercom.io/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Intercom-Version': '2.11',
      },
      body: JSON.stringify({
        external_id: userId,
        email: profile.email || profile.members?.email,
        name: profile.full_name || `${profile.members?.first_name} ${profile.members?.last_name}`,
        phone: profile.phone_number,
        custom_attributes: {
          membership_level: profile.members?.membership_level || 'Standard',
          user_type: 'member',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to sync user to Intercom:', error);
      return;
    }

    const data = await response.json();

    // Save Intercom user ID back to database
    await supabase
      .from('profiles')
      .update({ intercom_user_id: data.id })
      .eq('id', userId);

    console.log('✅ User synced to Intercom:', data.id);
  } catch (error) {
    console.error('❌ Error syncing user to Intercom:', error);
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        version: '2.0',
        message: 'Intercom webhook handler is running',
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Log that we received the request
    console.log('📥 Webhook request received', {
      method: req.method,
      url: req.url,
      user_agent: req.headers.get('User-Agent'),
    });

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Intercom may use X-Hub-Signature-256 or X-Hub-Signature
    const signature256 = req.headers.get('X-Hub-Signature-256');
    const signature = req.headers.get('X-Hub-Signature');
    const signatureHeader = signature256 || signature;

    // Log headers for debugging
    console.log('📋 Request headers:', {
      'X-Hub-Signature-256': signature256 ? 'present' : 'missing',
      'X-Hub-Signature': signature ? 'present' : 'missing',
      'has_secret': !!INTERCOM_WEBHOOK_SECRET,
      'secret_length': INTERCOM_WEBHOOK_SECRET?.length || 0,
      'secret_set': INTERCOM_WEBHOOK_SECRET ? 'yes' : 'no',
      'user_agent': req.headers.get('User-Agent'),
      'body_length': rawBody.length,
    });

    // Verify webhook signature
    // Strategy: 
    // 1. If no signature header → allow (test requests from Intercom don't include signatures)
    // 2. If signature header present AND secret configured → verify
    // 3. If signature header present BUT secret not configured → allow (for testing)
    
    // Determine if we should verify signature
    const hasSecret = INTERCOM_WEBHOOK_SECRET && INTERCOM_WEBHOOK_SECRET.length > 0;
    const hasSignature = !!signatureHeader;
    
    console.log('🔍 Signature check decision:', {
      hasSignature,
      hasSecret,
      secretValue: INTERCOM_WEBHOOK_SECRET ? `[${INTERCOM_WEBHOOK_SECRET.length} chars]` : 'not set',
      signatureValue: signatureHeader ? `[${signatureHeader.length} chars]` : 'not set',
      willVerify: hasSignature && hasSecret,
      willAllow: !hasSignature || !hasSecret,
    });
    
    // Only verify if we have BOTH signature AND secret
    if (hasSignature && hasSecret) {
      // We have both signature and secret - verify it
      console.log('🔐 Verifying webhook signature...');
      try {
        const isValid = await verifyWebhookSignature(rawBody, signatureHeader);
        if (!isValid) {
          console.error('❌ Invalid webhook signature - REJECTING REQUEST', {
            received: signatureHeader?.substring(0, 20) + '...',
            hasSecret: hasSecret,
          });
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('✅ Signature verified - ALLOWING REQUEST');
      } catch (verifyError) {
        console.error('❌ Signature verification threw error:', verifyError);
        // On error, allow the request (fail open for testing)
        console.log('ℹ️ Allowing request despite verification error (test mode)');
      }
    } else {
      // No signature or no secret - allow request (for testing)
      if (hasSignature && !hasSecret) {
        console.log('ℹ️ Signature present but no secret - ALLOWING REQUEST (test mode)');
      } else if (!hasSignature) {
        console.log('ℹ️ No signature header - ALLOWING REQUEST (test request from Intercom)');
      } else {
        console.log('ℹ️ No secret configured - ALLOWING REQUEST (test mode)');
      }
    }
    
    console.log('✅ Request passed signature check, proceeding to process...');

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('❌ Failed to parse webhook payload:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let { type, data } = payload;

    // Intercom wraps events in notification_event structure
    // Extract the actual event if it's a notification_event
    if (type === 'notification_event' && data?.item) {
      console.log('📦 Unwrapping notification_event');
      console.log('📦 Nested event type:', data.item.type);
      console.log('📦 Nested event data keys:', Object.keys(data.item || {}));
      
      // The actual event type is in data.item.type
      // The actual event data IS data.item itself (not data.item.data)
      type = data.item.type;
      data = data.item; // The conversation object is directly in data.item
      
      console.log('📨 Extracted event type:', type);
      console.log('📦 Conversation data structure:', {
        hasId: !!data.id,
        hasConversationParts: !!data.conversation_parts,
        hasContacts: !!data.contacts,
        state: data.state,
      });
    }

    if (!type) {
      console.error('❌ Missing webhook type in payload');
      return new Response(
        JSON.stringify({ error: 'Missing webhook type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📨 Webhook received:', type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different webhook types
    switch (type) {
      case 'conversation.user.created':
        await handleConversationCreated(supabase, data);
        break;

      case 'conversation.user.replied':
        // Extract messageId from data if available
        const conversation = data.item || data.conversation || data;
        const conversationParts = conversation.conversation_parts?.conversation_parts || [];
        const userMessages = conversationParts.filter((part: any) => 
          part.part_type === 'comment' && part.author?.type === 'user'
        );
        const latestUserMsg = userMessages[userMessages.length - 1];
        const msgId = latestUserMsg?.id;
        await handleUserReply(supabase, data, msgId);
        break;

      case 'conversation.admin.replied':
        await handleAdminReply(supabase, data);
        break;

      case 'conversation.admin.assigned':
        await handleAdminAssigned(supabase, data);
        break;

      case 'conversation.admin.closed':
        await handleConversationClosed(supabase, data);
        break;

      case 'conversation':
        // Generic conversation event - check if there's a new user message
        await handleConversationEvent(supabase, data);
        break;

      default:
        console.log('ℹ️ Unhandled webhook type:', type);
        console.log('📦 Payload structure:', JSON.stringify({ type, dataKeys: Object.keys(data || {}) }, null, 2));
    }

    // Return 200 immediately (Intercom requires fast response)
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to prevent Intercom from retrying
    return new Response(
      JSON.stringify({ error: 'Error processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

