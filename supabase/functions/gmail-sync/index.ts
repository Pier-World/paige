import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type definitions (inlined from _shared/types.ts)
interface GmailMessage {
  id: string;
  threadId: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
    }>;
  };
}

interface TravelConfirmation {
  confirmation_number?: string;
  airline?: string;
  hotel?: string;
  flight_number?: string;
  from?: string;
  to?: string;
  destination?: string;
  departure?: string;
  arrival?: string;
  check_in?: string;
  check_out?: string;
}

interface EmailCategory {
  category: 'travel_confirmation' | 'receipt' | 'other';
  extracted_data?: TravelConfirmation;
}

// Encryption utilities (inlined from _shared/encryption.ts)
const ENCRYPTION_KEY_RAW = Deno.env.get('MASTER_ENCRYPTION_KEY');
let encryptionKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (encryptionKey) {
    return encryptionKey;
  }

  if (!ENCRYPTION_KEY_RAW) {
    throw new Error('MASTER_ENCRYPTION_KEY environment variable is required');
  }

  try {
    let keyBytes: Uint8Array;
    try {
      const decoded = Uint8Array.from(atob(ENCRYPTION_KEY_RAW), (c) => c.charCodeAt(0));
      keyBytes = decoded;
    } catch {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(ENCRYPTION_KEY_RAW);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      keyBytes = new Uint8Array(hashBuffer);
    }

    if (keyBytes.length !== 32) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes);
      keyBytes = new Uint8Array(hashBuffer.slice(0, 32));
    }

    encryptionKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    return encryptionKey;
  } catch (error) {
    throw new Error(`Failed to initialize encryption key: ${error.message}`);
  }
}

async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';

  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    const base64 = btoa(String.fromCharCode(...combined));
    return base64;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';

  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

// Google OAuth utilities (inlined from _shared/google-oauth.ts)
async function getValidGoogleToken(
  userId: string,
  provider: 'google_gmail' | 'google_calendar'
): Promise<string> {
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !integration) {
    throw new Error(`No ${provider} integration found: ${error?.message || 'Not found'}`);
  }

  if (!integration.access_token || !integration.refresh_token) {
    throw new Error(`Invalid ${provider} integration: missing tokens`);
  }

  const now = new Date();
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;

  if (!expiresAt || now >= expiresAt) {
    const refreshToken = await decrypt(integration.refresh_token);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to refresh token: ${errorData}`);
    }

    const newTokenData = await response.json();
    const encryptedToken = await encrypt(newTokenData.access_token);
    await supabase
      .from('integrations')
      .update({
        access_token: encryptedToken,
        expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return newTokenData.access_token;
  }

  return await decrypt(integration.access_token);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, action } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'init') {
      return await initialSync(userId);
    } else if (action === 'webhook') {
      return await handleWebhook(req);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "init" or "webhook"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Gmail sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function initialSync(userId: string) {
  try {
    const token = await getValidGoogleToken(userId, 'google_gmail');

    // Get messages from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const query = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gmail API error: ${errorText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    // Process each message
    let processedCount = 0;
    for (const message of messages) {
      try {
        await processEmail(userId, message.id, token);
        processedCount++;
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    // Update last_sync_at
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google_gmail');

    return new Response(
      JSON.stringify({ success: true, messagesProcessed: processedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Initial sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function processEmail(userId: string, messageId: string, token: string) {
  // Fetch full message
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch message: ${response.statusText}`);
  }

  const message: GmailMessage = await response.json();

  // Extract headers
  const headers = message.payload.headers;
  const subject = headers.find((h) => h.name === 'Subject')?.value || '';
  const from = headers.find((h) => h.name === 'From')?.value || '';
  const dateHeader = headers.find((h) => h.name === 'Date')?.value;

  // Extract body (simplified - handles plain text)
  let bodyPreview = '';
  if (message.payload.body?.data) {
    bodyPreview = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (message.payload.parts) {
    // Try to get text from parts
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyPreview = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        break;
      }
    }
  }

  // Parse date
  const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

  // Store in emails table
  const { error: insertError } = await supabase.from('emails').upsert({
    user_id: userId,
    gmail_message_id: message.id,
    gmail_thread_id: message.threadId,
    subject,
    from_address: from,
    received_at: receivedAt,
    body_preview: bodyPreview.substring(0, 500),
    processed: false,
  }, {
    onConflict: 'user_id,gmail_message_id',
  });

  if (insertError) {
    console.error('Error inserting email:', insertError);
    // Return early - don't proceed with classification if email wasn't stored
    throw new Error(`Failed to store email ${message.id}: ${insertError.message}`);
  }

  // Classify and extract (call GPT-4)
  // Only proceed if email was successfully stored
  await classifyAndExtract(userId, message.id, subject, bodyPreview);
}

async function classifyAndExtract(
  userId: string,
  emailId: string,
  subject: string,
  body: string
) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    console.warn('OPENAI_API_KEY not set, skipping classification');
    return;
  }

  try {
    // Call OpenAI to classify email
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an email classifier. Classify emails as:
- travel_confirmation: Flight, hotel, car rental confirmations
- receipt: Purchase receipts
- other: Everything else

If travel_confirmation, extract: confirmation_number, airline/hotel, flight_number (if flight), from/to locations, departure/arrival times.

Return JSON: { "category": "...", "extracted_data": {...} }`,
          },
          {
            role: 'user',
            content: `Subject: ${subject}\n\nBody: ${body.substring(0, 1000)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const result = await openaiResponse.json();
    const content = result.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const classification: EmailCategory = JSON.parse(content);

    // Update email record
    await supabase
      .from('emails')
      .update({
        category: classification.category,
        extracted_data: classification.extracted_data || {},
        processed: true,
      })
      .eq('gmail_message_id', emailId);

    // If travel confirmation, create entities
    if (classification.category === 'travel_confirmation' && classification.extracted_data) {
      await createTravelEntities(userId, classification.extracted_data, emailId);
    }
  } catch (error) {
    console.error('Classification error:', error);
    // Mark as processed even if classification failed
    await supabase
      .from('emails')
      .update({ processed: true })
      .eq('gmail_message_id', emailId);
  }
}

async function createTravelEntities(
  userId: string,
  data: TravelConfirmation,
  sourceEmailId: string
) {
  try {
    // Create booking entity
    const entityType = data.flight_number ? 'flight' : 'hotel';
    const { data: booking, error: bookingError } = await supabase
      .from('entities')
      .insert({
        user_id: userId,
        entity_type: entityType,
        data: data,
        source: 'gmail',
        source_id: sourceEmailId,
        confidence: 0.9,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking entity:', bookingError);
      return;
    }

    // Create or link to trip entity
    // (Simplified - in reality, you'd match dates/destinations to existing trips)
    const tripName = `Trip to ${data.to || data.destination || 'Unknown'}`;
    const { data: trip, error: tripError } = await supabase
      .from('entities')
      .insert({
        user_id: userId,
        entity_type: 'trip',
        data: {
          name: tripName,
          start_date: data.departure || data.check_in,
          end_date: data.arrival || data.check_out,
          destinations: [data.to || data.destination],
        },
        source: 'gmail',
        source_id: sourceEmailId,
        confidence: 0.8,
      })
      .select()
      .single();

    if (tripError) {
      console.error('Error creating trip entity:', tripError);
      return;
    }

    // Create relationship
    if (booking && trip) {
      await supabase.from('relationships').insert({
        user_id: userId,
        from_entity_id: trip.id,
        to_entity_id: booking.id,
        relationship_type: 'includes',
      });
    }
  } catch (error) {
    console.error('Error creating travel entities:', error);
  }
}

async function handleWebhook(req: Request) {
  // Handle Gmail push notification
  // (Implementation depends on your Pub/Sub setup)
  // For MVP, we'll just acknowledge receipt
  const body = await req.json();
  console.log('Gmail webhook received:', body);

  // TODO: Process webhook data and sync new emails
  return new Response(
    JSON.stringify({ received: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

