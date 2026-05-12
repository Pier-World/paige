/*
  REVIEW ONLY: remote user/auth data reset.

  Do not run this file until:
  1. supabase/.temp/repair-reset-backups/remote_public_schema.sql exists.
  2. supabase/.temp/repair-reset-backups/remote_preserve_data.sql exists.
  3. The team confirms current Supabase Auth users can be deleted.

  This is intentionally outside supabase/migrations so it is never applied by
  local reset or db push. It preserves curated catalog/secret-bearing tables,
  including api_credentials, hotels, perks, events, and capital catalog tables.
*/

BEGIN;

DO $$
DECLARE
  reset_tables text[] := ARRAY[
    -- Capital member-submitted workflow rows. Catalog tables are preserved.
    'public.capital_deal_interests',
    'public.capital_event_rsvps',
    'public.capital_partner_intros',

    -- Generated/user intelligence and notification data.
    'public.recommendation_events',
    'public.notifications',
    'public.opportunities',
    'public.daily_briefs',
    'public.user_patterns',
    'public.email_context',
    'public.relationships',
    'public.calendar_events',
    'public.automations',
    'public.user_hotel_preferences',

    -- User communication, travel, request, and task history.
    'public.concierge_messages',
    'public.messages',
    'public.activities',
    'public.offers',
    'public.conversations',
    'public.requests',
    'public.tasks',
    'public.potential_trips',
    'public.emails',
    'public.entities',
    'public.trips',
    'public.channels',
    'public.user_context_history',
    'public.user_preferences',
    'public.travel_requests',
    'public.membership_changes',
    'public.concierge_conversations',

    -- Connected-account tokens are user-owned and should be cleared when Auth is reset.
    'public.integrations',

    -- App user/profile rows. Auth users are deleted after these public rows.
    'public.profiles',
    'public.members'
  ];
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY reset_tables LOOP
    IF to_regclass(table_name) IS NOT NULL THEN
      EXECUTE format('DELETE FROM %s', table_name);
      RAISE NOTICE 'Deleted user-owned data from %', table_name;
    ELSE
      RAISE NOTICE 'Skipped missing table %', table_name;
    END IF;
  END LOOP;
END $$;

-- Deletes Supabase Auth users and cascades auth-owned identities/sessions.
DELETE FROM auth.users;

-- Post-reset verification. These should be zero after the reset.
WITH checks(schema_name, table_name) AS (
  VALUES
    ('auth', 'users'),
    ('public', 'members'),
    ('public', 'profiles'),
    ('public', 'integrations'),
    ('public', 'requests'),
    ('public', 'messages'),
    ('public', 'tasks'),
    ('public', 'user_preferences'),
    ('public', 'user_hotel_preferences')
)
SELECT
  schema_name,
  table_name,
  CASE
    WHEN to_regclass(format('%I.%I', schema_name, table_name)) IS NULL THEN NULL
    ELSE (
      xpath(
        '/row/count/text()',
        query_to_xml(format('SELECT count(*) AS count FROM %I.%I', schema_name, table_name), false, true, '')
      )
    )[1]::text::bigint
  END AS row_count
FROM checks
ORDER BY schema_name, table_name;

-- Preserve-table verification. These should remain non-zero where currently populated.
WITH checks(schema_name, table_name) AS (
  VALUES
    ('public', 'api_credentials'),
    ('public', 'hotels'),
    ('public', 'perks'),
    ('public', 'events'),
    ('public', 'capital_member_profiles'),
    ('public', 'capital_deals'),
    ('public', 'capital_events'),
    ('public', 'capital_partners')
)
SELECT
  schema_name,
  table_name,
  CASE
    WHEN to_regclass(format('%I.%I', schema_name, table_name)) IS NULL THEN NULL
    ELSE (
      xpath(
        '/row/count/text()',
        query_to_xml(format('SELECT count(*) AS count FROM %I.%I', schema_name, table_name), false, true, '')
      )
    )[1]::text::bigint
  END AS row_count
FROM checks
ORDER BY schema_name, table_name;

COMMIT;
