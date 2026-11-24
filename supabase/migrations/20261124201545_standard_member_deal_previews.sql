/*
  Standard members can preview published deals on the dashboard and deal pages.

  Full capital_deals rows stay Pier+ (or admin) via the existing SELECT policy.
  This function bypasses RLS, so it must:
  - require an authenticated member
  - return only published open, closing, or closed deals
  - return marketing fields plus boolean hints for redacted terms
  - never return performance, terms, contacts, documents, or internal notes
*/

CREATE OR REPLACE FUNCTION public.published_capital_deal_previews(
  p_id uuid DEFAULT NULL,
  p_slug text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  manager_name text,
  deal_type text,
  asset_class text,
  status text,
  geography text,
  sectors text[],
  description text,
  why_pier_selected text,
  published_at timestamptz,
  sort_order integer,
  has_target boolean,
  has_min_commitment boolean,
  has_return boolean,
  has_close_date boolean,
  has_progress boolean,
  has_holding_period boolean,
  has_liquidity boolean,
  has_vintage boolean,
  has_moic boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    deals.id,
    deals.slug,
    deals.name,
    deals.manager_name,
    deals.deal_type,
    deals.asset_class,
    deals.status,
    deals.geography,
    deals.sectors,
    deals.description,
    COALESCE(NULLIF(btrim(deals.why_pier_selected), ''), NULLIF(btrim(deals.thesis), '')) AS why_pier_selected,
    deals.published_at,
    deals.sort_order,
    deals.target_size > 0 AS has_target,
    COALESCE(deals.min_commitment, 0) > 0 AS has_min_commitment,
    CASE
      WHEN deals.return_metric_type = 'none' THEN false
      WHEN deals.return_metric_type = 'custom' AND btrim(COALESCE(deals.return_display, '')) <> '' THEN true
      WHEN deals.return_metric_type = 'moic' AND COALESCE(deals.moic_target, 0) > 0 THEN true
      WHEN deals.return_metric_type = 'yield' AND btrim(COALESCE(deals.return_display, '')) <> '' THEN true
      WHEN deals.return_metric_type = 'irr' AND COALESCE(deals.target_irr, 0) > 0 THEN true
      WHEN btrim(COALESCE(deals.return_display, '')) <> '' THEN true
      WHEN COALESCE(deals.target_irr, 0) > 0 THEN true
      WHEN COALESCE(deals.moic_target, 0) > 0 THEN true
      ELSE false
    END AS has_return,
    deals.close_date IS NOT NULL AS has_close_date,
    (
      deals.target_size > 0
      OR deals.raised_size > 0
      OR deals.allocation_subscribed_percent > 0
    ) AS has_progress,
    COALESCE(deals.holding_period_years, 0) > 0 AS has_holding_period,
    btrim(COALESCE(deals.liquidity_note, '')) <> '' AS has_liquidity,
    COALESCE(deals.vintage, 0) > 0 AS has_vintage,
    deals.return_metric_type = 'irr' AND COALESCE(deals.moic_target, 0) > 0 AS has_moic
  FROM public.capital_deals AS deals
  WHERE auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.members
      WHERE members.id = auth.uid()
    )
    AND deals.published_at IS NOT NULL
    AND deals.status IN ('open', 'closing', 'closed')
    AND (p_id IS NULL OR deals.id = p_id)
    AND (NULLIF(btrim(COALESCE(p_slug, '')), '') IS NULL OR deals.slug = p_slug)
  ORDER BY
    CASE deals.status
      WHEN 'closing' THEN 0
      WHEN 'open' THEN 1
      WHEN 'closed' THEN 2
      ELSE 3
    END,
    deals.close_date ASC NULLS LAST,
    deals.sort_order ASC,
    deals.published_at DESC;
$$;

COMMENT ON FUNCTION public.published_capital_deal_previews(uuid, text) IS
  'Published deal previews for any member. Performance, terms, contacts, and internal notes are omitted. Full rows remain on capital_deals for Pier+ and admins.';

REVOKE ALL ON FUNCTION public.published_capital_deal_previews(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.published_capital_deal_previews(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.published_capital_deal_previews(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.published_capital_deal_previews(uuid, text) TO service_role;
