/**
 * Calendar Scanner Edge Function
 * 
 * Scans user's calendar events for the next 30 days and detects potential trips.
 * Creates records in potential_trips table for trips with confidence >= 50.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { CalendarEvent, ScanResult, UserProfile } from './types.ts';
import { detectTravelIntent } from './detector.ts';
import { isDuplicate, formatDate, parseDate } from './utils.ts';
import { normalizeCity } from './extractors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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
  let tripsDetected = 0;
  let tripsUpdated = 0;
  let tripsNeedingReview = 0;
  const errors: Array<{ event_id: string; error: string }> = [];

  try {
    // Parse request body
    let userId: string | null = null;

    try {
      const body = await req.json();
      userId = body.user_id || body.userId;
    } catch {
      // Try URL params as fallback
      const url = new URL(req.url);
      userId = url.searchParams.get('user_id') || url.searchParams.get('userId');
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing user_id parameter',
          trips_detected: 0,
          trips_updated: 0,
          events_processed: 0,
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
          trips_detected: 0,
          trips_updated: 0,
          events_processed: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[scan-calendar] Starting scan for user: ${userId}`);

    // Step 1: Get user's home city from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, personal_context, travel_preferences')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error(`[scan-calendar] Error fetching profile:`, profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User profile not found',
          trips_detected: 0,
          trips_updated: 0,
          events_processed: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract home city
    const homeCity =
      profile.personal_context?.home_location?.city ||
      profile.travel_preferences?.home_city ||
      null;

    console.log(`[scan-calendar] User home city: ${homeCity || 'not set'}`);

    // Step 2: Get calendar events for next 30 days
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', now.toISOString())
      .lte('start_time', endDate.toISOString())
      .eq('status', 'confirmed')
      .order('start_time', { ascending: true });

    if (eventsError) {
      console.error(`[scan-calendar] Error fetching events:`, eventsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch calendar events',
          trips_detected: 0,
          trips_updated: 0,
          events_processed: 0,
          errors: [{ event_id: 'unknown', error: eventsError.message }],
          execution_time_ms: Date.now() - startTime,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const eventsList = (events || []) as CalendarEvent[];
    console.log(`[scan-calendar] Found ${eventsList.length} calendar events to process`);

    // Step 3: Process each event
    for (const event of eventsList) {
      try {
        console.log(`[scan-calendar] Processing event: ${event.title || event.id}`);

        // Detect travel intent
        const detectionResult = detectTravelIntent(event, homeCity);

        if (!detectionResult) {
          // Confidence too low, skip
          continue;
        }

        console.log(
          `[scan-calendar] Detected trip: ${detectionResult.destination_city} (confidence: ${detectionResult.confidence})`
        );

        // Step 4: Check for duplicates
        const startDate = parseDate(detectionResult.start_date);
        const dateRangeStart = new Date(startDate);
        dateRangeStart.setDate(dateRangeStart.getDate() - 1);
        const dateRangeEnd = new Date(startDate);
        dateRangeEnd.setDate(dateRangeEnd.getDate() + 1);

        const { data: existingTrip, error: checkError } = await supabase
          .from('potential_trips')
          .select('*')
          .eq('user_id', userId)
          .eq('destination_city', detectionResult.destination_city)
          .gte('start_date', formatDate(dateRangeStart))
          .lte('start_date', formatDate(dateRangeEnd))
          .not('status', 'in', '(dismissed,expired)')
          .maybeSingle();

        if (checkError) {
          console.error(
            `[scan-calendar] Error checking for duplicates:`,
            checkError
          );
          errors.push({
            event_id: event.id,
            error: `Duplicate check failed: ${checkError.message}`,
          });
          continue;
        }

        if (existingTrip) {
          // Update if new confidence is higher
          if (detectionResult.confidence > existingTrip.confidence_score) {
            console.log(
              `[scan-calendar] Updating existing trip (confidence: ${existingTrip.confidence_score} -> ${detectionResult.confidence})`
            );

            const { error: updateError } = await supabase
              .from('potential_trips')
              .update({
                confidence_score: detectionResult.confidence,
                metadata: {
                  ...existingTrip.metadata,
                  ...detectionResult.metadata,
                  updated_from_event: event.id,
                  updated_at: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingTrip.id);

            if (updateError) {
              console.error(
                `[scan-calendar] Error updating trip:`,
                updateError
              );
              errors.push({
                event_id: event.id,
                error: `Update failed: ${updateError.message}`,
              });
            } else {
              tripsUpdated++;
            }
          } else {
            console.log(
              `[scan-calendar] Existing trip has higher confidence, skipping`
            );
          }
          continue;
        }

        // Step 5: Check if actual trip/booking already exists
        const { count: bookingCount, error: bookingCheckError } = await supabase
          .from('entities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('entity_type', 'trip')
          .eq('data->>destination', detectionResult.destination_city)
          .eq('data->>start_date', detectionResult.start_date);

        if (bookingCheckError) {
          console.error(
            `[scan-calendar] Error checking for existing bookings:`,
            bookingCheckError
          );
          // Continue anyway - don't block on this check
        }

        if (bookingCount && bookingCount > 0) {
          console.log(
            `[scan-calendar] Trip already booked, skipping detection`
          );
          continue;
        }

        // Step 6: Create new potential trip based on confidence
        if (detectionResult.confidence >= 60) {
          // High enough confidence to auto-detect
          console.log(
            `[scan-calendar] Creating new potential trip (high confidence): ${detectionResult.destination_city}`
          );

          const { data: newTrip, error: insertError } = await supabase
            .from('potential_trips')
            .insert({
              user_id: userId,
              destination: detectionResult.destination,
              destination_city: detectionResult.destination_city,
              destination_country: detectionResult.destination_country,
              start_date: detectionResult.start_date,
              end_date: detectionResult.end_date,
              detection_source: 'calendar',
              source_event_id: event.id,
              confidence_score: detectionResult.confidence,
              trip_type: detectionResult.trip_type,
              metadata: detectionResult.metadata,
              status: 'detected',
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[scan-calendar] Error inserting trip:`, insertError);
            errors.push({
              event_id: event.id,
              error: `Insert failed: ${insertError.message}`,
            });
          } else {
            tripsDetected++;
            console.log(
              `[scan-calendar] Created potential trip: ${newTrip?.id}`
            );
          }
        } else if (detectionResult.confidence >= 50) {
          // Borderline confidence - create as "needs_review" status
          console.log(
            `[scan-calendar] Creating trip needing review (low confidence): ${detectionResult.destination_city}`
          );

          const { data: newTrip, error: insertError } = await supabase
            .from('potential_trips')
            .insert({
              user_id: userId,
              destination: detectionResult.destination,
              destination_city: detectionResult.destination_city,
              destination_country: detectionResult.destination_country,
              start_date: detectionResult.start_date,
              end_date: detectionResult.end_date,
              detection_source: 'calendar',
              source_event_id: event.id,
              confidence_score: detectionResult.confidence,
              trip_type: detectionResult.trip_type,
              metadata: {
                ...detectionResult.metadata,
                review_reason: 'Low confidence detection (50-59%). Please verify.',
              },
              status: 'detected', // Keep as 'detected' since 'needs_review' isn't in the schema yet
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[scan-calendar] Error inserting trip:`, insertError);
            errors.push({
              event_id: event.id,
              error: `Insert failed: ${insertError.message}`,
            });
          } else {
            tripsNeedingReview++;
            console.log(
              `[scan-calendar] Created trip needing review: ${newTrip?.id}`
            );
          }
        } else {
          // Below 50 - skip entirely
          console.log(
            `[scan-calendar] Skipping event (low confidence): ${event.title}, confidence=${detectionResult.confidence}`
          );
        }
      } catch (error) {
        console.error(`[scan-calendar] Error processing event ${event.id}:`, error);
        errors.push({
          event_id: event.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue processing other events
      }
    }

    const executionTime = Date.now() - startTime;
    const result: ScanResult = {
      success: errors.length === 0,
      trips_detected: tripsDetected,
      trips_updated: tripsUpdated,
      trips_needing_review: tripsNeedingReview,
      events_processed: eventsList.length,
      errors,
      execution_time_ms: executionTime,
    };

    console.log(
      `[scan-calendar] Scan complete: ${tripsDetected} detected (≥60%), ${tripsNeedingReview} need review (50-59%), ${tripsUpdated} updated, ${errors.length} errors`
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[scan-calendar] Fatal error:`, error);
    const result: ScanResult = {
      success: false,
      trips_detected: 0,
      trips_updated: 0,
      events_processed: 0,
      errors: [
        {
          event_id: 'unknown',
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

