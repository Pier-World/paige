/*
  PR1 — Privilege lock + Pier+ RLS

  Standard = free. Premium | Executive | Founding Member (or role = admin) = Pier+.
  Authenticated members may UPDATE only safe profile columns. They must not change
  role, membership_level, or billing columns. Deal/directory/storage reads require
  Pier+ (or admin). Events and RSVPs stay open to members. Perks drop anon reads
  and do not enforce minimum_level.

  What could go wrong:
  - A later GRANT ALL ON members TO authenticated would undo the column lock.
  - A buggy is_pier_plus predicate would hide deals from existing Pier+ members.
  - Storage objects without a matching capital_deal_documents row stay admin-only.

  Rollback (local or a follow-up migration; do not apply blindly in production):
    DROP TRIGGER IF EXISTS members_prevent_privilege_escalation ON public.members;
    DROP FUNCTION IF EXISTS public.prevent_members_privilege_escalation();
    DROP FUNCTION IF EXISTS public.is_pier_plus(uuid);
    DROP FUNCTION IF EXISTS public.membership_is_pier_plus(text, text);
    GRANT UPDATE ON TABLE public.members TO authenticated;
    -- Restore prior SELECT policies from 20260512160000, 20260512163000,
    -- 20260621234500, and baseline "Anyone can view perks".
*/

-- ---------------------------------------------------------------------------
-- Helpers (SQL source of truth; TypeScript isPierPlus must match)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.membership_is_pier_plus(p_level text, p_role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE(p_level, '') IN ('Premium', 'Executive', 'Founding Member')
    OR COALESCE(p_role, '') = 'admin';
$$;

COMMENT ON FUNCTION public.membership_is_pier_plus(text, text) IS
  'Pier+ predicate: membership_level IN (Premium, Executive, Founding Member) OR role = admin. Standard is free.';

CREATE OR REPLACE FUNCTION public.is_pier_plus(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE members.id = COALESCE(p_user_id, auth.uid())
      AND public.membership_is_pier_plus(members.membership_level, members.role)
  );
$$;

COMMENT ON FUNCTION public.is_pier_plus(uuid) IS
  'True when the member (default auth.uid()) is Pier+ or an admin. Used by RLS.';

REVOKE ALL ON FUNCTION public.membership_is_pier_plus(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_pier_plus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.membership_is_pier_plus(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pier_plus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.membership_is_pier_plus(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_pier_plus(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- members: authenticated UPDATE limited to safe columns
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_members_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       current_user = 'authenticated'
       OR COALESCE(auth.role(), '') = 'authenticated'
     )
  THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.membership_level IS DISTINCT FROM OLD.membership_level
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
       OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
       OR NEW.cards IS DISTINCT FROM OLD.cards
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.member_id IS DISTINCT FROM OLD.member_id
       OR NEW.id IS DISTINCT FROM OLD.id
    THEN
      RAISE EXCEPTION 'Cannot update privileged member columns'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_prevent_privilege_escalation ON public.members;
CREATE TRIGGER members_prevent_privilege_escalation
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_members_privilege_escalation();

REVOKE ALL ON FUNCTION public.prevent_members_privilege_escalation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_members_privilege_escalation() FROM anon, authenticated;

REVOKE UPDATE ON TABLE public.members FROM anon;
REVOKE UPDATE ON TABLE public.members FROM authenticated;
GRANT UPDATE (
  first_name,
  last_name,
  phone,
  preferences,
  onboarding_completed,
  updated_at
) ON TABLE public.members TO authenticated;

-- ---------------------------------------------------------------------------
-- capital_deals
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view published capital deals" ON public.capital_deals;
CREATE POLICY "Members can view published capital deals"
  ON public.capital_deals FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    AND status IN ('open', 'closing', 'closed')
    AND public.is_pier_plus()
  );

-- ---------------------------------------------------------------------------
-- capital_deal_documents
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view member-access deal documents" ON public.capital_deal_documents;
CREATE POLICY "Members can view member-access deal documents"
  ON public.capital_deal_documents FOR SELECT
  TO authenticated
  USING (
    access_level = 'members'
    AND public.is_pier_plus()
    AND EXISTS (
      SELECT 1 FROM public.capital_deals
      WHERE capital_deals.id = capital_deal_documents.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
  );

DROP POLICY IF EXISTS "Members can view approved-interest deal documents" ON public.capital_deal_documents;
CREATE POLICY "Members can view approved-interest deal documents"
  ON public.capital_deal_documents FOR SELECT
  TO authenticated
  USING (
    access_level = 'approved_interest'
    AND public.is_pier_plus()
    AND EXISTS (
      SELECT 1 FROM public.capital_deals
      WHERE capital_deals.id = capital_deal_documents.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
    AND EXISTS (
      SELECT 1 FROM public.capital_deal_interests
      WHERE capital_deal_interests.deal_id = capital_deal_documents.deal_id
      AND capital_deal_interests.member_id = (SELECT auth.uid())
      AND capital_deal_interests.status IN ('approved', 'intro_scheduled')
    )
  );

-- ---------------------------------------------------------------------------
-- capital_deal_interests
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view own capital deal interests" ON public.capital_deal_interests;
CREATE POLICY "Members can view own capital deal interests"
  ON public.capital_deal_interests FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    AND public.is_pier_plus()
  );

DROP POLICY IF EXISTS "Members can create own capital deal interests" ON public.capital_deal_interests;
CREATE POLICY "Members can create own capital deal interests"
  ON public.capital_deal_interests FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = (SELECT auth.uid())
    AND public.is_pier_plus()
    AND EXISTS (
      SELECT 1 FROM public.capital_deals
      WHERE capital_deals.id = capital_deal_interests.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
  );

-- ---------------------------------------------------------------------------
-- capital_member_profiles (directory + own row)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view active capital member profiles" ON public.capital_member_profiles;
CREATE POLICY "Members can view active capital member profiles"
  ON public.capital_member_profiles FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND published_at IS NOT NULL
    AND public.is_pier_plus()
  );

DROP POLICY IF EXISTS "Members can view own capital member profile" ON public.capital_member_profiles;
CREATE POLICY "Members can view own capital member profile"
  ON public.capital_member_profiles FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    AND public.is_pier_plus()
  );

-- SECURITY DEFINER RPC otherwise bypasses INSERT RLS.
CREATE OR REPLACE FUNCTION public.update_my_capital_member_profile(
  p_role text DEFAULT 'lp',
  p_display_name text DEFAULT NULL,
  p_firm text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_investment_thesis text DEFAULT NULL,
  p_focus_sectors text[] DEFAULT '{}'::text[],
  p_aum_display text DEFAULT NULL,
  p_aum_numeric numeric DEFAULT NULL,
  p_check_size_display text DEFAULT NULL,
  p_check_size_min numeric DEFAULT NULL,
  p_check_size_max numeric DEFAULT NULL,
  p_currency_code text DEFAULT 'USD'
)
RETURNS public.capital_member_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_member_id uuid;
  v_profile public.capital_member_profiles%ROWTYPE;
  v_role text;
  v_display_name text;
  v_firm text;
  v_title text;
  v_location text;
  v_bio text;
  v_investment_thesis text;
  v_focus_sectors text[];
  v_aum_display text;
  v_check_size_display text;
  v_currency_code text;
  v_slug_base text;
  v_slug text;
  v_slug_candidate text;
  v_counter integer := 1;
BEGIN
  v_member_id := auth.uid();

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_pier_plus(v_member_id) THEN
    RAISE EXCEPTION 'Pier+ membership required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = v_member_id) THEN
    RAISE EXCEPTION 'Member record not found'
      USING ERRCODE = '28000';
  END IF;

  v_display_name := NULLIF(btrim(p_display_name), '');
  v_firm := NULLIF(btrim(p_firm), '');
  v_title := NULLIF(btrim(p_title), '');
  v_location := NULLIF(btrim(p_location), '');
  v_bio := NULLIF(btrim(p_bio), '');
  v_investment_thesis := NULLIF(btrim(p_investment_thesis), '');
  v_aum_display := NULLIF(btrim(p_aum_display), '');
  v_check_size_display := NULLIF(btrim(p_check_size_display), '');
  v_currency_code := upper(btrim(coalesce(p_currency_code, 'USD')));
  v_role := lower(btrim(coalesce(p_role, 'lp')));

  IF v_display_name IS NULL THEN
    RAISE EXCEPTION 'display_name is required'
      USING ERRCODE = '22023';
  END IF;

  IF v_firm IS NULL THEN
    RAISE EXCEPTION 'firm is required'
      USING ERRCODE = '22023';
  END IF;

  IF v_role NOT IN ('gp', 'lp') THEN
    RAISE EXCEPTION 'role must be gp or lp'
      USING ERRCODE = '22023';
  END IF;

  IF v_currency_code !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'currency_code must be a 3-letter ISO code'
      USING ERRCODE = '22023';
  END IF;

  IF p_aum_numeric IS NOT NULL AND p_aum_numeric < 0 THEN
    RAISE EXCEPTION 'aum_numeric must be non-negative'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_size_min IS NOT NULL AND p_check_size_min < 0 THEN
    RAISE EXCEPTION 'check_size_min must be non-negative'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_size_max IS NOT NULL AND p_check_size_max < 0 THEN
    RAISE EXCEPTION 'check_size_max must be non-negative'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_size_min IS NOT NULL
    AND p_check_size_max IS NOT NULL
    AND p_check_size_max < p_check_size_min
  THEN
    RAISE EXCEPTION 'check_size_max must be greater than or equal to check_size_min'
      USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(array_agg(sector ORDER BY sector), '{}'::text[])
  INTO v_focus_sectors
  FROM (
    SELECT DISTINCT left(btrim(sector), 80) AS sector
    FROM unnest(coalesce(p_focus_sectors, '{}'::text[])) AS raw_sector(sector)
    WHERE NULLIF(btrim(sector), '') IS NOT NULL
    LIMIT 12
  ) normalized_sectors;

  SELECT *
  INTO v_profile
  FROM public.capital_member_profiles
  WHERE member_id = v_member_id
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.capital_member_profiles
    SET
      display_name = v_display_name,
      firm = v_firm,
      title = v_title,
      location = v_location,
      bio = v_bio,
      investment_thesis = v_investment_thesis,
      focus_sectors = v_focus_sectors,
      aum_display = v_aum_display,
      aum_numeric = p_aum_numeric,
      check_size_display = v_check_size_display,
      check_size_min = p_check_size_min,
      check_size_max = p_check_size_max,
      currency_code = v_currency_code
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;

    RETURN v_profile;
  END IF;

  v_slug_base := lower(regexp_replace(v_display_name || '-' || v_firm, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug_base := trim(both '-' from v_slug_base);

  IF v_slug_base = '' THEN
    v_slug_base := 'capital-member';
  END IF;

  v_slug := trim(both '-' from regexp_replace(
    left(v_slug_base, 80) || '-' || left(replace(v_member_id::text, '-', ''), 8),
    '-+',
    '-',
    'g'
  ));
  v_slug_candidate := v_slug;

  WHILE EXISTS (
    SELECT 1 FROM public.capital_member_profiles
    WHERE slug = v_slug_candidate
    AND member_id IS DISTINCT FROM v_member_id
  ) LOOP
    v_counter := v_counter + 1;
    v_slug_candidate := left(v_slug, 90) || '-' || v_counter::text;
  END LOOP;

  INSERT INTO public.capital_member_profiles (
    member_id,
    slug,
    display_name,
    role,
    firm,
    title,
    location,
    aum_display,
    aum_numeric,
    currency_code,
    focus_sectors,
    bio,
    investment_thesis,
    check_size_display,
    check_size_min,
    check_size_max,
    verified,
    status,
    sort_order,
    published_at
  )
  VALUES (
    v_member_id,
    v_slug_candidate,
    v_display_name,
    v_role,
    v_firm,
    v_title,
    v_location,
    v_aum_display,
    p_aum_numeric,
    v_currency_code,
    v_focus_sectors,
    v_bio,
    v_investment_thesis,
    v_check_size_display,
    p_check_size_min,
    p_check_size_max,
    false,
    'draft',
    0,
    NULL
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_capital_member_profile(
  text, text, text, text, text, text, text, text[], text, numeric, text, numeric, numeric, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_capital_member_profile(
  text, text, text, text, text, text, text, text[], text, numeric, text, numeric, numeric, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage: capital-deal-materials member SELECT requires Pier+
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can select approved capital deal documents" ON storage.objects;
CREATE POLICY "Members can select approved capital deal documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'capital-deal-materials'
    AND public.is_pier_plus()
    AND EXISTS (
      SELECT 1
      FROM public.capital_deal_documents documents
      JOIN public.capital_deals deals ON deals.id = documents.deal_id
      WHERE documents.storage_path = storage.objects.name
      AND deals.published_at IS NOT NULL
      AND deals.status IN ('open', 'closing', 'closed')
      AND (
        documents.access_level = 'members'
        OR (
          documents.access_level = 'approved_interest'
          AND EXISTS (
            SELECT 1 FROM public.capital_deal_interests interests
            WHERE interests.deal_id = documents.deal_id
            AND interests.member_id = (SELECT auth.uid())
            AND interests.status IN ('approved', 'intro_scheduled')
          )
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- perks: authenticated members only (drop anon). No minimum_level check.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view perks" ON public.perks;
CREATE POLICY "Authenticated members can view perks"
  ON public.perks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = (SELECT auth.uid())
    )
  );
