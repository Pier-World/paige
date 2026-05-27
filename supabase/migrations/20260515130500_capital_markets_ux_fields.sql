/*
  Capital markets UX fields: events host/audience, deal return metrics, partner location.
  Migrates event_type tour → experience.

  Must run before 20260515131000_seed_capital_markets_population.sql (seed references these columns).
*/

-- capital_events
ALTER TABLE public.capital_events
  ADD COLUMN IF NOT EXISTS host_type text NOT NULL DEFAULT 'pier',
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS host_name text,
  ADD COLUMN IF NOT EXISTS location_is_public boolean NOT NULL DEFAULT false;

ALTER TABLE public.capital_events
  DROP CONSTRAINT IF EXISTS capital_events_host_type_check;

ALTER TABLE public.capital_events
  ADD CONSTRAINT capital_events_host_type_check CHECK (host_type IN ('pier', 'partner'));

-- Drop old event_type check before tour → experience (old constraint allows tour, not experience).
ALTER TABLE public.capital_events DROP CONSTRAINT IF EXISTS capital_events_event_type_check;

UPDATE public.capital_events SET event_type = 'experience' WHERE event_type = 'tour';

ALTER TABLE public.capital_events
  ADD CONSTRAINT capital_events_event_type_check CHECK (
    event_type IN ('dinner', 'summit', 'roundtable', 'experience', 'webinar')
  );

COMMENT ON COLUMN public.capital_events.host_type IS 'pier = Pier-hosted; partner = partner/network co-branded event';
COMMENT ON COLUMN public.capital_events.audience IS 'Display audience line on member event cards';
COMMENT ON COLUMN public.capital_events.host_name IS 'Optional partner or co-host label';
COMMENT ON COLUMN public.capital_events.location_is_public IS 'When false, UI shows guest-only location copy';

-- capital_deals
ALTER TABLE public.capital_deals
  ADD COLUMN IF NOT EXISTS return_metric_type text NOT NULL DEFAULT 'irr',
  ADD COLUMN IF NOT EXISTS return_display text,
  ADD COLUMN IF NOT EXISTS holding_period_years integer,
  ADD COLUMN IF NOT EXISTS liquidity_note text,
  ADD COLUMN IF NOT EXISTS why_pier_selected text;

ALTER TABLE public.capital_deals DROP CONSTRAINT IF EXISTS capital_deals_return_metric_type_check;

ALTER TABLE public.capital_deals
  ADD CONSTRAINT capital_deals_return_metric_type_check CHECK (
    return_metric_type IN ('irr', 'moic', 'yield', 'custom', 'none')
  );

ALTER TABLE public.capital_deals DROP CONSTRAINT IF EXISTS capital_deals_holding_period_years_check;

ALTER TABLE public.capital_deals
  ADD CONSTRAINT capital_deals_holding_period_years_check CHECK (
    holding_period_years IS NULL OR holding_period_years > 0
  );

UPDATE public.capital_deals
SET why_pier_selected = thesis
WHERE why_pier_selected IS NULL AND thesis IS NOT NULL;

-- capital_partners
ALTER TABLE public.capital_partners
  ADD COLUMN IF NOT EXISTS location text;

-- member profile prefs (profile page UX)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS event_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS concierge_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.event_preferences IS 'Optional member event preferences (dietary, formats, etc.)';
COMMENT ON COLUMN public.profiles.concierge_preferences IS 'Optional concierge preferences (travel, communication, etc.)';
