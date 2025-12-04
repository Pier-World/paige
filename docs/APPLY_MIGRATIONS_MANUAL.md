# Manual Migration Application Guide

## Issue
The Supabase CLI migration history is out of sync between local and remote. Some remote migrations don't exist locally, preventing `db push` from working.

## Solution: Apply Migrations via SQL Editor

Since the migration history is out of sync, we'll apply the new migrations directly via the Supabase SQL Editor.

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/oifchjaqembbkdyfjctp/sql/new
2. Or navigate: Dashboard → SQL Editor → New Query

### Step 2: Apply Each Migration

Apply the migrations in this order:

#### Migration 1: Hotels Table
1. Open: `supabase/migrations/20251204_create_curated_hotels_schema.sql`
2. Copy the entire file (Cmd+A, Cmd+C)
3. Paste into SQL Editor
4. Click "Run" or press Cmd+Enter
5. Verify success (should see "Success. No rows returned")

#### Migration 2: User Hotel Preferences
1. Open: `supabase/migrations/20251204_create_user_hotel_preferences.sql`
2. Copy the entire file
3. Paste into SQL Editor
4. Click "Run"
5. Verify success

#### Migration 3: Recommendation Events
1. Open: `supabase/migrations/20251204_create_recommendation_events.sql`
2. Copy the entire file
3. Paste into SQL Editor
4. Click "Run"
5. Verify success

### Step 3: Verify Tables Were Created

Run this query in SQL Editor to verify:

```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('hotels', 'user_hotel_preferences', 'recommendation_events')
ORDER BY table_name;
```

You should see all three tables listed.

### Step 4: Verify Table Structure

Check that the hotels table has all the expected columns:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'hotels'
ORDER BY ordinal_position
LIMIT 20;
```

### Step 5: Update Migration History (Optional)

If you want to sync the migration history, you can mark these migrations as applied:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES 
  ('20251204_create_curated_hotels_schema', ARRAY[]::text[], 'create_curated_hotels_schema'),
  ('20251204_create_user_hotel_preferences', ARRAY[]::text[], 'create_user_hotel_preferences'),
  ('20251204_create_recommendation_events', ARRAY[]::text[], 'create_recommendation_events')
ON CONFLICT (version) DO NOTHING;
```

## Alternative: Use psql (If You Have Access)

If you have direct database access, you can apply all migrations at once:

```bash
# Get your database connection string from Supabase Dashboard
# Settings → Database → Connection string (URI)

psql "your-connection-string" -f supabase/migrations/20251204_create_curated_hotels_schema.sql
psql "your-connection-string" -f supabase/migrations/20251204_create_user_hotel_preferences.sql
psql "your-connection-string" -f supabase/migrations/20251204_create_recommendation_events.sql
```

## Troubleshooting

### Error: "extension vector does not exist"
- The pgvector extension needs to be enabled first
- Run this in SQL Editor before applying migrations:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### Error: "type already exists"
- Some enum types might already exist
- The migrations use `CREATE TYPE IF NOT EXISTS` but if that doesn't work, you may need to drop and recreate
- Check existing types: `SELECT typname FROM pg_type WHERE typname LIKE '%_enum';`

### Error: "relation already exists"
- Tables might have been partially created
- Check what exists: `\dt` in psql or `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- You may need to drop and recreate, or modify the migration to use `CREATE TABLE IF NOT EXISTS`

## Next Steps After Migration

Once migrations are applied:

1. **Verify RLS Policies**: Check that RLS is enabled and policies are correct
2. **Test Queries**: Try some basic SELECT queries on the new tables
3. **Seed Data**: Start using the seed script template to add NYC hotels
4. **Build CMS**: Create the Property CMS for tagging hotels

## Quick Verification Query

Run this to see all new tables and their row counts:

```sql
SELECT 
  'hotels' as table_name,
  COUNT(*) as row_count
FROM hotels
UNION ALL
SELECT 
  'user_hotel_preferences',
  COUNT(*)
FROM user_hotel_preferences
UNION ALL
SELECT 
  'recommendation_events',
  COUNT(*)
FROM recommendation_events;
```

