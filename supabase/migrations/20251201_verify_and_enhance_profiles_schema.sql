-- ============================================================================
-- Database Schema Verification & Enhancement
-- Purpose: Verify MVP schema alignment and enhance profiles for better agent indexing
-- ============================================================================

-- ============================================================================
-- PART 1: Verify and Enhance Profiles Table
-- ============================================================================

-- Ensure profiles table has all MVP columns
DO $$
BEGIN
  -- Add time_zone column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'time_zone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN time_zone TEXT DEFAULT 'America/New_York';
    RAISE NOTICE 'Added time_zone column to profiles';
  END IF;

  -- Add travel_preferences column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'travel_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN travel_preferences JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added travel_preferences column to profiles';
  END IF;

  -- Add onboarding_completed column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added onboarding_completed column to profiles';
  END IF;

  -- Add full_name column if missing (MVP requires it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
    -- Try to populate from first_name + last_name if they exist
    UPDATE profiles 
    SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);
    RAISE NOTICE 'Added full_name column to profiles';
  END IF;

  -- Add email column if missing (MVP requires it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column to profiles';
  END IF;

  -- Add phone_number column if missing (MVP allows it to be nullable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
    RAISE NOTICE 'Added phone_number column to profiles';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column to profiles';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to profiles';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Enhance Profiles for Better Agent Indexing
-- ============================================================================

-- Add additional columns to help agents index and understand user preferences better
DO $$
BEGIN
  -- Add personal_context JSONB for storing learned preferences, habits, etc.
  -- This allows agents to build a richer understanding of the user over time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'personal_context'
  ) THEN
    ALTER TABLE profiles ADD COLUMN personal_context JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN profiles.personal_context IS 'Stores learned preferences, habits, and context for AI agents';
    RAISE NOTICE 'Added personal_context column to profiles';
  END IF;

  -- Add communication_preferences for how users prefer to be contacted
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'communication_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN communication_preferences JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN profiles.communication_preferences IS 'User preferences for notifications, communication style, etc.';
    RAISE NOTICE 'Added communication_preferences column to profiles';
  END IF;

  -- Add metadata JSONB for flexible storage of additional profile data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE profiles ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN profiles.metadata IS 'Flexible storage for additional profile metadata';
    RAISE NOTICE 'Added metadata column to profiles';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Enhance Travel Preferences Structure
-- ============================================================================

-- Ensure travel_preferences has a good default structure
-- This helps agents understand what fields are available
DO $$
BEGIN
  -- Update empty travel_preferences to have a structured default
  UPDATE profiles
  SET travel_preferences = '{
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
    }
  }'::jsonb
  WHERE travel_preferences = '{}'::jsonb OR travel_preferences IS NULL;
END $$;

-- ============================================================================
-- PART 4: Create/Update Indexes for Performance
-- ============================================================================

-- Index on email for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Index on time_zone for time-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_time_zone ON profiles(time_zone) WHERE time_zone IS NOT NULL;

-- GIN index on travel_preferences for JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_travel_preferences_gin ON profiles USING GIN (travel_preferences);

-- GIN index on personal_context for agent queries
CREATE INDEX IF NOT EXISTS idx_profiles_personal_context_gin ON profiles USING GIN (personal_context);

-- Index on onboarding_completed for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed) WHERE onboarding_completed = false;

-- ============================================================================
-- PART 5: Verify All 10 MVP Tables Exist
-- ============================================================================

-- This is a verification check - will raise errors if tables are missing
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  tbl_name TEXT;
  required_tables TEXT[] := ARRAY[
    'profiles',
    'integrations',
    'entities',
    'relationships',
    'calendar_events',
    'emails',
    'tasks',
    'conversations',
    'notifications',
    'automations'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl_name
    ) THEN
      missing_tables := array_append(missing_tables, tbl_name);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required MVP tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'All 10 MVP tables verified: profiles, integrations, entities, relationships, calendar_events, emails, tasks, conversations, notifications, automations';
  END IF;
END $$;

-- ============================================================================
-- PART 6: Verify RLS is Enabled on All Tables
-- ============================================================================

DO $$
DECLARE
  missing_rls TEXT[] := ARRAY[]::TEXT[];
  tbl_name TEXT;
  required_tables TEXT[] := ARRAY[
    'profiles',
    'integrations',
    'entities',
    'relationships',
    'calendar_events',
    'emails',
    'tasks',
    'conversations',
    'notifications',
    'automations'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY required_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl_name
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' 
      AND tablename = tbl_name
      AND rowsecurity = true
    ) THEN
      -- Try to enable RLS
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
      RAISE NOTICE 'Enabled RLS on table: %', tbl_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 7: Add Updated_at Trigger for Profiles
-- ============================================================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for profiles.updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: Create Helper Function to Get User Profile with Context
-- ============================================================================

-- This function helps agents quickly retrieve all user context
CREATE OR REPLACE FUNCTION get_user_profile_context(p_user_id UUID)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  time_zone TEXT,
  travel_preferences JSONB,
  personal_context JSONB,
  communication_preferences JSONB,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone_number,
    p.time_zone,
    p.travel_preferences,
    p.personal_context,
    p.communication_preferences,
    p.onboarding_completed,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile_context(UUID) TO authenticated;

-- ============================================================================
-- PART 9: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles table - serves as user_profiles in MVP spec. Stores identity, preferences, and context for AI agents.';
COMMENT ON COLUMN profiles.travel_preferences IS 'JSONB structure: {preferred_airlines: [], seat_preference: string, cabin_preference: string, tsa_precheck: string, known_traveler_number: string, meal_preferences: [], special_assistance: [], frequent_destinations: [], booking_preferences: {}}';
COMMENT ON COLUMN profiles.personal_context IS 'JSONB for storing learned preferences, habits, frequent patterns, and other context that helps agents understand the user better';
COMMENT ON COLUMN profiles.communication_preferences IS 'JSONB for notification preferences, communication style, preferred channels, etc.';

-- ============================================================================
-- PART 10: Migration Summary
-- ============================================================================

-- This migration:
-- 1. ✅ Verifies profiles table has all MVP columns
-- 2. ✅ Adds enhanced columns for better agent indexing (personal_context, communication_preferences, metadata)
-- 3. ✅ Creates proper indexes for performance (including GIN indexes for JSONB)
-- 4. ✅ Verifies all 10 MVP tables exist
-- 5. ✅ Ensures RLS is enabled on all tables
-- 6. ✅ Adds updated_at trigger
-- 7. ✅ Creates helper function for agents to retrieve user context
-- 8. ✅ Adds documentation comments

