/*
  # Capital member profile self-service draft setup

  Adds optional content fields and a constrained RPC for members to create or
  update their own capital profile content without granting broad UPDATE access.
*/

ALTER TABLE capital_member_profiles
ADD COLUMN IF NOT EXISTS investment_thesis text,
ADD COLUMN IF NOT EXISTS check_size_display text,
ADD COLUMN IF NOT EXISTS check_size_min numeric(16, 2),
ADD COLUMN IF NOT EXISTS check_size_max numeric(16, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'capital_member_profiles_check_size_min_check'
  ) THEN
    ALTER TABLE capital_member_profiles
    ADD CONSTRAINT capital_member_profiles_check_size_min_check
    CHECK (check_size_min IS NULL OR check_size_min >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'capital_member_profiles_check_size_max_check'
  ) THEN
    ALTER TABLE capital_member_profiles
    ADD CONSTRAINT capital_member_profiles_check_size_max_check
    CHECK (check_size_max IS NULL OR check_size_max >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'capital_member_profiles_check_size_range_check'
  ) THEN
    ALTER TABLE capital_member_profiles
    ADD CONSTRAINT capital_member_profiles_check_size_range_check
    CHECK (
      check_size_min IS NULL
      OR check_size_max IS NULL
      OR check_size_max >= check_size_min
    );
  END IF;
END $$;

COMMENT ON COLUMN capital_member_profiles.investment_thesis IS 'Member-supplied capital markets thesis or allocation focus. Publication remains Pier-controlled.';
COMMENT ON COLUMN capital_member_profiles.check_size_display IS 'Display label for typical capital commitment or check size.';
COMMENT ON COLUMN capital_member_profiles.check_size_min IS 'Optional lower bound for typical capital commitment or check size.';
COMMENT ON COLUMN capital_member_profiles.check_size_max IS 'Optional upper bound for typical capital commitment or check size.';

DROP POLICY IF EXISTS "Members can view own capital member profile" ON capital_member_profiles;
CREATE POLICY "Members can view own capital member profile"
  ON capital_member_profiles FOR SELECT
  TO authenticated
  USING (member_id = (select auth.uid()));

CREATE OR REPLACE FUNCTION update_my_capital_member_profile(
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
RETURNS capital_member_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_profile capital_member_profiles%ROWTYPE;
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

  IF NOT EXISTS (SELECT 1 FROM members WHERE id = v_member_id) THEN
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
  FROM capital_member_profiles
  WHERE member_id = v_member_id
  LIMIT 1;

  IF FOUND THEN
    UPDATE capital_member_profiles
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
    SELECT 1 FROM capital_member_profiles
    WHERE slug = v_slug_candidate
    AND member_id IS DISTINCT FROM v_member_id
  ) LOOP
    v_counter := v_counter + 1;
    v_slug_candidate := left(v_slug, 90) || '-' || v_counter::text;
  END LOOP;

  INSERT INTO capital_member_profiles (
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

REVOKE ALL ON FUNCTION update_my_capital_member_profile(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  text,
  numeric,
  text,
  numeric,
  numeric,
  text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION update_my_capital_member_profile(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  text,
  numeric,
  text,
  numeric,
  numeric,
  text
) TO authenticated;
