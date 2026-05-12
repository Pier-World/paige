-- ============================================================================
-- Pier Curated Inventory: Hotels Table
-- Purpose: Proprietary supply-side database for instant, high-quality AI recommendations
-- Schema Version: 3.0 (from pier-final-spec.jsx)
-- ============================================================================

-- Enable pgvector extension for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE primary_city_enum AS ENUM ('NYC', 'LA', 'Miami', 'SF', 'London', 'Austin');
CREATE TYPE transit_access_enum AS ENUM ('excellent', 'good', 'poor');
CREATE TYPE bathroom_quality_enum AS ENUM ('standard', 'luxury', 'rain showers', 'soaking tubs');
CREATE TYPE service_style_enum AS ENUM ('ultra-attentive', 'discreet', 'chill', 'inconsistent');
CREATE TYPE problem_resolution_enum AS ENUM ('excellent', 'good', 'poor');
CREATE TYPE pool_type_enum AS ENUM ('rooftop', 'indoor', 'outdoor', 'none');
CREATE TYPE food_drink_quality_enum AS ENUM ('destination restaurant', 'solid', 'meh', 'none');
CREATE TYPE bar_scene_enum AS ENUM ('quiet cocktails', 'lobby hang', 'clubby', 'none');
CREATE TYPE power_outlets_enum AS ENUM ('abundant', 'adequate', 'scarce');
CREATE TYPE pier_perk_level_enum AS ENUM ('none', 'preferred', 'VIP partner');

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  -- Core Identity
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand_group text, -- Aman, Marriott, Independent
  address text NOT NULL,
  lat decimal(10, 8) NOT NULL,
  lng decimal(11, 8) NOT NULL,
  neighborhood text NOT NULL, -- Soho, West Hollywood, Shoreditch
  primary_city primary_city_enum NOT NULL,
  website_url text,
  pier_booking_link text, -- Your tracked affiliate/partner link
  booking_partners jsonb DEFAULT '[]'::jsonb, -- [Amex FHR, Virtuoso, direct]

  -- Static Attributes
  star_rating decimal(2, 1), -- 3.0 - 5.0
  room_count int, -- Boutique (<50) vs mega (500+)
  opening_year int,
  last_renovated_year int,
  rate_low int, -- Typical nightly - low season
  rate_mid int, -- Typical nightly - shoulder
  rate_high int, -- Typical nightly - peak
  check_in_time time,
  check_out_time time,
  loyalty_programs text[] DEFAULT '{}', -- Bonvoy, Hyatt, Hilton

  -- Location & Access
  business_cluster_proximity text[] DEFAULT '{}', -- Soho VC cluster, FiDi, Midtown
  walkability_score_internal int CHECK (walkability_score_internal >= 1 AND walkability_score_internal <= 5), -- 1-5: pleasant vs technically walkable
  transit_access transit_access_enum,
  airport_distance_minutes int,
  near_key_areas text[] DEFAULT '{}', -- Neighborhood proximity tags

  -- Design & Aesthetic
  design_style text[] DEFAULT '{}', -- minimalist, art-driven, classic luxury, maximalist, industrial, historic
  room_style text[] DEFAULT '{}', -- spacious, compact, loft-like, suites-heavy
  bathroom_quality bathroom_quality_enum,
  instagram_worthy boolean DEFAULT false,

  -- Atmosphere & Vibe
  atmosphere text[] DEFAULT '{}', -- quiet, party, scene-y, family, business, wellness, romantic
  guest_mix text[] DEFAULT '{}', -- founders/VC, finance, fashion, influencer, locals, tourists
  noise_level int CHECK (noise_level >= 1 AND noise_level <= 5), -- 1-5 scale
  scene_level int CHECK (scene_level >= 1 AND scene_level <= 5), -- 1-5: under-radar vs see-and-be-seen

  -- Service Quality
  service_style service_style_enum,
  staff_kindness_score int CHECK (staff_kindness_score >= 1 AND staff_kindness_score <= 10), -- Internal 1-10 from feedback
  checkin_flexibility_score int CHECK (checkin_flexibility_score >= 1 AND checkin_flexibility_score <= 5), -- 1-5: early checkin friendliness
  late_checkout_friendliness int CHECK (late_checkout_friendliness >= 1 AND late_checkout_friendliness <= 5), -- 1-5: how easy to get late checkout
  discretion_score int CHECK (discretion_score >= 1 AND discretion_score <= 5), -- 1-5: staff discretion for VIPs/meetings
  concierge_quality int CHECK (concierge_quality >= 0 AND concierge_quality <= 3), -- 0-3
  problem_resolution problem_resolution_enum,

  -- Amenities
  gym_quality int CHECK (gym_quality >= 0 AND gym_quality <= 3), -- 0-3
  spa_quality int CHECK (spa_quality >= 0 AND spa_quality <= 3), -- 0-3
  pool_type pool_type_enum,
  food_drink_quality food_drink_quality_enum,
  bar_scene bar_scene_enum,
  coworking_space boolean DEFAULT false,
  meeting_rooms boolean DEFAULT false,
  pet_friendly boolean DEFAULT false,

  -- Work & Tech
  wifi_quality int CHECK (wifi_quality >= 1 AND wifi_quality <= 5), -- 1-5: speed + reliability
  desk_in_room boolean DEFAULT false,
  power_outlets power_outlets_enum,
  creator_friendly boolean DEFAULT false, -- Good lighting, quiet spaces, content-friendly
  startup_friendly boolean DEFAULT false, -- Lobby work vibe, casual dress OK

  -- Use Case Suitability
  good_for_solo_work boolean DEFAULT false, -- Strong WiFi, desk, quiet
  good_for_couples boolean DEFAULT false, -- Romantic, privacy
  good_for_families boolean DEFAULT false, -- Kid-friendly, connecting rooms
  good_for_long_stays boolean DEFAULT false, -- Kitchenette, laundry
  good_for_offsites boolean DEFAULT false, -- Meeting space, AV, group rates
  good_for_board_meetings boolean DEFAULT false, -- Private dining, discretion

  -- Pier Specific
  pier_perk_level pier_perk_level_enum DEFAULT 'none',
  pier_benefits text[] DEFAULT '{}', -- late checkout, breakfast, upgrade priority
  quality_score_internal int CHECK (quality_score_internal >= 1 AND quality_score_internal <= 100), -- 1-100 overall rating
  data_freshness timestamptz DEFAULT now(), -- Last scraped/verified
  notes_curated text, -- Free text for LLM + presentation
  profile_embedding vector(1536), -- For semantic similarity (OpenAI ada-002 dimension)
  is_active boolean DEFAULT true, -- Show in recommendations
  is_experimental boolean DEFAULT false, -- Testing, not yet validated

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hotels_primary_city ON hotels(primary_city);
CREATE INDEX IF NOT EXISTS idx_hotels_neighborhood ON hotels(neighborhood);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON hotels(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hotels_quality_score ON hotels(quality_score_internal DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels USING GIST (point(lng, lat));
CREATE INDEX IF NOT EXISTS idx_hotels_profile_embedding ON hotels USING ivfflat (profile_embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read active hotels
CREATE POLICY "Anyone can read active hotels"
  ON hotels FOR SELECT
  USING (is_active = true);

-- RLS Policy: Service role can do everything
CREATE POLICY "Service role full access"
  ON hotels FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE hotels IS 'Curated inventory of hotels for AI recommendations. 25-50 properties per geo.';
COMMENT ON COLUMN hotels.profile_embedding IS 'Vector embedding for semantic similarity matching (OpenAI ada-002, 1536 dimensions)';
COMMENT ON COLUMN hotels.quality_score_internal IS 'Overall quality rating 1-100, used for ranking';
COMMENT ON COLUMN hotels.data_freshness IS 'Last time hotel data was scraped/verified';

