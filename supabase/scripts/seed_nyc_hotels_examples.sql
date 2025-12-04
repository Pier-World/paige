-- ============================================================================
-- NYC Hotels Seed Data - Example Entries
-- Purpose: Example hotel entries to guide curation
-- Instructions: Use these as templates, modify with actual data
-- ============================================================================

-- Example 1: The Greenwich Hotel (Tribeca) - Already in template
-- See seed_nyc_hotels_template.sql

-- Example 2: The Bowery Hotel (Lower East Side)
INSERT INTO hotels (
  name, brand_group, address, lat, lng, neighborhood, primary_city,
  website_url, booking_partners,
  star_rating, room_count, opening_year, last_renovated_year,
  rate_low, rate_mid, rate_high, check_in_time, check_out_time,
  business_cluster_proximity, walkability_score_internal, transit_access,
  airport_distance_minutes, near_key_areas,
  design_style, room_style, bathroom_quality, instagram_worthy,
  atmosphere, guest_mix, noise_level, scene_level,
  service_style, staff_kindness_score, checkin_flexibility_score,
  late_checkout_friendliness, discretion_score, concierge_quality, problem_resolution,
  gym_quality, spa_quality, pool_type, food_drink_quality, bar_scene,
  coworking_space, meeting_rooms, pet_friendly,
  wifi_quality, desk_in_room, power_outlets, creator_friendly, startup_friendly,
  good_for_solo_work, good_for_couples, good_for_families,
  good_for_long_stays, good_for_offsites, good_for_board_meetings,
  pier_perk_level, pier_benefits, quality_score_internal, notes_curated,
  is_active, is_experimental
) VALUES (
  'The Bowery Hotel',
  'Independent',
  '335 Bowery, New York, NY 10003',
  40.7238,
  -73.9910,
  'Lower East Side',
  'NYC',
  'https://www.theboweryhotel.com',
  '["Amex FHR", "Virtuoso"]'::jsonb,
  4.5,
  135,
  2007,
  2019,
  400,
  600,
  900,
  '15:00'::time,
  '12:00'::time,
  ARRAY['Soho', 'East Village']::text[],
  4,
  'excellent',
  40,
  ARRAY['Soho', 'East Village', 'Nolita']::text[],
  ARRAY['industrial', 'art-driven']::text[],
  ARRAY['spacious', 'loft-like']::text[],
  'luxury',
  true,
  ARRAY['scene-y', 'business', 'party']::text[],
  ARRAY['fashion', 'influencer', 'founders/VC']::text[],
  3,
  4,
  'ultra-attentive',
  9,
  4,
  4,
  4,
  2,
  'excellent',
  2,
  2,
  'none',
  'destination restaurant',
  'clubby',
  false,
  true,
  true,
  5,
  true,
  'abundant',
  true,
  false,
  true,
  true,
  false,
  false,
  true,
  true,
  'VIP partner',
  ARRAY['late checkout', 'breakfast', 'upgrade priority']::text[],
  88,
  'Iconic downtown hotel with incredible restaurant (Gemma) and bar scene. Very scene-y, attracts fashion and creative industry. Rooms are spacious with high ceilings. Great location for exploring LES and Soho. Service is excellent but can be busy/loud in common areas.',
  true,
  false
);

-- Example 3: The Mark Hotel (Upper East Side)
INSERT INTO hotels (
  name, brand_group, address, lat, lng, neighborhood, primary_city,
  website_url, booking_partners,
  star_rating, room_count, opening_year, last_renovated_year,
  rate_low, rate_mid, rate_high, check_in_time, check_out_time, loyalty_programs,
  business_cluster_proximity, walkability_score_internal, transit_access,
  airport_distance_minutes, near_key_areas,
  design_style, room_style, bathroom_quality, instagram_worthy,
  atmosphere, guest_mix, noise_level, scene_level,
  service_style, staff_kindness_score, checkin_flexibility_score,
  late_checkout_friendliness, discretion_score, concierge_quality, problem_resolution,
  gym_quality, spa_quality, pool_type, food_drink_quality, bar_scene,
  coworking_space, meeting_rooms, pet_friendly,
  wifi_quality, desk_in_room, power_outlets, creator_friendly, startup_friendly,
  good_for_solo_work, good_for_couples, good_for_families,
  good_for_long_stays, good_for_offsites, good_for_board_meetings,
  pier_perk_level, pier_benefits, quality_score_internal, notes_curated,
  is_active, is_experimental
) VALUES (
  'The Mark Hotel',
  'Independent',
  '25 E 77th St, New York, NY 10075',
  40.7756,
  -73.9619,
  'Upper East Side',
  'NYC',
  'https://www.themarkhotel.com',
  '["Amex FHR", "Virtuoso"]'::jsonb,
  5.0,
  150,
  1927,
  2021,
  500,
  750,
  1200,
  '15:00'::time,
  '12:00'::time,
  ARRAY['Bonvoy']::text[],
  ARRAY['Midtown', 'Upper East Side']::text[],
  5,
  'excellent',
  50,
  ARRAY['Central Park', 'Museum Mile']::text[],
  ARRAY['classic luxury', 'art-driven']::text[],
  ARRAY['spacious', 'suites-heavy']::text[],
  'luxury',
  true,
  ARRAY['quiet', 'business', 'wellness']::text[],
  ARRAY['finance', 'founders/VC', 'locals']::text[],
  2,
  2,
  'ultra-attentive',
  10,
  5,
  5,
  5,
  3,
  'excellent',
  3,
  3,
  'none',
  'destination restaurant',
  'quiet cocktails',
  false,
  true,
  true,
  5,
  true,
  'abundant',
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  'VIP partner',
  ARRAY['late checkout', 'breakfast', 'upgrade priority', '$100 credit']::text[],
  95,
  'Ultra-luxury on Upper East Side. Exceptional service, very quiet and discreet. Perfect for business travelers and families. Rooms are massive with incredible bathrooms. Freds restaurant is excellent. Great for long stays and board meetings. Very high-end clientele.',
  true,
  false
);

-- Example 4: Ace Hotel (Flatiron)
INSERT INTO hotels (
  name, brand_group, address, lat, lng, neighborhood, primary_city,
  website_url, booking_partners,
  star_rating, room_count, opening_year, last_renovated_year,
  rate_low, rate_mid, rate_high, check_in_time, check_out_time,
  business_cluster_proximity, walkability_score_internal, transit_access,
  airport_distance_minutes, near_key_areas,
  design_style, room_style, bathroom_quality, instagram_worthy,
  atmosphere, guest_mix, noise_level, scene_level,
  service_style, staff_kindness_score, checkin_flexibility_score,
  late_checkout_friendliness, discretion_score, concierge_quality, problem_resolution,
  gym_quality, spa_quality, pool_type, food_drink_quality, bar_scene,
  coworking_space, meeting_rooms, pet_friendly,
  wifi_quality, desk_in_room, power_outlets, creator_friendly, startup_friendly,
  good_for_solo_work, good_for_couples, good_for_families,
  good_for_long_stays, good_for_offsites, good_for_board_meetings,
  pier_perk_level, pier_benefits, quality_score_internal, notes_curated,
  is_active, is_experimental
) VALUES (
  'Ace Hotel New York',
  'Independent',
  '20 W 29th St, New York, NY 10001',
  40.7448,
  -73.9880,
  'Flatiron',
  'NYC',
  'https://www.acehotel.com/newyork',
  '["direct"]'::jsonb,
  4.0,
  260,
  2009,
  2018,
  250,
  400,
  650,
  '15:00'::time,
  '11:00'::time,
  ARRAY['Flatiron', 'Midtown']::text[],
  5,
  'excellent',
  45,
  ARRAY['Flatiron', 'Chelsea', 'Union Square']::text[],
  ARRAY['industrial', 'minimalist']::text[],
  ARRAY['compact', 'loft-like']::text[],
  'standard',
  true,
  ARRAY['party', 'scene-y', 'business']::text[],
  ARRAY['founders/VC', 'fashion', 'influencer', 'startups']::text[],
  4,
  4,
  'chill',
  7,
  3,
  3,
  3,
  1,
  'good',
  1,
  0,
  'none',
  'solid',
  'lobby hang',
  true,
  false,
  true,
  4,
  true,
  'adequate',
  true,
  true,
  true,
  false,
  false,
  false,
  false,
  false,
  'preferred',
  ARRAY['late checkout']::text[],
  75,
  'Hip, creative hotel in Flatiron. Great lobby for working and socializing. Rooms are compact but well-designed. Very startup/creator friendly. Can be loud and scene-y. Good WiFi, lots of power outlets. Not great for families or quiet business. Perfect for solo work trips and creative types.',
  true,
  false
);

-- ============================================================================
-- NOTES FOR CURATION
-- ============================================================================
-- 
-- These are EXAMPLE entries. When curating real hotels:
--
-- 1. Research thoroughly:
--    - Visit hotel website
--    - Read recent reviews (TripAdvisor, Google, Oyster)
--    - Check Instagram for vibe
--    - Look at room photos
--
-- 2. Be honest with scores:
--    - Don't inflate quality scores
--    - Noise level 1 = very quiet, 5 = very loud
--    - Scene level 1 = under-radar, 5 = see-and-be-seen
--
-- 3. Write detailed curated notes:
--    - Natural language description
--    - Mention specific highlights (restaurants, amenities)
--    - Note any drawbacks honestly
--    - This is what the LLM will use for context
--
-- 4. Verify location data:
--    - Use Google Maps for accurate lat/lng
--    - Verify neighborhood name
--    - Check walkability yourself if possible
--
-- 5. Target diverse properties:
--    - Mix of price points (budget to ultra-luxury)
--    - Mix of neighborhoods
--    - Mix of vibes (quiet vs scene-y)
--    - Mix of use cases (business vs leisure)
--
-- ============================================================================

