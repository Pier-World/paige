# Seed Data Application Instructions

## Generated Seed File

A comprehensive seed file has been generated with **100 hotels** (25 each in NYC, LA, SF, and London):

**File**: `supabase/migrations/20251204_seed_top_100_hotels.sql`

## Apply to Database

### Option 1: Supabase SQL Editor (Recommended)

1. Open Supabase SQL Editor:
   - Go to: https://supabase.com/dashboard/project/oifchjaqembbkdyfjctp/sql/new

2. Open the seed file:
   ```bash
   cat supabase/migrations/20251204_seed_top_100_hotels.sql
   ```

3. Copy the entire contents and paste into SQL Editor

4. Click "Run" or press Cmd+Enter

5. Verify success - should see "Success. No rows returned"

### Option 2: Using psql (If you have connection string)

```bash
# Get connection string from Supabase Dashboard → Settings → Database → Connection string (URI)
psql "your-connection-string" -f supabase/migrations/20251204_seed_top_100_hotels.sql
```

## Verify Data

After applying, run this query to verify:

```sql
SELECT 
  primary_city,
  COUNT(*) as hotel_count
FROM hotels
GROUP BY primary_city
ORDER BY primary_city;
```

Expected results:
- LA: 25 hotels
- London: 25 hotels  
- NYC: 25 hotels
- SF: 25 hotels

## Next Steps

Once seed data is applied, we'll move on to:
1. Implementing matching engine tools (Edge Functions)
2. Wiring tools to orchestrator
3. Building recommendation UI components

