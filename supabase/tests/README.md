# Database tests

There is no application test runner (Jest/Vitest) in this repo. Policy and helper
checks live here as SQL that can run against **local** Supabase only.

## Pier+ RLS / privilege lock

```bash
# After `supabase start` (or a local db reset). Never point this at production.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pier_plus_rls.sql
```

`DATABASE_URL` for local is typically:

```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

The file uses `ASSERT` and rolls back. It does not create production users or send email.

If pgTAP is later enabled (`CREATE EXTENSION pgtap`), the same predicates can be
rewritten as `SELECT plan(...)` tests. Until then this file is the harness.
