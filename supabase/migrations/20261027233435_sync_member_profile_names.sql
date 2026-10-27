/*
  Keep public.members first/last name and public.profiles.full_name in sync.

  Root cause:
  - handle_new_auth_user bootstraps both rows from auth metadata, defaulting to
    "<email local> Member" when names are missing, then ON CONFLICT DO NOTHING.
  - Later writes often update members only (import, admin, first/last fields).
  - The app prefers profiles.full_name when present, so member names never show.

  This migration:
  - Adds bidirectional AFTER INSERT OR UPDATE triggers (loop-safe).
  - Never overwrites a populated name with an empty one.
  - Backfills existing profile.full_name from members when they differ.
  - Teaches handle_new_auth_user to read full_name metadata and to refresh
    stub profile names when the member row already exists.
*/

CREATE OR REPLACE FUNCTION public.compose_member_full_name(p_first text, p_last text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT NULLIF(
    btrim(concat_ws(' ', NULLIF(btrim(p_first), ''), NULLIF(btrim(p_last), ''))),
    ''
  );
$$;

COMMENT ON FUNCTION public.compose_member_full_name(text, text) IS
  'Join first and last name, skipping blanks. Null when both are empty.';

CREATE OR REPLACE FUNCTION public.split_member_full_name(p_full text)
RETURNS TABLE (first_name text, last_name text)
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    NULLIF(btrim(split_part(v.full_name, ' ', 1)), '') AS first_name,
    CASE
      WHEN v.full_name LIKE '% %'
        THEN NULLIF(btrim(substr(v.full_name, strpos(v.full_name, ' ') + 1)), '')
      ELSE NULL
    END AS last_name
  FROM (SELECT btrim(COALESCE(p_full, '')) AS full_name) v;
$$;

COMMENT ON FUNCTION public.split_member_full_name(text) IS
  'Split a full name into first token + remainder. Single-word names have a null last name.';

CREATE OR REPLACE FUNCTION public.sync_profile_full_name_from_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.first_name IS NOT DISTINCT FROM OLD.first_name
     AND NEW.last_name IS NOT DISTINCT FROM OLD.last_name THEN
    RETURN NEW;
  END IF;

  v_full := public.compose_member_full_name(NEW.first_name, NEW.last_name);
  IF v_full IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET full_name = v_full
  WHERE id = NEW.id
    AND full_name IS DISTINCT FROM v_full;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_profile_full_name_from_member() IS
  'Copies members first/last into profiles.full_name. Skips nested trigger calls and empty names.';

CREATE OR REPLACE FUNCTION public.sync_member_name_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full text;
  v_first text;
  v_last text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  v_full := NULLIF(btrim(COALESCE(NEW.full_name, '')), '');
  IF v_full IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.full_name IS NOT DISTINCT FROM OLD.full_name THEN
    RETURN NEW;
  END IF;

  SELECT s.first_name, s.last_name
  INTO v_first, v_last
  FROM public.split_member_full_name(v_full) AS s;

  IF v_first IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.members
  SET
    first_name = v_first,
    last_name = COALESCE(v_last, '')
  WHERE id = NEW.id
    AND (
      first_name IS DISTINCT FROM v_first
      OR last_name IS DISTINCT FROM COALESCE(v_last, '')
    );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_member_name_from_profile() IS
  'Copies profiles.full_name into members first/last. Skips nested trigger calls and empty names.';

DROP TRIGGER IF EXISTS members_sync_profile_full_name ON public.members;
CREATE TRIGGER members_sync_profile_full_name
  AFTER INSERT OR UPDATE OF first_name, last_name ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_full_name_from_member();

DROP TRIGGER IF EXISTS profiles_sync_member_name ON public.profiles;
CREATE TRIGGER profiles_sync_member_name
  AFTER INSERT OR UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_name_from_profile();

REVOKE ALL ON FUNCTION public.compose_member_full_name(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.split_member_full_name(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_profile_full_name_from_member() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_member_name_from_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.compose_member_full_name(text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.split_member_full_name(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_full_name_from_member() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_member_name_from_profile() FROM anon, authenticated;

-- Backfill: member names are canonical when present.
UPDATE public.profiles AS p
SET full_name = public.compose_member_full_name(m.first_name, m.last_name)
FROM public.members AS m
WHERE p.id = m.id
  AND public.compose_member_full_name(m.first_name, m.last_name) IS NOT NULL
  AND p.full_name IS DISTINCT FROM public.compose_member_full_name(m.first_name, m.last_name);

-- Reverse: if the member row is still the email-local stub and profile has a real name.
UPDATE public.members AS m
SET
  first_name = s.first_name,
  last_name = COALESCE(s.last_name, '')
FROM public.profiles AS p
CROSS JOIN LATERAL public.split_member_full_name(p.full_name) AS s
WHERE m.id = p.id
  AND s.first_name IS NOT NULL
  AND lower(btrim(m.last_name)) = 'member'
  AND lower(btrim(m.first_name)) = lower(split_part(m.email, '@', 1))
  AND lower(btrim(p.full_name)) IS DISTINCT FROM lower(btrim(m.first_name) || ' member');

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_email text;
  v_first text;
  v_last text;
  v_meta_full text;
  v_member_id text;
  v_full_name text;
BEGIN
  v_email := coalesce(nullif(trim(NEW.email), ''), '');
  IF v_email = '' THEN
    RAISE WARNING 'handle_new_auth_user: auth user % has no email; skipping member/profile bootstrap', NEW.id;
    RETURN NEW;
  END IF;

  v_first := nullif(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_last := nullif(trim(NEW.raw_user_meta_data->>'last_name'), '');
  v_meta_full := nullif(trim(NEW.raw_user_meta_data->>'full_name'), '');

  IF v_first IS NULL AND v_last IS NULL AND v_meta_full IS NOT NULL THEN
    SELECT s.first_name, s.last_name
    INTO v_first, v_last
    FROM public.split_member_full_name(v_meta_full) AS s;
  END IF;

  IF v_first IS NULL AND v_last IS NULL THEN
    v_first := split_part(v_email, '@', 1);
    v_last := 'Member';
  ELSIF v_first IS NULL THEN
    v_first := split_part(v_email, '@', 1);
  ELSIF v_last IS NULL THEN
    v_last := 'Member';
  END IF;

  v_member_id := 'PIER-' || substr(replace(NEW.id::text, '-', ''), 1, 12);
  v_full_name := public.compose_member_full_name(v_first, v_last);
  IF v_full_name IS NULL THEN
    v_full_name := split_part(v_email, '@', 1);
  END IF;

  INSERT INTO public.members (
    id,
    first_name,
    last_name,
    email,
    phone,
    role,
    member_id,
    membership_level,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    v_first,
    v_last,
    v_email,
    null,
    'member',
    v_member_id,
    'Standard',
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name
  WHERE lower(btrim(members.last_name)) = 'member'
    AND lower(btrim(members.first_name)) = lower(split_part(members.email, '@', 1))
    AND (
      lower(btrim(EXCLUDED.last_name)) IS DISTINCT FROM 'member'
      OR lower(btrim(EXCLUDED.first_name)) IS DISTINCT FROM lower(split_part(members.email, '@', 1))
    );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    onboarding_completed,
    time_zone,
    travel_preferences,
    personal_context,
    communication_preferences,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_email,
    v_full_name,
    false,
    'America/New_York',
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = COALESCE(EXCLUDED.email, profiles.email)
  WHERE (
      profiles.full_name IS NULL
      OR btrim(profiles.full_name) = ''
      OR lower(btrim(profiles.full_name)) = lower(split_part(COALESCE(profiles.email, EXCLUDED.email, ''), '@', 1) || ' member')
    )
    AND EXCLUDED.full_name IS DISTINCT FROM profiles.full_name;

  RETURN NEW;
END;
$$;
