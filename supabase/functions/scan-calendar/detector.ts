/**
 * Core detection logic for identifying travel intent from calendar events
 */

import type { CalendarEvent, DetectionResult, ConfidenceFactors } from './types.ts';
import { calculateConfidence, generateReasoning } from './scorer.ts';
import {
  extractCityFromLocation,
  extractCityFromTitle,
  isSameCity,
} from './extractors.ts';
import { calculateDistance, calculateDuration, formatDate, parseDate } from './utils.ts';

/**
 * Keyword lists for detection
 */
const EXPLICIT_KEYWORDS = [
  'flight to',
  'flying to',
  'traveling to',
  'travelling to',
  'hotel in',
  'staying in',
  'arriving in',
  'departing to',
  'trip to',
  'travel to',
  'vacation in',
  'visiting',
];

const IMPLICIT_KEYWORDS = [
  'conference in',
  'summit in',
  'meeting in',
  'event in',
  'workshop in',
  'training in',
  'offsite in',
  'retreat in',
  'convention in',
];

const BUSINESS_INDICATORS = [
  'conference',
  'meeting',
  'business',
  'work',
  'client',
  'offsite',
  'training',
  'workshop',
  'summit',
  'convention',
];

const LEISURE_INDICATORS = [
  'vacation',
  'holiday',
  'leisure',
  'personal',
  'family',
  'wedding',
  'birthday',
  'celebration',
  'visiting',
];

/**
 * Exclusion keywords - events with these are likely NOT trips
 */
const EXCLUSION_KEYWORDS = [
  // Medical
  'doctor', 'dentist', 'dental', 'physician', 'clinic', 'hospital',
  'checkup', 'appointment', 'physical', 'therapy', 'chiropractor',
  'optometrist', 'ophthalmologist', 'podiatrist', 'dermatologist',
  
  // Local services
  'haircut', 'barber', 'salon', 'spa', 'massage', 'nail',
  'car wash', 'oil change', 'dmv', 'post office', 'bank',
  'grocery', 'shopping', 'errand', 'pickup', 'drop off',
  'pharmacy', 'pet store', 'dry cleaning',
  
  // Local food/drink
  'coffee', 'lunch', 'dinner', 'breakfast', 'brunch', 'drinks',
  'happy hour', 'takeout', 'pickup',
  
  // Local meetings (if no other travel indicators)
  'quick meeting', 'local meeting', 'office visit', 'team sync',
];

/**
 * Detect travel intent from a calendar event
 * Returns DetectionResult if confidence >= 50, null otherwise
 */
export function detectTravelIntent(
  event: CalendarEvent,
  homeCity: string | null
): DetectionResult | null {
  console.log(`\n=== Processing Event ===`);
  console.log(`Title: ${event.title || 'none'}`);
  console.log(`Location: ${event.location || 'none'}`);
  console.log(`Duration: ${event.start_time} to ${event.end_time}`);

  const factors: ConfidenceFactors = {
    explicit_keywords: false,
    implicit_keywords: false,
    location_mismatch: false,
    multi_day: false,
    long_duration: false,
  };

  // Normalize event data
  const title = (event.title || '').toLowerCase();
  const location = event.location || '';
  const locationLower = location.toLowerCase();
  const titleLower = title;

  // Early exit: check exclusion keywords first
  const hasExclusionKeyword = EXCLUSION_KEYWORDS.some(keyword =>
    titleLower.includes(keyword) || locationLower.includes(keyword)
  );

  if (hasExclusionKeyword) {
    // Only proceed if there are STRONG travel indicators
    const hasStrongTravelIndicator = EXPLICIT_KEYWORDS.some(kw => titleLower.includes(kw));

    if (!hasStrongTravelIndicator) {
      console.log(`SKIP: Exclusion keyword detected (${EXCLUSION_KEYWORDS.find(kw => titleLower.includes(kw) || locationLower.includes(kw))})`);
      return null;
    } else {
      console.log(`NOTE: Exclusion keyword found but strong travel indicator present, continuing...`);
    }
  }

  // Factor 1: Check for explicit travel keywords
  for (const keyword of EXPLICIT_KEYWORDS) {
    if (title.includes(keyword)) {
      factors.explicit_keywords = true;
      break;
    }
  }

  // Factor 2: Check for implicit travel keywords (only if not explicit)
  if (!factors.explicit_keywords) {
    for (const keyword of IMPLICIT_KEYWORDS) {
      if (title.includes(keyword)) {
        factors.implicit_keywords = true;
        break;
      }
    }
  }

  // Factor 3: Extract destination and check location mismatch
  let destinationCity: string | null = null;
  let destinationCountry: string | null = null;

  // Priority: If explicit travel keywords in title, prioritize title extraction
  // Otherwise, try location first (more reliable for addresses)
  if (factors.explicit_keywords && event.title) {
    // Explicit travel keywords - title is more reliable
    destinationCity = extractCityFromTitle(event.title);
    // Fall back to location if title didn't yield a city
    if (!destinationCity && location) {
      destinationCity = extractCityFromLocation(location);
    }
  } else {
    // No explicit keywords - try location first (more reliable for addresses)
    if (location) {
      destinationCity = extractCityFromLocation(location);
    }
    // Fall back to title if location didn't yield a city
    if (!destinationCity && event.title) {
      destinationCity = extractCityFromTitle(event.title);
    }
  }

  console.log(`Extracted destination city: ${destinationCity || 'none'}`);

  // Check if destination is different from home city
  if (destinationCity && homeCity) {
    if (!isSameCity(destinationCity, homeCity)) {
      const distance = calculateDistance(destinationCity, homeCity);
      console.log(`Distance from home (${homeCity}): ${distance} miles`);

      // If "different city" but < 20 miles, it's probably same metro area
      if (distance < 20) {
        console.log(`SKIP: Same metro area (distance=${distance}mi < 20mi)`);
        return null;
      }

      if (distance > 50) {
        // More than 50 miles away
        factors.location_mismatch = true;
      }
    } else {
      console.log(`Same city as home, no location mismatch`);
    }
  } else if (destinationCity && !homeCity) {
    // If we have a destination but no home city, assume it's a mismatch
    // (user might be traveling)
    factors.location_mismatch = true;
  }

  // Factor 4 & 5: Check event duration
  const startDate = parseDate(event.start_time);
  const endDate = parseDate(event.end_time);
  const durationDays = calculateDuration(startDate, endDate);
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  console.log(`Event duration: ${durationDays} days, ${durationHours.toFixed(1)} hours`);

  // Multi-day if duration >= 1 full day (not same day)
  if (durationDays >= 1) {
    factors.multi_day = true;
  } else if (durationHours > 4) {
    // Check if event is longer than 4 hours (but not multi-day)
    factors.long_duration = true;
  }

  // Calculate confidence score
  const confidence = calculateConfidence(factors);

  console.log(`Confidence factors:`);
  console.log(`  - Explicit keywords: ${factors.explicit_keywords}`);
  console.log(`  - Implicit keywords: ${factors.implicit_keywords}`);
  console.log(`  - Location mismatch: ${factors.location_mismatch}`);
  console.log(`  - Multi-day: ${factors.multi_day}`);
  console.log(`  - Long duration: ${factors.long_duration}`);
  console.log(`Final confidence: ${confidence}`);

  // If confidence is below threshold, return null
  if (confidence < 50) {
    console.log(`SKIP: Below threshold (confidence=${confidence} < 50)`);
    return null;
  }

  // Determine trip type
  let tripType: 'business' | 'leisure' | 'mixed' | 'unknown' = 'unknown';

  const hasBusiness = BUSINESS_INDICATORS.some((indicator) =>
    titleLower.includes(indicator)
  );
  const hasLeisure = LEISURE_INDICATORS.some((indicator) =>
    titleLower.includes(indicator)
  );

  if (hasBusiness && hasLeisure) {
    tripType = 'mixed';
  } else if (hasBusiness) {
    tripType = 'business';
  } else if (hasLeisure) {
    tripType = 'leisure';
  }

  // Calculate dates
  let startDateStr = formatDate(startDate);
  let endDateStr = formatDate(endDate);

  // If single-day event but high confidence, assume at least overnight
  if (startDateStr === endDateStr && confidence > 70) {
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
    endDateStr = formatDate(endDatePlusOne);
  }

  // Generate reasoning
  const reasoning = generateReasoning(factors, confidence);

  // Build destination string
  const destination = destinationCity
    ? destinationCity + (destinationCountry ? `, ${destinationCountry}` : '')
    : 'Unknown';

  console.log(`DETECTED: ${destination} (${confidence}% confidence, ${tripType})`);

  return {
    confidence,
    destination,
    destination_city: destinationCity,
    destination_country: destinationCountry,
    start_date: startDateStr,
    end_date: endDateStr,
    trip_type: tripType,
    metadata: {
      calendar_event_title: event.title || '',
      event_description: event.description || undefined,
      location_raw: location || undefined,
      detection_reasoning: reasoning,
      confidence_factors: factors,
      event_duration_days: durationDays,
    },
  };
}
