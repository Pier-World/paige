/**
 * GPT-4 extraction logic for travel booking data
 */

import type { EmailToProcess, ExtractedBooking } from './types.ts';

/**
 * Extract booking data from email using GPT-4
 */
export async function extractBookingData(
  email: EmailToProcess,
  supabase: any
): Promise<ExtractedBooking> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set');
    return createUnknownBooking();
  }

  // Construct email content for GPT-4
  const emailContent = `
Subject: ${email.subject || 'No subject'}
From: ${email.from_address || 'Unknown sender'}
Date: ${email.received_at}

${email.body_preview || 'No preview available'}
  `.trim();

  const prompt = `You are a travel booking data extractor. Analyze this email and extract structured travel information.

EMAIL CONTENT:
${emailContent}

Extract the following information and return ONLY valid JSON (no markdown, no explanation):

{
  "type": "flight" | "hotel" | "car" | "event" | "restaurant" | "unknown",
  "confidence": 0-100,
  "confirmation_code": "string or null",
  "dates": {
    "start": "YYYY-MM-DD or null",
    "end": "YYYY-MM-DD or null"
  },
  "location": {
    "city": "string or null",
    "state": "string or null",
    "country": "string or null",
    "airport_code": "string or null (flights only)",
    "address": "string or null (hotels only)"
  },
  "cost": {
    "amount": number or null,
    "currency": "string or null"
  },
  "details": {
    "airline": "string (flights)",
    "flight_number": "string (flights)",
    "hotel_name": "string (hotels)",
    "passenger_name": "string",
    "guest_name": "string",
    "event_name": "string (events)"
  }
}

RULES:
- If this is not a travel confirmation, return {"type": "unknown", "confidence": 0}
- Confidence 90-100: Explicit confirmation with all key details
- Confidence 70-89: Clear confirmation but missing some details
- Confidence 50-69: Possible confirmation but ambiguous
- Confidence 0-49: Not a travel confirmation
- Always return valid JSON
- Use ISO date format (YYYY-MM-DD)
- Extract actual dates, not placeholders
- If dates are relative (e.g., "tomorrow"), calculate actual date based on email received_at: ${email.received_at}`;

  try {
    console.log(`Calling OpenAI API for email: ${email.subject}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper and faster for this task
        messages: [
          {
            role: 'system',
            content:
              'You are a travel booking data extraction assistant. Return only valid JSON, no markdown, no explanations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse JSON (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const extracted: ExtractedBooking = JSON.parse(jsonStr);

    // Validate extracted data
    if (!extracted.type || typeof extracted.confidence !== 'number') {
      throw new Error('Invalid extraction format');
    }

    console.log(
      `Extracted booking: type=${extracted.type}, confidence=${extracted.confidence}, city=${extracted.location.city}`
    );

    // Store extraction in email_context table
    const { error: insertError } = await supabase.from('email_context').insert({
      user_id: email.user_id,
      email_id: email.id,
      gmail_message_id: email.gmail_message_id,
      confirmation_type: extracted.type,
      confirmation_code: extracted.confirmation_code,
      parsed_data: {
        airline: extracted.details.airline,
        flight_number: extracted.details.flight_number,
        departure: extracted.location.airport_code
          ? {
              airport: extracted.location.airport_code,
              city: extracted.location.city,
              datetime: extracted.dates.start
                ? `${extracted.dates.start}T00:00:00Z`
                : null,
            }
          : undefined,
        arrival: extracted.location.airport_code
          ? {
              airport: extracted.location.airport_code,
              city: extracted.location.city,
              datetime: extracted.dates.end
                ? `${extracted.dates.end}T00:00:00Z`
                : null,
            }
          : undefined,
        hotel_name: extracted.details.hotel_name,
        check_in: extracted.dates.start,
        check_out: extracted.dates.end,
        passenger: extracted.details.passenger_name
          ? {
              name: extracted.details.passenger_name,
              email: email.from_address || null,
            }
          : undefined,
        cost: extracted.cost.amount
          ? {
              amount: extracted.cost.amount,
              currency: extracted.cost.currency || 'USD',
            }
          : undefined,
        ...extracted.details,
      },
      extraction_confidence: extracted.confidence,
      extraction_method: 'gpt4',
      extraction_errors: null,
      processed: false,
    });

    if (insertError) {
      console.error('Error storing email_context:', insertError);
      // Continue anyway - we still have the extracted data
    }

    return extracted;
  } catch (error) {
    console.error('Extraction error:', error);

    // Store error in email_context if possible
    try {
      await supabase.from('email_context').insert({
        user_id: email.user_id,
        email_id: email.id,
        gmail_message_id: email.gmail_message_id,
        confirmation_type: 'unknown',
        confirmation_code: null,
        parsed_data: {},
        extraction_confidence: 0,
        extraction_method: 'gpt4',
        extraction_errors: [error instanceof Error ? error.message : String(error)],
        processed: false,
      });
    } catch (insertError) {
      console.error('Error storing extraction error:', insertError);
    }

    return createUnknownBooking();
  }
}

/**
 * Create a default "unknown" booking result
 */
function createUnknownBooking(): ExtractedBooking {
  return {
    type: 'unknown',
    confidence: 0,
    confirmation_code: null,
    dates: { start: null, end: null },
    location: {
      city: null,
      state: null,
      country: null,
      airport_code: null,
      address: null,
    },
    cost: { amount: null, currency: null },
    details: {},
  };
}

