/*
  Security advisor remediation:
  - Harden function search_path (linter 0011)
  - Revoke PostgREST exposure on profile views that touch auth.users
  - Tighten EXECUTE on SECURITY DEFINER and related functions (linter 0028/0029)
  - Drop duplicate FK constraints on user_id -> auth.users

  Operational follow-up (not applied here): move pgvector out of public schema if required
  by policy; upgrade Postgres minor version in the Supabase dashboard when convenient.
*/

-- ---------------------------------------------------------------------------
-- 1. Functions: SET search_path + fully qualified references where needed
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_opportunity_tier(
  confidence integer,
  urgency integer,
  risk integer
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF confidence > 90 AND urgency > 70 AND risk < 30 THEN
    RETURN 'prepared';
  END IF;
  IF confidence > 60 AND urgency > 50 THEN
    RETURN 'action_needed';
  END IF;
  RETURN 'opportunity';
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_old_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.concierge_conversations
  WHERE last_message_at < NOW() - INTERVAL '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_old_opportunities()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.opportunities
  SET status = 'expired',
      updated_at = NOW()
  WHERE status IN ('pending', 'shown', 'snoozed')
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_task_idempotency_key(
  p_user_id uuid,
  p_message text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN encode(
    extensions.digest(p_user_id::text || lower(trim(p_message)), 'sha256'),
    'hex'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_task_with_ui_state(p_task_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  task_type text,
  status text,
  ui_state jsonb,
  confidence_score numeric,
  risk_level text,
  decision_strategy text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.task_type,
    t.status,
    t.ui_state,
    t.confidence_score,
    t.risk_level,
    t.decision_strategy,
    t.created_at,
    t.updated_at
  FROM public.tasks t
  WHERE t.id = p_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_context(p_user_id uuid)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  email text,
  phone_number text,
  time_zone text,
  travel_preferences jsonb,
  personal_context jsonb,
  communication_preferences jsonb,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.should_profile_exist(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.members m WHERE m.id = profile_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = profile_id
  ) OR EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.profile_id = profile_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.concierge_conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_opportunities_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_potential_trips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_patterns_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.members m WHERE m.id = NEW.id) THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.id) THEN
      RAISE WARNING 'Profile id % does not correspond to a member or auth user. Email: %, Name: %',
        NEW.id, NEW.email, NEW.full_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Profile views: remove from anon/authenticated API roles
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.valid_profiles FROM anon;
REVOKE ALL ON TABLE public.valid_profiles FROM authenticated;
REVOKE ALL ON TABLE public.orphaned_profiles_view FROM anon;
REVOKE ALL ON TABLE public.orphaned_profiles_view FROM authenticated;

-- ---------------------------------------------------------------------------
-- 3. Function EXECUTE: lock down client roles; keep service_role where needed
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.delete_old_conversations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_old_conversations() FROM anon;
REVOKE ALL ON FUNCTION public.delete_old_conversations() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_old_conversations() TO service_role;

REVOKE ALL ON FUNCTION public.get_task_with_ui_state(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_task_with_ui_state(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_task_with_ui_state(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_with_ui_state(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_profile_context(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_profile_context(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_profile_context(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_context(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.update_conversation_last_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_conversation_last_message() FROM anon;
REVOKE ALL ON FUNCTION public.update_conversation_last_message() FROM authenticated;

REVOKE ALL ON FUNCTION public.calculate_opportunity_tier(integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_opportunity_tier(integer, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.calculate_opportunity_tier(integer, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_opportunity_tier(integer, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.expire_old_opportunities() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_old_opportunities() FROM anon;
REVOKE ALL ON FUNCTION public.expire_old_opportunities() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_opportunities() TO service_role;

REVOKE ALL ON FUNCTION public.generate_task_idempotency_key(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_task_idempotency_key(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.generate_task_idempotency_key(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_task_idempotency_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.should_profile_exist(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.should_profile_exist(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.should_profile_exist(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.should_profile_exist(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.update_opportunities_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_opportunities_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_opportunities_updated_at() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_potential_trips_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_potential_trips_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_potential_trips_updated_at() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_user_patterns_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_user_patterns_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_user_patterns_updated_at() FROM authenticated;

REVOKE ALL ON FUNCTION public.validate_profile_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_profile_owner() FROM anon;
REVOKE ALL ON FUNCTION public.validate_profile_owner() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_my_capital_member_profile(
  text, text, text, text, text, text, text, text[], text, numeric, text, numeric, numeric, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_capital_member_profile(
  text, text, text, text, text, text, text, text[], text, numeric, text, numeric, numeric, text
) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_my_capital_member_profile(
  text, text, text, text, text, text, text, text[], text, numeric, text, numeric, numeric, text
) TO authenticated;

-- Trigger targets: firing role still needs EXECUTE (revoked from anon; keep authenticated + service_role).
GRANT EXECUTE ON FUNCTION public.update_conversation_last_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_last_message() TO service_role;

GRANT EXECUTE ON FUNCTION public.validate_profile_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_profile_owner() TO service_role;

GRANT EXECUTE ON FUNCTION public.update_opportunities_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_opportunities_updated_at() TO service_role;

GRANT EXECUTE ON FUNCTION public.update_potential_trips_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_potential_trips_updated_at() TO service_role;

GRANT EXECUTE ON FUNCTION public.update_user_patterns_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_patterns_updated_at() TO service_role;

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Drop duplicate foreign keys (same column -> auth.users)
-- ---------------------------------------------------------------------------

ALTER TABLE public.daily_briefs DROP CONSTRAINT IF EXISTS fk_daily_briefs_user;

ALTER TABLE public.email_context DROP CONSTRAINT IF EXISTS fk_email_context_user;

ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS fk_opportunities_user;

ALTER TABLE public.potential_trips DROP CONSTRAINT IF EXISTS fk_potential_trips_user;

ALTER TABLE public.user_patterns DROP CONSTRAINT IF EXISTS fk_user_patterns_user;
