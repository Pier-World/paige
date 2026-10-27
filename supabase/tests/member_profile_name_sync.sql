-- Member <-> profile name sync assertions.
-- Run locally only: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/member_profile_name_sync.sql
-- Rolls back. Does not touch production.

BEGIN;

DO $$
BEGIN
  ASSERT public.compose_member_full_name('Ada', 'Lovelace') = 'Ada Lovelace',
    'compose joins first and last';
  ASSERT public.compose_member_full_name('Ada', '') = 'Ada',
    'compose skips blank last';
  ASSERT public.compose_member_full_name(NULL, NULL) IS NULL,
    'compose empty is null';
END $$;

DO $$
DECLARE
  v_first text;
  v_last text;
BEGIN
  SELECT first_name, last_name INTO v_first, v_last
  FROM public.split_member_full_name('Jean Luc Picard');
  ASSERT v_first = 'Jean', 'split first token';
  ASSERT v_last = 'Luc Picard', 'split remainder';

  SELECT first_name, last_name INTO v_first, v_last
  FROM public.split_member_full_name('Ada');
  ASSERT v_first = 'Ada', 'single-word first';
  ASSERT v_last IS NULL, 'single-word last is null';
END $$;

ROLLBACK;
