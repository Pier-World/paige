-- When a row is inserted into auth.users (dashboard invite, sign-up, admin API, etc.),
-- ensure public.members and public.profiles exist so the member portal can load the user.
-- create-member edge function uses upsert on members so it can overwrite stub rows with full billing data.

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

  IF v_first IS NULL AND v_last IS NULL THEN
    v_first := split_part(v_email, '@', 1);
    v_last := 'Member';
  ELSIF v_first IS NULL THEN
    v_first := split_part(v_email, '@', 1);
  ELSIF v_last IS NULL OR v_last = '' THEN
    v_last := 'Member';
  END IF;

  v_member_id := 'PIER-' || substr(replace(NEW.id::text, '-', ''), 1, 12);

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
  ON CONFLICT (id) DO NOTHING;

  v_full_name := trim(both ' ' from coalesce(v_first, '') || ' ' || coalesce(v_last, ''));
  IF v_full_name = '' THEN
    v_full_name := split_part(v_email, '@', 1);
  END IF;

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
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_auth_user() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

COMMENT ON FUNCTION public.handle_new_auth_user() IS
  'Bootstraps public.members and public.profiles when auth.users gains a row (invite, admin create, etc.).';

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;

-- Backfill: any auth user missing members or profiles (e.g. created before this migration).
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
SELECT
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'first_name'), ''), split_part(u.email, '@', 1)),
  coalesce(nullif(trim(u.raw_user_meta_data->>'last_name'), ''), 'Member'),
  u.email,
  null,
  'member',
  'PIER-' || substr(replace(u.id::text, '-', ''), 1, 12),
  'Standard',
  false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.members m WHERE m.id = u.id)
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
ON CONFLICT (id) DO NOTHING;

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
SELECT
  u.id,
  u.email,
  trim(both ' ' from
    coalesce(nullif(trim(u.raw_user_meta_data->>'first_name'), ''), split_part(u.email, '@', 1))
    || ' '
    || coalesce(nullif(trim(u.raw_user_meta_data->>'last_name'), ''), 'Member')
  ),
  false,
  'America/New_York',
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
ON CONFLICT (id) DO NOTHING;

-- Staff admin promotion (idempotent; pairs with 20260513000000_admin_staff_joinpier_emails.sql).
UPDATE public.members
SET
  role = 'admin',
  membership_level = 'Executive',
  onboarding_completed = true,
  updated_at = now()
WHERE lower(btrim(email)) IN (
  'spencer@joinpier.com',
  'hello@joinpier.com'
);
