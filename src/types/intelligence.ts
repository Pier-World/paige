/**
 * TypeScript interfaces for Phase 1: Proactive Intelligence system
 * 
 * These types correspond to the database tables created in the Phase 1 migration:
 * - potential_trips: Trips detected from calendar and email analysis
 * - email_context: Parsed travel confirmations from emails
 * - user_patterns: Learned user preferences and behavior patterns
 * - opportunities: Generated proactive suggestions for users
 * - daily_briefs: Daily AI-generated summaries
 * 
 * @see src/types/database-generated.ts for auto-generated Supabase types
 */

// =====================================================
// DATABASE TABLE INTERFACES
// =====================================================

/**
 * Represents a potential trip detected from calendar events or email analysis.
 * 
 * @example
 * ```typescript
 * const trip: PotentialTrip = {
 *   id: "123e4567-e89b-12d3-a456-426614174000",
 *   user_id: "user-123",
 *   destination: "Austin, TX",
 *   destination_city: "Austin",
 *   destination_country: "USA",
 *   start_date: "2024-02-15",
 *   end_date: "2024-02-18",
 *   detection_source: "calendar",
 *   confidence_score: 85,
 *   status: "detected"
 * };
 * ```
 */
export interface PotentialTrip {
  id: string;
  user_id: string;
  destination: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string; // ISO date string
  end_date: string;
  detection_source: 'calendar' | 'email' | 'manual';
  source_event_id: string | null;
  source_email_id: string | null;
  confidence_score: number; // 0-100
  trip_type: 'business' | 'leisure' | 'mixed' | 'unknown' | null;
  metadata: {
    calendar_event_title?: string;
    event_description?: string;
    location_raw?: string;
    attendees?: string[];
    detection_reasoning?: string;
    confidence_factors?: {
      explicit_travel_keywords?: boolean;
      multi_day_event?: boolean;
      location_mismatch?: boolean;
    };
    [key: string]: any;
  };
  status: 'detected' | 'confirmed' | 'booking_in_progress' | 'booked' | 'dismissed' | 'expired';
  related_trip_id: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

/**
 * Represents parsed travel confirmation data extracted from emails.
 * 
 * Stores structured data extracted from flight, hotel, car rental, and event confirmation emails.
 * The parsed_data field contains type-specific information based on confirmation_type.
 * 
 * @example
 * ```typescript
 * const emailCtx: EmailContext = {
 *   id: "email-123",
 *   user_id: "user-123",
 *   email_id: "email-456",
 *   confirmation_type: "flight",
 *   confirmation_code: "ABC123",
 *   parsed_data: {
 *     airline: "United Airlines",
 *     flight_number: "UA1234",
 *     departure: { airport: "SFO", city: "San Francisco" }
 *   }
 * };
 * ```
 */
export interface EmailContext {
  id: string;
  user_id: string;
  email_id: string;
  gmail_message_id: string | null;
  confirmation_type: 'flight' | 'hotel' | 'car' | 'event' | 'restaurant' | 'other';
  confirmation_code: string | null;
  parsed_data: {
    airline?: string;
    flight_number?: string;
    departure?: {
      airport?: string;
      city?: string;
      datetime?: string;
    };
    arrival?: {
      airport?: string;
      city?: string;
      datetime?: string;
    };
    hotel_name?: string;
    check_in?: string;
    check_out?: string;
    passenger?: {
      name?: string;
      email?: string;
    };
    cost?: {
      amount?: number;
      currency?: string;
    };
    [key: string]: any;
  };
  extraction_confidence: number | null; // 0-100
  extraction_method: string;
  extraction_errors: string[] | null;
  processed: boolean;
  related_potential_trip_id: string | null;
  parsed_at: string;
  created_at: string;
}

/**
 * Represents a learned user behavior pattern or preference.
 * 
 * Patterns are discovered through analysis of booking history, search behavior,
 * and user interactions. Each pattern has a confidence score and strength indicator.
 * 
 * @example
 * ```typescript
 * const pattern: UserPattern = {
 *   id: "pattern-123",
 *   user_id: "user-123",
 *   pattern_type: "airline_preference",
 *   pattern_data: { airline: "United", percentage: 73 },
 *   confidence_score: 85,
 *   observation_count: 12,
 *   pattern_strength: "strong"
 * };
 * ```
 */
export interface UserPattern {
  id: string;
  user_id: string;
  pattern_type:
    | 'airline_preference'
    | 'hotel_tier'
    | 'booking_timing'
    | 'seat_preference'
    | 'price_sensitivity'
    | 'destination_frequency'
    | 'travel_day_preference'
    | 'booking_window'
    | 'amenity_preference'
    | 'loyalty_usage'
    | 'other';
  pattern_data: {
    airline?: string;
    percentage?: number;
    preferred_stars?: number;
    avg_spend?: number;
    days_before_trip?: number;
    time_of_day?: string;
    [key: string]: any;
  };
  confidence_score: number; // 0-100
  observation_count: number;
  pattern_strength: 'weak' | 'moderate' | 'strong' | 'very_strong' | null;
  last_observed: string;
  first_observed: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a proactive suggestion generated for the user.
 * 
 * Opportunities are scored across four dimensions (confidence, urgency, impact, risk)
 * and classified into tiers: "action_needed", "prepared", or "opportunity".
 * 
 * @example
 * ```typescript
 * const opp: Opportunity = {
 *   id: "opp-123",
 *   user_id: "user-123",
 *   type: "trip_gap",
 *   title: "Book flight to Austin",
 *   description: "Your trip is in 5 days and you haven't booked a flight yet",
 *   confidence_score: 90,
 *   urgency_score: 85,
 *   impact_score: 70,
 *   risk_score: 30,
 *   tier: "action_needed",
 *   status: "pending"
 * };
 * ```
 */
export interface Opportunity {
  id: string;
  user_id: string;
  type:
    | 'trip_gap'
    | 'price_drop'
    | 'preparation'
    | 'upgrade'
    | 'expiring_benefit'
    | 'optimization'
    | 'reminder'
    | 'other';
  title: string;
  description: string;
  confidence_score: number; // 0-100
  urgency_score: number; // 0-100
  impact_score: number; // 0-100
  risk_score: number; // 0-100
  tier: 'action_needed' | 'prepared' | 'opportunity';
  status: 'pending' | 'shown' | 'approved' | 'dismissed' | 'snoozed' | 'expired' | 'completed';
  related_potential_trip_id: string | null;
  related_task_id: string | null;
  related_entity_id: string | null;
  metadata: {
    trip?: {
      destination?: string;
      dates?: {
        start?: string;
        end?: string;
      };
      days_until?: number;
    };
    missing?: string[];
    estimated_cost?: Record<string, number>;
    urgency_reason?: string;
    prepared_options?: {
      hotels?: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      flights?: Array<{
        id: string;
        airline: string;
        price: number;
      }>;
    };
    [key: string]: any;
  };
  dismissed_reason: string | null;
  snoozed_until: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  shown_at: string | null;
}

/**
 * Represents a daily AI-generated summary of opportunities and actions.
 * 
 * Generated each morning at 6am user local time, containing a natural language
 * summary of all opportunities from the past 24 hours, grouped by tier.
 * 
 * @example
 * ```typescript
 * const brief: DailyBrief = {
 *   id: "brief-123",
 *   user_id: "user-123",
 *   brief_date: "2024-02-15",
 *   content: "Good morning! You have 2 items that need attention...",
 *   opportunities_count: 5,
 *   action_needed_count: 2,
 *   prepared_count: 1
 * };
 * ```
 */
export interface DailyBrief {
  id: string;
  user_id: string;
  brief_date: string; // ISO date string
  content: string; // Natural language summary
  opportunities_count: number;
  action_needed_count: number;
  prepared_count: number;
  opportunity_ids: string[];
  generation_method: string;
  generation_time_ms: number | null;
  generated_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  notification_sent: boolean;
  notification_sent_at: string | null;
  created_at: string;
}

// =====================================================
// DERIVED / COMPUTED INTERFACES
// =====================================================

/**
 * Opportunity with related potential trip data included.
 * 
 * Used when fetching opportunities that need trip context for display.
 * The trip field will be null if the opportunity is not related to a potential trip.
 */
export interface OpportunityWithTrip extends Opportunity {
  /** The related potential trip, if this opportunity is tied to a detected trip */
  trip: PotentialTrip | null;
}

/**
 * Opportunity with all related entities included.
 * 
 * Used for detailed opportunity views that need full context including
 * the related trip, task, and entity records.
 */
export interface OpportunityWithRelations extends Opportunity {
  /** The related potential trip, if applicable */
  trip: PotentialTrip | null;
  /** The related task from the tasks table, if a task was created for this opportunity */
  task: any | null; // From existing tasks table
  /** The related entity from the entities table, if an entity was created */
  entity: any | null; // From existing entities table
}

/**
 * Daily brief with the full list of opportunities included.
 * 
 * Used when displaying a brief with expandable opportunity details.
 * The opportunities array contains the full Opportunity objects referenced by opportunity_ids.
 */
export interface DailyBriefWithOpportunities extends DailyBrief {
  /** Full opportunity objects for the IDs listed in opportunity_ids */
  opportunities: Opportunity[];
}

/**
 * Result from a context aggregation scan operation.
 * 
 * Returned by calendar scanner, email parser, and other background jobs
 * that process user data to detect trips and extract context.
 */
export interface ScanResult {
  /** Whether the scan completed successfully */
  success: boolean;
  /** Total number of items processed during the scan */
  items_processed: number;
  /** Number of new records created */
  items_created: number;
  /** Number of existing records updated */
  items_updated: number;
  /** Array of error messages, if any occurred */
  errors: string[];
  /** Execution time in milliseconds */
  execution_time_ms: number;
}

// =====================================================
// SCORING INTERFACES
// =====================================================

/**
 * All four scores for an opportunity (0-100 scale).
 * 
 * Used for scoring calculations and opportunity classification.
 */
export interface OpportunityScores {
  /** How certain we are this opportunity is needed (0-100) */
  confidence: number;
  /** How time-sensitive this opportunity is (0-100) */
  urgency: number;
  /** How much value this opportunity creates (0-100) */
  impact: number;
  /** What's the downside if we're wrong (0-100) */
  risk: number;
}

/**
 * Factors that contribute to opportunity scoring.
 * 
 * Used internally by the scoring algorithm to calculate the four main scores.
 */
export interface ScoringFactors {
  // For confidence
  data_quality?: number;
  source_reliability?: number;
  pattern_match?: number;

  // For urgency
  days_until_event?: number;
  price_volatility?: number;
  availability_risk?: number;

  // For impact
  cost_savings?: number;
  time_savings?: number;
  convenience_gain?: number;

  // For risk
  financial_commitment?: number;
  reversibility?: number;
  false_positive_likelihood?: number;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

/**
 * Opportunities grouped by tier for display in the home feed.
 * 
 * Used by the GET /api/opportunities endpoint to return opportunities
 * organized into the three main sections of the home feed.
 */
export interface GroupedOpportunities {
  /** Opportunities requiring immediate user action */
  action_needed: Opportunity[];
  /** Opportunities that have been pre-researched and are ready for review */
  prepared: Opportunity[];
  /** General opportunities and suggestions */
  opportunities: Opportunity[];
}

/**
 * Result from an opportunity action (approve, dismiss, snooze).
 * 
 * Returned by opportunity action endpoints to indicate success/failure
 * and provide next steps or messages to the user.
 */
export interface OpportunityActionResult {
  /** Whether the action completed successfully */
  success: boolean;
  /** The updated opportunity after the action */
  opportunity: Opportunity;
  /** Optional message to display to the user */
  message?: string;
  /** Optional next action to suggest */
  next_action?: string;
}