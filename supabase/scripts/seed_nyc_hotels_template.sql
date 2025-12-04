-- ============================================================================
-- NYC Hotels Seed Data Template
-- Purpose: Template for manually curating 25-40 NYC hotels
-- Instructions: Fill in the details for each hotel using the schema as checklist
-- ============================================================================

-- Example hotel entry - copy and modify for each property
-- Use this as a template and fill in all relevant fields

INSERT INTO hotels (
  -- Core Identity (REQUIRED)
  name,
  brand_group,
  address,
  lat,
  lng,
  neighborhood,
  primary_city,
  website_url,
  pier_booking_link,
  booking_partners,

  -- Static Attributes
  star_rating,
  room_count,
  opening_year,
  last_renovated_year,
  rate_low,
  rate_mid,
  rate_high,
  check_in_time,
  check_out_time,
  loyalty_programs,

  -- Location & Access
  business_cluster_proximity,
  walkability_score_internal,
  transit_access,
  airport_distance_minutes,
  near_key_areas,

  -- Design & Aesthetic
  design_style,
  room_style,
  bathroom_quality,
  instagram_worthy,

  -- Atmosphere & Vibe
  atmosphere,
  guest_mix,
  noise_level,
  scene_level,

  -- Service Quality
  service_style,
  staff_kindness_score,
  checkin_flexibility_score,
  late_checkout_friendliness,
  discretion_score,
  concierge_quality,
  problem_resolution,

  -- Amenities
  gym_quality,
  spa_quality,
  pool_type,
  food_drink_quality,
  bar_scene,
  coworking_space,
  meeting_rooms,
  pet_friendly,

  -- Work & Tech
  wifi_quality,
  desk_in_room,
  power_outlets,
  creator_friendly,
  startup_friendly,

  -- Use Case Suitability
  good_for_solo_work,
  good_for_couples,
  good_for_families,
  good_for_long_stays,
  good_for_offsites,
  good_for_board_meetings,

  -- Pier Specific
  pier_perk_level,
  pier_benefits,
  quality_score_internal,
  notes_curated,
  is_active,
  is_experimental
) VALUES (
  -- EXAMPLE: The Greenwich Hotel
  'The Greenwich Hotel',                    -- name
  'Independent',                             -- brand_group
  '377 Greenwich St, New York, NY 10013',   -- address
  40.7205,                                   -- lat
  -74.0087,                                  -- lng
  'Tribeca',                                 -- neighborhood
  'NYC',                                     -- primary_city
  'https://www.thegreenwichhotel.com',      -- website_url
  NULL,                                      -- pier_booking_link (add when available)
  '["Amex FHR", "Virtuoso"]'::jsonb,        -- booking_partners

  -- Static Attributes
  4.5,                                       -- star_rating
  88,                                        -- room_count
  2008,                                      -- opening_year
  2020,                                      -- last_renovated_year
  450,                                       -- rate_low
  650,                                       -- rate_mid
  950,                                       -- rate_high
  '15:00'::time,                            -- check_in_time
  '12:00'::time,                            -- check_out_time
  ARRAY[]::text[],                          -- loyalty_programs

  -- Location & Access
  ARRAY['Soho VC cluster', 'FiDi']::text[], -- business_cluster_proximity
  5,                                         -- walkability_score_internal (1-5)
  'excellent',                               -- transit_access
  45,                                        -- airport_distance_minutes
  ARRAY['Soho', 'West Village']::text[],    -- near_key_areas

  -- Design & Aesthetic
  ARRAY['art-driven', 'minimalist']::text[], -- design_style
  ARRAY['spacious', 'suites-heavy']::text[], -- room_style
  'luxury',                                  -- bathroom_quality
  true,                                      -- instagram_worthy

  -- Atmosphere & Vibe
  ARRAY['quiet', 'business', 'wellness']::text[], -- atmosphere
  ARRAY['founders/VC', 'finance', 'fashion']::text[], -- guest_mix
  2,                                         -- noise_level (1-5)
  2,                                         -- scene_level (1-5)

  -- Service Quality
  'ultra-attentive',                         -- service_style
  9,                                         -- staff_kindness_score (1-10)
  4,                                         -- checkin_flexibility_score (1-5)
  5,                                         -- late_checkout_friendliness (1-5)
  5,                                         -- discretion_score (1-5)
  3,                                         -- concierge_quality (0-3)
  'excellent',                               -- problem_resolution

  -- Amenities
  2,                                         -- gym_quality (0-3)
  3,                                         -- spa_quality (0-3)
  'none',                                    -- pool_type
  'destination restaurant',                  -- food_drink_quality
  'quiet cocktails',                         -- bar_scene
  false,                                     -- coworking_space
  true,                                      -- meeting_rooms
  true,                                      -- pet_friendly

  -- Work & Tech
  5,                                         -- wifi_quality (1-5)
  true,                                      -- desk_in_room
  'abundant',                                -- power_outlets
  true,                                      -- creator_friendly
  false,                                     -- startup_friendly

  -- Use Case Suitability
  true,                                      -- good_for_solo_work
  true,                                      -- good_for_couples
  false,                                     -- good_for_families
  false,                                     -- good_for_long_stays
  true,                                      -- good_for_offsites
  true,                                      -- good_for_board_meetings

  -- Pier Specific
  'VIP partner',                            -- pier_perk_level
  ARRAY['late checkout', 'breakfast', 'upgrade priority']::text[], -- pier_benefits
  92,                                        -- quality_score_internal (1-100)
  'Boutique luxury in Tribeca. Exceptional service, quiet, perfect for business. Shibui Spa is world-class. Rooms are spacious with beautiful design. Great for meetings and offsites.', -- notes_curated
  true,                                      -- is_active
  false                                      -- is_experimental
);

-- ============================================================================
-- CHECKLIST FOR EACH HOTEL
-- ============================================================================
-- Use this checklist when curating each hotel to ensure completeness:
--
-- [ ] Core Identity: name, address, lat/lng, neighborhood, primary_city
-- [ ] Static Attributes: star_rating, room_count, rates (low/mid/high)
-- [ ] Location & Access: walkability, transit, airport distance
-- [ ] Design & Aesthetic: design_style, room_style, bathroom_quality
-- [ ] Atmosphere & Vibe: atmosphere, guest_mix, noise_level, scene_level
-- [ ] Service Quality: service_style, staff_kindness, flexibility scores
-- [ ] Amenities: gym, spa, pool, food/drink, bar scene
-- [ ] Work & Tech: wifi_quality, desk, power_outlets, creator/startup friendly
-- [ ] Use Case Suitability: solo work, couples, families, long stays, offsites
-- [ ] Pier Specific: perk_level, benefits, quality_score, curated notes
--
-- ============================================================================
-- NYC NEIGHBORHOODS TO CONSIDER
-- ============================================================================
-- Soho, Tribeca, West Village, East Village, Lower East Side
-- Midtown, Upper East Side, Upper West Side
-- Chelsea, Meatpacking District, Flatiron
-- Brooklyn: Williamsburg, DUMBO, Brooklyn Heights
--
-- ============================================================================
-- TARGET: 25-40 hotels across diverse neighborhoods and price points
-- ============================================================================

