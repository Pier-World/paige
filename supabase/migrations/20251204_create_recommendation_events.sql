-- ============================================================================
-- Pier Curated Inventory: Recommendation Events Table
-- Purpose: Full event logging for learning and quality metrics
-- Schema Version: 3.0 (from pier-final-spec.jsx)
-- ============================================================================

-- Create recommendation_events table
CREATE TABLE IF NOT EXISTS recommendation_events (
  -- Core Event
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  request_text text NOT NULL, -- Original user message
  session_id uuid, -- Group related events

  -- Parsed Request
  parsed_city text,
  parsed_dates daterange,
  parsed_budget_range int4range,
  parsed_trip_type text,
  parsed_party_size int,
  parsed_constraints jsonb DEFAULT '{}'::jsonb,
  clarifying_questions_asked text[] DEFAULT '{}',

  -- Matching Results
  candidates_after_filter int, -- How many passed hard filters
  candidates_shown uuid[] DEFAULT '{}', -- Final 2-3 presented (hotel IDs)
  scores_at_presentation jsonb DEFAULT '{}'::jsonb, -- {hotel_id: {score, breakdown}}
  llm_reasoning text, -- GPT explanation for ranking

  -- User Response
  chosen_hotel_id uuid REFERENCES hotels(id) ON DELETE SET NULL, -- Null if abandoned
  asked_for_alternatives boolean DEFAULT false,
  time_to_selection_seconds int,
  proceeded_to_booking boolean DEFAULT false,

  -- Concierge Handoff
  concierge_override boolean DEFAULT false,
  override_hotel_id uuid REFERENCES hotels(id) ON DELETE SET NULL,
  override_reason text,
  booking_completed boolean DEFAULT false,
  final_booked_hotel_id uuid REFERENCES hotels(id) ON DELETE SET NULL,

  -- Post-Stay Feedback
  post_stay_rating int CHECK (post_stay_rating >= 1 AND post_stay_rating <= 10), -- 1-10
  fit_score int CHECK (fit_score >= 1 AND fit_score <= 10), -- "How much did this feel like you?" 1-10
  feedback_tags text[] DEFAULT '{}', -- Too loud, Too corporate, Perfect
  feedback_text text,
  would_rebook boolean
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendation_events_user_id ON recommendation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_session_id ON recommendation_events(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_created_at ON recommendation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_chosen_hotel ON recommendation_events(chosen_hotel_id) WHERE chosen_hotel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendation_events_final_booked ON recommendation_events(final_booked_hotel_id) WHERE final_booked_hotel_id IS NOT NULL;

-- Enable RLS
ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own events
CREATE POLICY "Users can read own events"
  ON recommendation_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can do everything
CREATE POLICY "Service role full access"
  ON recommendation_events FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE recommendation_events IS 'Full event logging for recommendation quality metrics and learning. Instrument everything from day one.';
COMMENT ON COLUMN recommendation_events.fit_score IS '"How much did this feel like you?" 1-10 scale for post-stay feedback';
COMMENT ON COLUMN recommendation_events.scores_at_presentation IS 'JSON object with hotel_id keys and {score, breakdown} values for explainability';

