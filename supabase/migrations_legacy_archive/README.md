# Legacy Supabase Migrations Archive

These migrations are preserved for audit/history, but are no longer part of the active local replay chain.

The previous migration folder could not replay from an empty local database because it was missing remote-applied baseline migrations and contained old local-only migrations that assumed legacy tables already existed. The active `supabase/migrations` folder now uses a squashed remote schema baseline plus no-op placeholders for remote-applied versions, followed by the current capital markets migrations.

Do not move these files back into `supabase/migrations` without re-validating `npx supabase db reset`.
