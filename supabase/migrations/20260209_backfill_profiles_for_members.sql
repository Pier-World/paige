-- Backfill profiles for all members that don't have a profile.
-- Ensures every member has a profile row for onboarding_completed and personal_context.
-- Safe to run multiple times: only inserts where no profile exists for that id.

INSERT INTO profiles (
  id,
  full_name,
  email,
  phone_number,
  onboarding_completed,
  personal_context,
  time_zone,
  travel_preferences,
  communication_preferences,
  metadata,
  created_at,
  updated_at
)
SELECT
  m.id,
  TRIM(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, '')) AS full_name,
  m.email,
  NULLIF(TRIM(m.phone), '') AS phone_number,
  false AS onboarding_completed,
  jsonb_build_object(
    'interests', COALESCE((m.preferences->'interests'), '[]'::jsonb),
    'preferred_cities', COALESCE((m.preferences->'preferred_cities'), '[]'::jsonb)
  ) AS personal_context,
  'America/New_York' AS time_zone,
  '{}'::jsonb AS travel_preferences,
  '{}'::jsonb AS communication_preferences,
  '{}'::jsonb AS metadata,
  COALESCE(m.created_at, NOW()) AS created_at,
  NOW() AS updated_at
FROM members m
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = m.id
)
ON CONFLICT (id) DO NOTHING;
