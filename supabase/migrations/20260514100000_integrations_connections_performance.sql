/*
  Profile "Connected Accounts" / checkConnections performance:
  - RLS: use (select auth.uid()) so uid is not re-evaluated per row (advisor initplan pattern).
  - Idempotent index ensures baseline idx_integrations_* / calendar lookup paths exist if drifted.
*/

-- ---------------------------------------------------------------------------
-- RLS policies (same semantics as baseline; stable plan for auth.uid())
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users access own integrations" ON public.integrations;
CREATE POLICY "Users access own integrations" ON public.integrations
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users access own calendar_events" ON public.calendar_events;
CREATE POLICY "Users access own calendar_events" ON public.calendar_events
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Indexes (baseline: 20250518192643_remote_public_schema_baseline.sql)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_integrations_user_provider
  ON public.integrations USING btree (user_id, provider);

CREATE INDEX IF NOT EXISTS idx_integrations_active
  ON public.integrations USING btree (user_id, is_active)
  WHERE (is_active = true);

-- Speeds user-scoped reads that only need gcal_calendar_id for connection UI.
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_gcal_calendar
  ON public.calendar_events USING btree (user_id, gcal_calendar_id);
