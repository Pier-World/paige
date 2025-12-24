/**
 * TypeScript interfaces for calendar scanner Edge Function
 */

/**
 * Calendar event from the database
 */
export interface CalendarEvent {
  id: string;
  user_id: string;
  gcal_event_id: string;
  gcal_calendar_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  time_zone: string | null;
  status: string | null;
  related_trip_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Result of travel intent detection
 */
export interface DetectionResult {
  confidence: number; // 0-100
  destination: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  trip_type: 'business' | 'leisure' | 'mixed' | 'unknown';
  metadata: {
    calendar_event_title: string;
    event_description?: string;
    location_raw?: string;
    detection_reasoning: string;
    confidence_factors: ConfidenceFactors;
    event_duration_days: number;
  };
}

/**
 * Factors that contribute to confidence scoring
 */
export interface ConfidenceFactors {
  explicit_keywords: boolean;
  implicit_keywords: boolean;
  location_mismatch: boolean;
  multi_day: boolean;
  long_duration: boolean;
}

/**
 * Result of the entire scan operation
 */
export interface ScanResult {
  success: boolean;
  trips_detected: number;
  trips_updated: number;
  trips_needing_review?: number;
  events_processed: number;
  errors: Array<{ event_id: string; error: string }>;
  execution_time_ms: number;
}

/**
 * User profile with home location
 */
export interface UserProfile {
  id: string;
  personal_context?: {
    home_location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  travel_preferences?: {
    home_city?: string;
    home_airport?: string;
  };
}

