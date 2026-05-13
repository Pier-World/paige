/*
  # Capital events — external registration (e.g. Luma)

  Nullable URL + label for link-out registration. Member-facing RSVP in app remains available
  when URL is null. URL must be http(s) when present.
*/

ALTER TABLE public.capital_events
  ADD COLUMN IF NOT EXISTS external_registration_url text,
  ADD COLUMN IF NOT EXISTS external_registration_label text;

COMMENT ON COLUMN public.capital_events.external_registration_url IS 'Optional off-platform registration link (e.g. Luma). When set, UI may surface as primary Register CTA.';
COMMENT ON COLUMN public.capital_events.external_registration_label IS 'Optional button label for external_registration_url (e.g. Register on Luma).';

ALTER TABLE public.capital_events
  DROP CONSTRAINT IF EXISTS capital_events_external_registration_url_format;

ALTER TABLE public.capital_events
  ADD CONSTRAINT capital_events_external_registration_url_format CHECK (
    external_registration_url IS NULL
    OR external_registration_url ~ '^https?://'
  );
