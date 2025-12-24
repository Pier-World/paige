/**
 * Auto-generated TypeScript types from Supabase database schema
 * Generated for Phase 1: Proactive Intelligence tables
 * 
 * To regenerate: npx supabase gen types typescript --linked > src/types/database-generated.ts
 * 
 * Tables included:
 * - potential_trips
 * - email_context
 * - user_patterns
 * - opportunities
 * - daily_briefs
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      potential_trips: {
        Row: {
          id: string
          user_id: string
          destination: string
          destination_city: string | null
          destination_country: string | null
          start_date: string // DATE in PostgreSQL
          end_date: string // DATE in PostgreSQL
          detection_source: 'calendar' | 'email' | 'manual'
          source_event_id: string | null
          source_email_id: string | null
          confidence_score: number // INTEGER 0-100
          trip_type: 'business' | 'leisure' | 'mixed' | 'unknown' | null
          metadata: Json // JSONB
          status: 'detected' | 'confirmed' | 'booking_in_progress' | 'booked' | 'dismissed' | 'expired'
          related_trip_id: string | null
          related_entity_id: string | null
          created_at: string // TIMESTAMPTZ
          updated_at: string // TIMESTAMPTZ
          expires_at: string | null // TIMESTAMPTZ
        }
        Insert: {
          id?: string
          user_id: string
          destination: string
          destination_city?: string | null
          destination_country?: string | null
          start_date: string
          end_date: string
          detection_source: 'calendar' | 'email' | 'manual'
          source_event_id?: string | null
          source_email_id?: string | null
          confidence_score: number
          trip_type?: 'business' | 'leisure' | 'mixed' | 'unknown' | null
          metadata?: Json
          status?: 'detected' | 'confirmed' | 'booking_in_progress' | 'booked' | 'dismissed' | 'expired'
          related_trip_id?: string | null
          related_entity_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          destination?: string
          destination_city?: string | null
          destination_country?: string | null
          start_date?: string
          end_date?: string
          detection_source?: 'calendar' | 'email' | 'manual'
          source_event_id?: string | null
          source_email_id?: string | null
          confidence_score?: number
          trip_type?: 'business' | 'leisure' | 'mixed' | 'unknown' | null
          metadata?: Json
          status?: 'detected' | 'confirmed' | 'booking_in_progress' | 'booked' | 'dismissed' | 'expired'
          related_trip_id?: string | null
          related_entity_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      email_context: {
        Row: {
          id: string
          user_id: string
          email_id: string
          gmail_message_id: string | null
          confirmation_type: 'flight' | 'hotel' | 'car' | 'event' | 'restaurant' | 'other'
          confirmation_code: string | null
          parsed_data: Json // JSONB
          extraction_confidence: number | null // INTEGER 0-100
          extraction_method: string
          extraction_errors: string[] | null
          processed: boolean
          related_potential_trip_id: string | null
          parsed_at: string // TIMESTAMPTZ
          created_at: string // TIMESTAMPTZ
        }
        Insert: {
          id?: string
          user_id: string
          email_id: string
          gmail_message_id?: string | null
          confirmation_type: 'flight' | 'hotel' | 'car' | 'event' | 'restaurant' | 'other'
          confirmation_code?: string | null
          parsed_data?: Json
          extraction_confidence?: number | null
          extraction_method?: string
          extraction_errors?: string[] | null
          processed?: boolean
          related_potential_trip_id?: string | null
          parsed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_id?: string
          gmail_message_id?: string | null
          confirmation_type?: 'flight' | 'hotel' | 'car' | 'event' | 'restaurant' | 'other'
          confirmation_code?: string | null
          parsed_data?: Json
          extraction_confidence?: number | null
          extraction_method?: string
          extraction_errors?: string[] | null
          processed?: boolean
          related_potential_trip_id?: string | null
          parsed_at?: string
          created_at?: string
        }
      }
      user_patterns: {
        Row: {
          id: string
          user_id: string
          pattern_type: 'airline_preference' | 'hotel_tier' | 'booking_timing' | 'seat_preference' | 'price_sensitivity' | 'destination_frequency' | 'travel_day_preference' | 'booking_window' | 'amenity_preference' | 'loyalty_usage' | 'other'
          pattern_data: Json // JSONB
          confidence_score: number // INTEGER 0-100
          observation_count: number // INTEGER
          pattern_strength: 'weak' | 'moderate' | 'strong' | 'very_strong' | null
          last_observed: string // TIMESTAMPTZ
          first_observed: string // TIMESTAMPTZ
          created_at: string // TIMESTAMPTZ
          updated_at: string // TIMESTAMPTZ
        }
        Insert: {
          id?: string
          user_id: string
          pattern_type: 'airline_preference' | 'hotel_tier' | 'booking_timing' | 'seat_preference' | 'price_sensitivity' | 'destination_frequency' | 'travel_day_preference' | 'booking_window' | 'amenity_preference' | 'loyalty_usage' | 'other'
          pattern_data?: Json
          confidence_score: number
          observation_count?: number
          pattern_strength?: 'weak' | 'moderate' | 'strong' | 'very_strong' | null
          last_observed?: string
          first_observed?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pattern_type?: 'airline_preference' | 'hotel_tier' | 'booking_timing' | 'seat_preference' | 'price_sensitivity' | 'destination_frequency' | 'travel_day_preference' | 'booking_window' | 'amenity_preference' | 'loyalty_usage' | 'other'
          pattern_data?: Json
          confidence_score?: number
          observation_count?: number
          pattern_strength?: 'weak' | 'moderate' | 'strong' | 'very_strong' | null
          last_observed?: string
          first_observed?: string
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          user_id: string
          type: 'trip_gap' | 'price_drop' | 'preparation' | 'upgrade' | 'expiring_benefit' | 'optimization' | 'reminder' | 'other'
          title: string
          description: string
          confidence_score: number // INTEGER 0-100
          urgency_score: number // INTEGER 0-100
          impact_score: number // INTEGER 0-100
          risk_score: number // INTEGER 0-100
          tier: 'action_needed' | 'prepared' | 'opportunity'
          status: 'pending' | 'shown' | 'approved' | 'dismissed' | 'snoozed' | 'expired' | 'completed'
          related_potential_trip_id: string | null
          related_task_id: string | null
          related_entity_id: string | null
          metadata: Json // JSONB
          dismissed_reason: string | null
          snoozed_until: string | null // TIMESTAMPTZ
          approved_at: string | null // TIMESTAMPTZ
          created_at: string // TIMESTAMPTZ
          updated_at: string // TIMESTAMPTZ
          expires_at: string | null // TIMESTAMPTZ
          shown_at: string | null // TIMESTAMPTZ
        }
        Insert: {
          id?: string
          user_id: string
          type: 'trip_gap' | 'price_drop' | 'preparation' | 'upgrade' | 'expiring_benefit' | 'optimization' | 'reminder' | 'other'
          title: string
          description: string
          confidence_score: number
          urgency_score: number
          impact_score: number
          risk_score: number
          tier: 'action_needed' | 'prepared' | 'opportunity'
          status?: 'pending' | 'shown' | 'approved' | 'dismissed' | 'snoozed' | 'expired' | 'completed'
          related_potential_trip_id?: string | null
          related_task_id?: string | null
          related_entity_id?: string | null
          metadata?: Json
          dismissed_reason?: string | null
          snoozed_until?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          shown_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'trip_gap' | 'price_drop' | 'preparation' | 'upgrade' | 'expiring_benefit' | 'optimization' | 'reminder' | 'other'
          title?: string
          description?: string
          confidence_score?: number
          urgency_score?: number
          impact_score?: number
          risk_score?: number
          tier?: 'action_needed' | 'prepared' | 'opportunity'
          status?: 'pending' | 'shown' | 'approved' | 'dismissed' | 'snoozed' | 'expired' | 'completed'
          related_potential_trip_id?: string | null
          related_task_id?: string | null
          related_entity_id?: string | null
          metadata?: Json
          dismissed_reason?: string | null
          snoozed_until?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          shown_at?: string | null
        }
      }
      daily_briefs: {
        Row: {
          id: string
          user_id: string
          brief_date: string // DATE in PostgreSQL
          content: string
          opportunities_count: number // INTEGER
          action_needed_count: number // INTEGER
          prepared_count: number // INTEGER
          opportunity_ids: string[] // UUID[]
          generation_method: string
          generation_time_ms: number | null // INTEGER
          generated_at: string // TIMESTAMPTZ
          read_at: string | null // TIMESTAMPTZ
          dismissed_at: string | null // TIMESTAMPTZ
          notification_sent: boolean
          notification_sent_at: string | null // TIMESTAMPTZ
          created_at: string // TIMESTAMPTZ
        }
        Insert: {
          id?: string
          user_id: string
          brief_date: string
          content: string
          opportunities_count?: number
          action_needed_count?: number
          prepared_count?: number
          opportunity_ids?: string[]
          generation_method?: string
          generation_time_ms?: number | null
          generated_at?: string
          read_at?: string | null
          dismissed_at?: string | null
          notification_sent?: boolean
          notification_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brief_date?: string
          content?: string
          opportunities_count?: number
          action_needed_count?: number
          prepared_count?: number
          opportunity_ids?: string[]
          generation_method?: string
          generation_time_ms?: number | null
          generated_at?: string
          read_at?: string | null
          dismissed_at?: string | null
          notification_sent?: boolean
          notification_sent_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
