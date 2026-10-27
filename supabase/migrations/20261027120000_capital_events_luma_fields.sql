/*
  Luma-backed capital events: cover image + stable Luma id for upserts.
*/

ALTER TABLE public.capital_events
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS luma_event_id text;

COMMENT ON COLUMN public.capital_events.cover_image_url IS 'Optional event cover (e.g. Luma CDN URL).';
COMMENT ON COLUMN public.capital_events.luma_event_id IS 'Luma event slug or api id used as a stable source key.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_events_luma_event_id
  ON public.capital_events (luma_event_id)
  WHERE luma_event_id IS NOT NULL;
