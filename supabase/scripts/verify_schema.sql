-- ============================================================================
-- Database Schema Verification Script
-- Run this to check the current state of your database schema
-- ============================================================================

-- ============================================================================
-- PART 1: Check Profiles Table Structure
-- ============================================================================

SELECT 
  'PROFILES TABLE CHECK' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 2: Check All MVP Tables Exist
-- ============================================================================

SELECT 
  'MVP TABLES CHECK' as check_type,
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('profiles'),
  ('integrations'),
  ('entities'),
  ('relationships'),
  ('calendar_events'),
  ('emails'),
  ('tasks'),
  ('conversations'),
  ('notifications'),
  ('automations')
) AS t(table_name);

-- ============================================================================
-- PART 3: Check Required Columns in Profiles
-- ============================================================================

SELECT 
  'PROFILES COLUMNS CHECK' as check_type,
  column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = c.column_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('id'),
  ('full_name'),
  ('email'),
  ('phone_number'),
  ('time_zone'),
  ('travel_preferences'),
  ('onboarding_completed'),
  ('created_at'),
  ('updated_at')
) AS c(column_name);

-- ============================================================================
-- PART 4: Check Enhanced Columns (for agent indexing)
-- ============================================================================

SELECT 
  'ENHANCED COLUMNS CHECK' as check_type,
  column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = c.column_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('personal_context'),
  ('communication_preferences'),
  ('metadata')
) AS c(column_name);

-- ============================================================================
-- PART 5: Check Indexes on Profiles
-- ============================================================================

SELECT 
  'PROFILES INDEXES CHECK' as check_type,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY indexname;

-- ============================================================================
-- PART 6: Check RLS Status
-- ============================================================================

SELECT 
  'RLS STATUS CHECK' as check_type,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
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
  )
ORDER BY tablename;

-- ============================================================================
-- PART 7: Check RLS Policies
-- ============================================================================

SELECT 
  'RLS POLICIES CHECK' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
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
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 8: Sample Profile Data Structure
-- ============================================================================

SELECT 
  'SAMPLE PROFILE DATA' as check_type,
  id,
  full_name,
  email,
  time_zone,
  travel_preferences,
  personal_context,
  onboarding_completed
FROM profiles
LIMIT 1;

-- ============================================================================
-- PART 9: Count Records in Each MVP Table
-- ============================================================================

SELECT 
  'TABLE RECORD COUNTS' as check_type,
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'integrations',
  COUNT(*)
FROM integrations
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'entities',
  COUNT(*)
FROM entities
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'relationships',
  COUNT(*)
FROM relationships
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'calendar_events',
  COUNT(*)
FROM calendar_events
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'emails',
  COUNT(*)
FROM emails
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'tasks',
  COUNT(*)
FROM tasks
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'conversations',
  COUNT(*)
FROM conversations
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'notifications',
  COUNT(*)
FROM notifications
UNION ALL
SELECT 
  'TABLE RECORD COUNTS',
  'automations',
  COUNT(*)
FROM automations;

