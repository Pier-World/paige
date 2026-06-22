/*
  # Capital deal allocation subscribed percent

  Lets staff manage the displayed allocation percentage directly in Supabase.
  The UI uses this value for both the progress bar and "% subscribed" text.
*/

ALTER TABLE public.capital_deals
  ADD COLUMN IF NOT EXISTS allocation_subscribed_percent numeric(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.capital_deals DROP CONSTRAINT IF EXISTS capital_deals_allocation_subscribed_percent_check;
ALTER TABLE public.capital_deals
  ADD CONSTRAINT capital_deals_allocation_subscribed_percent_check CHECK (
    allocation_subscribed_percent >= 0
    AND allocation_subscribed_percent <= 100
  );

COMMENT ON COLUMN public.capital_deals.allocation_subscribed_percent IS
  'Staff-managed display value for allocation progress. Used for the member-facing progress bar and subscribed percentage.';

UPDATE public.capital_deals
SET allocation_subscribed_percent = LEAST(100, GREATEST(0, ROUND((raised_size / NULLIF(target_size, 0)) * 100, 2)))
WHERE target_size > 0
  AND allocation_subscribed_percent = 0;
