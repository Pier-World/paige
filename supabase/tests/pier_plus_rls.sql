-- Pier+ helper + privilege-lock assertions.
-- Run locally only: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pier_plus_rls.sql
-- Rolls back. Does not touch production, send email, or create auth users.

BEGIN;

DO $$
BEGIN
  ASSERT public.membership_is_pier_plus('Standard', 'member') IS FALSE,
    'Standard member is not Pier+';
  ASSERT public.membership_is_pier_plus('Premium', 'member') IS TRUE,
    'Premium member is Pier+';
  ASSERT public.membership_is_pier_plus('Executive', 'member') IS TRUE,
    'Executive member is Pier+';
  ASSERT public.membership_is_pier_plus('Founding Member', 'member') IS TRUE,
    'Founding Member is Pier+';
  ASSERT public.membership_is_pier_plus('Standard', 'admin') IS TRUE,
    'admin role is Pier+ even on Standard';
  ASSERT public.membership_is_pier_plus('Pro', 'member') IS FALSE,
    'unknown tier Pro must never map to Pier+';
  ASSERT public.membership_is_pier_plus('Core', 'member') IS FALSE,
    'unknown tier Core must never map to Pier+';
  ASSERT public.membership_is_pier_plus(NULL, NULL) IS FALSE,
    'null membership is not Pier+';
  ASSERT public.is_pier_plus(NULL) IS FALSE,
    'is_pier_plus with no user is false';
END $$;

-- Column privileges: authenticated may not UPDATE role / membership_level / billing.
DO $$
DECLARE
  v_cols text[];
BEGIN
  SELECT coalesce(array_agg(privilege_type || ':' || column_name ORDER BY column_name), '{}')
  INTO v_cols
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'members'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE';

  ASSERT 'UPDATE:first_name' = ANY (v_cols), 'authenticated UPDATE first_name';
  ASSERT 'UPDATE:last_name' = ANY (v_cols), 'authenticated UPDATE last_name';
  ASSERT 'UPDATE:phone' = ANY (v_cols), 'authenticated UPDATE phone';
  ASSERT 'UPDATE:preferences' = ANY (v_cols), 'authenticated UPDATE preferences';
  ASSERT 'UPDATE:onboarding_completed' = ANY (v_cols), 'authenticated UPDATE onboarding_completed';
  ASSERT 'UPDATE:updated_at' = ANY (v_cols), 'authenticated UPDATE updated_at';
  ASSERT NOT ('UPDATE:role' = ANY (v_cols)), 'authenticated must not UPDATE role';
  ASSERT NOT ('UPDATE:membership_level' = ANY (v_cols)), 'authenticated must not UPDATE membership_level';
  ASSERT NOT ('UPDATE:stripe_customer_id' = ANY (v_cols)), 'authenticated must not UPDATE stripe_customer_id';
  ASSERT NOT ('UPDATE:subscription_status' = ANY (v_cols)), 'authenticated must not UPDATE subscription_status';
  ASSERT NOT ('UPDATE:subscription_tier' = ANY (v_cols)), 'authenticated must not UPDATE subscription_tier';
  ASSERT NOT ('UPDATE:trial_ends_at' = ANY (v_cols)), 'authenticated must not UPDATE trial_ends_at';
  ASSERT NOT ('UPDATE:cards' = ANY (v_cols)), 'authenticated must not UPDATE cards';
  ASSERT NOT ('UPDATE:email' = ANY (v_cols)), 'authenticated must not UPDATE email';
END $$;

-- Policy names / qualifiers: Pier+ tables use is_pier_plus; events do not; perks drop anon.
DO $$
DECLARE
  v_qual text;
  v_roles text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid), array_to_string(polroles::regrole[], ',')
  INTO v_qual, v_roles
  FROM pg_policy
  WHERE polrelid = 'public.capital_deals'::regclass
    AND polname = 'Members can view published capital deals';
  ASSERT v_qual ILIKE '%is_pier_plus%', 'capital_deals member SELECT requires is_pier_plus';

  SELECT pg_get_expr(polqual, polrelid)
  INTO v_qual
  FROM pg_policy
  WHERE polrelid = 'public.capital_deal_documents'::regclass
    AND polname = 'Members can view member-access deal documents';
  ASSERT v_qual ILIKE '%is_pier_plus%', 'deal documents member SELECT requires is_pier_plus';

  SELECT pg_get_expr(polqual, polrelid)
  INTO v_qual
  FROM pg_policy
  WHERE polrelid = 'public.capital_deal_interests'::regclass
    AND polname = 'Members can view own capital deal interests';
  ASSERT v_qual ILIKE '%is_pier_plus%', 'deal interests SELECT requires is_pier_plus';

  SELECT pg_get_expr(polwithcheck, polrelid)
  INTO v_qual
  FROM pg_policy
  WHERE polrelid = 'public.capital_deal_interests'::regclass
    AND polname = 'Members can create own capital deal interests';
  ASSERT v_qual ILIKE '%is_pier_plus%', 'deal interests INSERT requires is_pier_plus';

  SELECT pg_get_expr(polqual, polrelid)
  INTO v_qual
  FROM pg_policy
  WHERE polrelid = 'public.capital_member_profiles'::regclass
    AND polname = 'Members can view active capital member profiles';
  ASSERT v_qual ILIKE '%is_pier_plus%', 'directory SELECT requires is_pier_plus';

  SELECT pg_get_expr(polqual, polrelid)
  INTO v_qual
  FROM pg_policy
  WHERE polrelid = 'storage.objects'::regclass
    AND polname = 'Members can select approved capital deal documents';
  ASSERT v_qual ILIKE '%is_pier_plus%', 'deal storage member SELECT requires is_pier_plus';

  SELECT pg_get_expr(polqual, polrelid)
  INTO v_qual
  FROM pg_policy
  WHERE polrelid = 'public.capital_events'::regclass
    AND polname = 'Members can view published capital events';
  ASSERT v_qual IS NOT NULL, 'capital_events member SELECT must still exist';
  ASSERT v_qual NOT ILIKE '%is_pier_plus%', 'capital_events must stay open to members';

  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.perks'::regclass
      AND polname = 'Anyone can view perks'
  ), 'anon perks policy must be removed';

  SELECT array_to_string(polroles::regrole[], ',')
  INTO v_roles
  FROM pg_policy
  WHERE polrelid = 'public.perks'::regclass
    AND polname = 'Authenticated members can view perks';
  ASSERT v_roles NOT ILIKE '%anon%', 'perks SELECT must not include anon';
  ASSERT pg_get_expr(
    (SELECT polqual FROM pg_policy WHERE polrelid = 'public.perks'::regclass AND polname = 'Authenticated members can view perks'),
    'public.perks'::regclass
  ) NOT ILIKE '%minimum_level%', 'do not enforce perks.minimum_level this round';
END $$;

DO $$
BEGIN
  ASSERT public.hash_member_invite_token('abc') = encode(extensions.digest(convert_to('abc', 'UTF8'), 'sha256'), 'hex'),
    'invite token hash is sha256 hex';
  ASSERT public.validate_member_invite('') = jsonb_build_object('valid', false),
    'empty invite token is invalid without enumerating emails';
  ASSERT public.validate_member_invite('unknown-token') = jsonb_build_object('valid', false),
    'unknown invite token is invalid';
END $$;

ROLLBACK;
