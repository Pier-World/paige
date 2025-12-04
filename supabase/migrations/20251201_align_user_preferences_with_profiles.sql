-- ============================================================================
-- Align user_preferences table with profiles.travel_preferences
-- Purpose: Consolidate preference storage and ensure consistency
-- ============================================================================

-- ============================================================================
-- PART 1: Migrate user_preferences data to profiles.travel_preferences
-- ============================================================================

-- If user_preferences table exists and has data, migrate it to profiles
DO $$
DECLARE
  pref_record RECORD;
  merged_prefs JSONB;
BEGIN
  -- Check if user_preferences table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_preferences'
  ) THEN
    -- For each user_preferences record, merge into profiles.travel_preferences
    FOR pref_record IN 
      SELECT up.profile_id, up.travel_preferences, up.budget_ranges, up.special_requirements, up.loyalty_programs
      FROM user_preferences up
      WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = up.profile_id)
    LOOP
      -- Get existing travel_preferences from profiles
      SELECT COALESCE(travel_preferences, '{}'::jsonb)
      INTO merged_prefs
      FROM profiles
      WHERE id = pref_record.profile_id;

      -- Merge travel_preferences from user_preferences
      IF pref_record.travel_preferences IS NOT NULL THEN
        merged_prefs := merged_prefs || pref_record.travel_preferences;
      END IF;

      -- Add budget_ranges if not already present
      IF pref_record.budget_ranges IS NOT NULL AND NOT (merged_prefs ? 'budget_ranges') THEN
        merged_prefs := merged_prefs || jsonb_build_object('budget_ranges', pref_record.budget_ranges);
      END IF;

      -- Add special_requirements if not already present
      IF pref_record.special_requirements IS NOT NULL AND NOT (merged_prefs ? 'special_requirements') THEN
        merged_prefs := merged_prefs || jsonb_build_object('special_requirements', pref_record.special_requirements);
      END IF;

      -- Add loyalty_programs if not already present
      IF pref_record.loyalty_programs IS NOT NULL AND NOT (merged_prefs ? 'loyalty_programs') THEN
        merged_prefs := merged_prefs || jsonb_build_object('loyalty_programs', pref_record.loyalty_programs);
      END IF;

      -- Update profiles with merged preferences
      UPDATE profiles
      SET travel_preferences = merged_prefs
      WHERE id = pref_record.profile_id;
    END LOOP;

    RAISE NOTICE 'Migrated user_preferences data to profiles.travel_preferences';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Create View for Backward Compatibility (Optional)
-- ============================================================================

-- Create a view that makes profiles.travel_preferences look like user_preferences
-- This allows existing code to continue working while we migrate
CREATE OR REPLACE VIEW user_preferences_view AS
SELECT 
  p.id as profile_id,
  p.id as id,
  COALESCE(p.travel_preferences->'flight', '{}'::jsonb) as travel_preferences,
  COALESCE(p.travel_preferences->'budget_ranges', '{}'::jsonb) as budget_ranges,
  COALESCE(p.travel_preferences->'special_requirements', '{}'::jsonb) as special_requirements,
  COALESCE(p.travel_preferences->'loyalty_programs', '[]'::jsonb) as loyalty_programs,
  COALESCE(p.travel_preferences->'payment_preferences', '{}'::jsonb) as payment_preferences,
  p.created_at,
  p.updated_at
FROM profiles p;

-- Grant access to authenticated users
GRANT SELECT ON user_preferences_view TO authenticated;

-- ============================================================================
-- PART 3: Add Helper Function to Update Travel Preferences
-- ============================================================================

-- Function to safely update travel preferences
CREATE OR REPLACE FUNCTION update_travel_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    travel_preferences = COALESCE(travel_preferences, '{}'::jsonb) || p_preferences,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_travel_preferences(UUID, JSONB) TO authenticated;

-- ============================================================================
-- PART 4: Add Helper Function to Get Travel Preferences
-- ============================================================================

-- Function to get travel preferences with defaults
CREATE OR REPLACE FUNCTION get_travel_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  prefs JSONB;
BEGIN
  SELECT COALESCE(travel_preferences, '{}'::jsonb)
  INTO prefs
  FROM profiles
  WHERE id = p_user_id;

  -- Return with defaults if empty
  IF prefs = '{}'::jsonb OR prefs IS NULL THEN
    RETURN '{
      "preferred_airlines": [],
      "seat_preference": null,
      "cabin_preference": null,
      "tsa_precheck": null,
      "known_traveler_number": null,
      "meal_preferences": [],
      "special_assistance": [],
      "frequent_destinations": [],
      "booking_preferences": {
        "prefer_nonstop": false,
        "prefer_morning_flights": false,
        "prefer_window_seat": false,
        "prefer_aisle_seat": false
      },
      "budget_ranges": {
        "flight": {"min": 0, "max": 1000, "flexible": true},
        "hotel": {"per_night_min": 0, "per_night_max": 300, "flexible": true}
      },
      "special_requirements": {
        "dietary": [],
        "accessibility": [],
        "allergies": []
      },
      "loyalty_programs": []
    }'::jsonb;
  END IF;

  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_travel_preferences(UUID) TO authenticated;

-- ============================================================================
-- PART 5: Migration Notes
-- ============================================================================

-- This migration:
-- 1. ✅ Migrates data from user_preferences table to profiles.travel_preferences
-- 2. ✅ Creates a view for backward compatibility
-- 3. ✅ Adds helper functions for updating and getting travel preferences
-- 4. ✅ Ensures consistent preference storage in profiles table

-- Note: The user_preferences table is NOT dropped to avoid breaking existing code
-- You can drop it later after verifying all code uses profiles.travel_preferences

