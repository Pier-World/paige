-- ============================================================================
-- Pier Curated Inventory: User Hotel Preferences Table
-- Purpose: Store user preferences for hotel matching
-- Schema Version: 3.0 (from pier-final-spec.jsx)
-- ============================================================================

-- Enable pgvector extension for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE service_preference_enum AS ENUM ('high-touch', 'balanced', 'leave-me-alone');
CREATE TYPE location_priority_enum AS ENUM ('walkability', 'transit', 'quiet');

-- Create user_hotel_preferences table
CREATE TABLE IF NOT EXISTS user_hotel_preferences (
  -- Identity
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  home_city text,
  typical_timezones text[] DEFAULT '{}',
  company text,
  role text, -- founder, VC, exec, etc.

  -- Budget & Loyalty
  price_bands_by_city jsonb DEFAULT '{}'::jsonb, -- {"NYC": [300, 600], "Austin": [200, 400]}
  hard_budget_max int, -- Absolute ceiling if specified
  deal_sensitivity int CHECK (deal_sensitivity >= 1 AND deal_sensitivity <= 5), -- 1-5: value-focused vs best-is-best
  loyalty_programs jsonb DEFAULT '[]'::jsonb, -- [{program, status, priority}]
  preferred_brands text[] DEFAULT '{}', -- From onboarding

  -- Style & Vibe
  design_style_ranked text[] DEFAULT '{}', -- Ordered preference list
  atmosphere_ranked text[] DEFAULT '{}', -- Ordered preference list
  noise_tolerance int CHECK (noise_tolerance >= 1 AND noise_tolerance <= 5), -- 1-5
  scene_tolerance int CHECK (scene_tolerance >= 1 AND scene_tolerance <= 5), -- 1-5: how much they enjoy "scene-y"
  service_preference service_preference_enum,

  -- Location Priorities
  preferred_neighborhoods jsonb DEFAULT '{}'::jsonb, -- {"NYC": ["Soho", "West Village"]}
  location_priority location_priority_enum,
  max_commute_tolerance int, -- Minutes to city center

  -- Amenity Priorities
  gym_priority int CHECK (gym_priority >= 0 AND gym_priority <= 3), -- 0-3
  spa_priority int CHECK (spa_priority >= 0 AND spa_priority <= 3), -- 0-3
  pool_priority int CHECK (pool_priority >= 0 AND pool_priority <= 3), -- 0-3
  food_drink_priority int CHECK (food_drink_priority >= 0 AND food_drink_priority <= 3), -- 0-3
  wifi_priority int CHECK (wifi_priority >= 0 AND wifi_priority <= 3), -- 0-3

  -- Constraints
  must_have text[] DEFAULT '{}', -- good WiFi, desk, 24h room service
  hard_no text[] DEFAULT '{}', -- no clubby lobby, no shared bathroom
  accessibility_needs text[] DEFAULT '{}',
  pet_traveling boolean DEFAULT false,

  -- Learned (System-Updated)
  stay_history jsonb DEFAULT '[]'::jsonb, -- [{hotel_id, trip_type, rating, date}]
  taste_vector vector(1536), -- Computed from loved hotels (OpenAI ada-002 dimension)
  tag_weights jsonb DEFAULT '{}'::jsonb, -- Per-tag affinity scores
  concierge_overrides jsonb DEFAULT '[]'::jsonb, -- When human corrected AI
  taste_profile_text text, -- Natural language summary for LLM

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_hotel_prefs_user_id ON user_hotel_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hotel_prefs_taste_vector ON user_hotel_preferences USING ivfflat (taste_vector vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE user_hotel_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_hotel_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_hotel_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_hotel_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role can do everything
CREATE POLICY "Service role full access"
  ON user_hotel_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE user_hotel_preferences IS 'User preferences for hotel matching. System-updated fields learn from user behavior.';
COMMENT ON COLUMN user_hotel_preferences.taste_vector IS 'Vector embedding computed from loved hotels (OpenAI ada-002, 1536 dimensions)';
COMMENT ON COLUMN user_hotel_preferences.tag_weights IS 'Per-tag affinity scores that adjust based on ratings';
COMMENT ON COLUMN user_hotel_preferences.taste_profile_text IS 'Natural language summary of user taste for LLM context';

