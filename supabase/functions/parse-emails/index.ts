/**
 * Email Parser Edge Function
 * 
 * Scans emails table for unprocessed travel-related emails and extracts
 * structured booking data using GPT-4, then creates/updates potential trips.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractBookingData } from './extractor.ts';
import { processExtractedBooking } from './processor.ts';
import type { EmailToProcess, ParseResult } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  // Create Supabase client inside handler
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse request body
    let userId: string | null = null;
    let daysBack = 90;
    let limit = 50;

    try {
      const body = await req.json();
      userId = body.user_id || body.userId;
      daysBack = body.days_back || 90;
      limit = body.limit || 50;
    } catch {
      // Try URL params as fallback
      const url = new URL(req.url);
      userId = url.searchParams.get('user_id') || url.searchParams.get('userId');
      daysBack = parseInt(url.searchParams.get('days_back') || '90');
      limit = parseInt(url.searchParams.get('limit') || '50');
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing user_id parameter',
          emails_processed: 0,
          bookings_found: 0,
          trips_created: 0,
          trips_updated: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid user_id format',
          emails_processed: 0,
          bookings_found: 0,
          trips_created: 0,
          trips_updated: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[parse-emails] Starting email parse for user: ${userId}`);
    console.log(`[parse-emails] Parameters: days_back=${daysBack}, limit=${limit}`);

    // Query emails for travel-related parsing
    // Strategy: Look for emails that either:
    // 1. Haven't been processed by parse-emails (no email_context record)
    // 2. Are travel-related (category = travel_confirmation or likely travel-related)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // First, get emails that might be travel-related
    // We'll check if they have email_context records separately
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id, user_id, gmail_message_id, subject, from_address, body_preview, received_at, category, extracted_data')
      .eq('user_id', userId)
      .gte('received_at', cutoffDate.toISOString())
      .or('category.eq.travel_confirmation,category.is.null,category.neq.spam')
      .order('received_at', { ascending: false })
      .limit(limit);

    if (emailsError) {
      console.error(`[parse-emails] Error fetching emails:`, emailsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch emails',
          emails_processed: 0,
          bookings_found: 0,
          trips_created: 0,
          trips_updated: 0,
          errors: [{ email_id: 'unknown', error: emailsError.message }],
          execution_time_ms: Date.now() - startTime,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailsList = (emails || []) as EmailToProcess[];

    if (emailsList.length === 0) {
      console.log(`[parse-emails] No emails found in date range`);
      return new Response(
        JSON.stringify({
          success: true,
          emails_processed: 0,
          bookings_found: 0,
          trips_created: 0,
          trips_updated: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime,
        } as ParseResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Filter out emails that already have email_context records (already processed by parse-emails)
    const { data: existingContexts } = await supabase
      .from('email_context')
      .select('email_id')
      .eq('user_id', userId)
      .in('email_id', emailsList.map(e => e.id));

    const existingEmailIds = new Set((existingContexts || []).map(ec => ec.email_id));
    const emailsToProcess = emailsList.filter(email => !existingEmailIds.has(email.id));

    if (emailsToProcess.length === 0) {
      console.log(`[parse-emails] All ${emailsList.length} emails already have email_context records`);
      return new Response(
        JSON.stringify({
          success: true,
          emails_processed: 0,
          bookings_found: 0,
          trips_created: 0,
          trips_updated: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime,
        } as ParseResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[parse-emails] Found ${emailsToProcess.length} emails to process (${emailsList.length} total, ${existingEmailIds.size} already processed)`);

    console.log(`[parse-emails] Found ${emailsList.length} unprocessed emails`);

    let bookingsFound = 0;
    let tripsCreated = 0;
    let tripsUpdated = 0;
    const errors: Array<{ email_id: string; error: string }> = [];

    // Process each email
    for (const email of emailsToProcess) {
      try {
        console.log(`[parse-emails] Processing email: ${email.subject || email.id}`);

        // Extract booking data using GPT-4
        const extracted = await extractBookingData(email, supabase);

        if (extracted.type !== 'unknown' && extracted.confidence >= 60) {
          console.log(
            `[parse-emails] Found booking: type=${extracted.type}, confidence=${extracted.confidence}`
          );
          bookingsFound++;

          // Process the extracted booking
          const result = await processExtractedBooking(
            extracted,
            email.id,
            email.user_id,
            supabase
          );

          if (result.trip_created) tripsCreated++;
          if (result.trip_updated) tripsUpdated++;
        } else {
          console.log(
            `[parse-emails] Skipped: type=${extracted.type}, confidence=${extracted.confidence}`
          );
        }

        // Don't mark email as processed in emails table
        // The email_context record indicates it's been processed by parse-emails
        // The emails table 'processed' flag is for gmail-sync classification
      } catch (error) {
        console.error(`[parse-emails] Error processing email ${email.id}:`, error);
        errors.push({
          email_id: email.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue processing other emails
      }
    }

    const executionTime = Date.now() - startTime;
    const result: ParseResult = {
      success: errors.length === 0,
      emails_processed: emailsToProcess.length,
      bookings_found: bookingsFound,
      trips_created: tripsCreated,
      trips_updated: tripsUpdated,
      errors,
      execution_time_ms: executionTime,
    };

    console.log(
      `[parse-emails] Parse complete: ${bookingsFound} bookings found, ${tripsCreated} trips created, ${tripsUpdated} trips updated, ${errors.length} errors`
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[parse-emails] Fatal error:`, error);
    const result: ParseResult = {
      success: false,
      emails_processed: 0,
      bookings_found: 0,
      trips_created: 0,
      trips_updated: 0,
      errors: [
        {
          email_id: 'unknown',
          error: error instanceof Error ? error.message : String(error),
        },
      ],
      execution_time_ms: Date.now() - startTime,
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

