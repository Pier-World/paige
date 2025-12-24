/**
 * Process extracted booking data and create/update trips
 */

import type { ExtractedBooking } from './types.ts';

/**
 * Process extracted booking and create/update potential trips
 */
export async function processExtractedBooking(
  booking: ExtractedBooking,
  emailId: string,
  userId: string,
  supabase: any
): Promise<{ trip_created: boolean; trip_updated: boolean }> {
  let tripCreated = false;
  let tripUpdated = false;

  // Only process if we have dates and location
  if (!booking.dates.start || !booking.location.city) {
    console.log(
      `Insufficient data to create trip: start_date=${booking.dates.start}, city=${booking.location.city}`
    );
    return { trip_created: false, trip_updated: false };
  }

  // Determine end date (use start date if not provided)
  const endDate = booking.dates.end || booking.dates.start;

  console.log(
    `Processing booking: ${booking.type}, city=${booking.location.city}, dates=${booking.dates.start} to ${endDate}`
  );

  // Check if trip already exists (within 1 day of dates)
  const startDate = new Date(booking.dates.start);
  const dateRangeStart = new Date(startDate);
  dateRangeStart.setDate(dateRangeStart.getDate() - 1);
  const dateRangeEnd = new Date(startDate);
  dateRangeEnd.setDate(dateRangeEnd.getDate() + 1);

  const { data: existingTrips, error: checkError } = await supabase
    .from('potential_trips')
    .select('*')
    .eq('user_id', userId)
    .eq('destination_city', booking.location.city)
    .gte('start_date', formatDate(dateRangeStart))
    .lte('start_date', formatDate(dateRangeEnd))
    .not('status', 'in', '(dismissed,expired)');

  if (checkError) {
    console.error('Error checking for existing trips:', checkError);
    // Continue to create new trip
  }

  if (existingTrips && existingTrips.length > 0) {
    // Update existing trip
    const existingTrip = existingTrips[0];

    // Email confirmations are more authoritative than calendar detections
    // Always update if existing trip is from calendar, or if new confidence is higher
    const shouldUpdate =
      existingTrip.detection_source === 'calendar' ||
      booking.confidence > existingTrip.confidence_score;

    if (shouldUpdate) {
      console.log(
        `Updating existing trip: ${existingTrip.id}, confidence: ${existingTrip.confidence_score} -> ${booking.confidence}`
      );

      const { error: updateError } = await supabase
        .from('potential_trips')
        .update({
          confidence_score: Math.max(booking.confidence, existingTrip.confidence_score),
          detection_source: 'email', // Email confirmations are more authoritative
          source_email_id: emailId,
          status: 'confirmed', // Email confirmation = confirmed trip
          metadata: {
            ...existingTrip.metadata,
            email_confirmation: {
              type: booking.type,
              confirmation_code: booking.confirmation_code,
              cost: booking.cost,
              details: booking.details,
            },
            updated_from_email: emailId,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTrip.id);

      if (updateError) {
        console.error('Error updating trip:', updateError);
      } else {
        tripUpdated = true;
      }
    } else {
      console.log('Existing trip has higher confidence, skipping update');
    }

    // Link email_context to trip
    const { error: linkError } = await supabase
      .from('email_context')
      .update({ related_potential_trip_id: existingTrip.id })
      .eq('email_id', emailId);

    if (linkError) {
      console.error('Error linking email_context to trip:', linkError);
    }
  } else {
    // Create new trip
    console.log(`Creating new trip from email: ${booking.location.city}`);

    const { data: newTrip, error: insertError } = await supabase
      .from('potential_trips')
      .insert({
        user_id: userId,
        destination: booking.location.city + (booking.location.state ? `, ${booking.location.state}` : ''),
        destination_city: booking.location.city,
        destination_country: booking.location.country,
        start_date: booking.dates.start,
        end_date: endDate,
        detection_source: 'email',
        source_email_id: emailId,
        confidence_score: booking.confidence,
        trip_type: inferTripType(booking),
        metadata: {
          email_confirmation: {
            type: booking.type,
            confirmation_code: booking.confirmation_code,
            cost: booking.cost,
            details: booking.details,
          },
        },
        status: 'confirmed', // Email = confirmed
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating trip:', insertError);
    } else if (newTrip) {
      console.log(`Created new trip: ${newTrip.id}`);

      // Link email_context to new trip
      const { error: linkError } = await supabase
        .from('email_context')
        .update({ related_potential_trip_id: newTrip.id })
        .eq('email_id', emailId);

      if (linkError) {
        console.error('Error linking email_context to trip:', linkError);
      }

      tripCreated = true;
    }
  }

  // Mark email_context as processed
  await supabase
    .from('email_context')
    .update({ processed: true })
    .eq('email_id', emailId);

  return { trip_created: tripCreated, trip_updated: tripUpdated };
}

/**
 * Infer trip type from booking details
 */
function inferTripType(booking: ExtractedBooking): 'business' | 'leisure' | 'mixed' | 'unknown' {
  const detailsStr = JSON.stringify(booking.details).toLowerCase();
  const typeStr = booking.type.toLowerCase();

  const hasBusiness =
    detailsStr.includes('conference') ||
    detailsStr.includes('business') ||
    detailsStr.includes('meeting') ||
    typeStr === 'event';

  const hasLeisure =
    detailsStr.includes('vacation') ||
    detailsStr.includes('leisure') ||
    detailsStr.includes('resort') ||
    detailsStr.includes('beach') ||
    typeStr === 'restaurant';

  if (hasBusiness && hasLeisure) {
    return 'mixed';
  } else if (hasBusiness) {
    return 'business';
  } else if (hasLeisure) {
    return 'leisure';
  }

  return 'unknown';
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

