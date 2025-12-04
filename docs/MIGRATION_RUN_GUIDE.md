# Running Database Migrations - Step by Step Guide

## Quick Method: Supabase Dashboard SQL Editor

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run Main Enhancement Migration

1. Click **"New Query"** button
2. Open the file: `supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql`
3. Copy the **entire contents** of the file
4. Paste into the SQL Editor
5. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)

**Expected Output:**
- You should see success messages like:
  - "Added time_zone column to profiles"
  - "Added travel_preferences column to profiles"
  - "All 10 MVP tables verified: ..."
  - Various index creation messages

**If you see errors:**
- Most errors are safe to ignore if they say "already exists"
- The migration uses `IF NOT EXISTS` checks, so it's idempotent

### Step 3: (Optional) Run User Preferences Alignment

If you have a `user_preferences` table that you want to merge into `profiles.travel_preferences`:

1. Open the file: `supabase/migrations/20251201_align_user_preferences_with_profiles.sql`
2. Copy the entire contents
3. Paste into SQL Editor
4. Click **"Run"**

### Step 4: Verify Migration Success

Run this verification query in SQL Editor:

```sql
-- Check profiles table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if enhanced columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'personal_context'
  ) THEN '✅ personal_context exists' ELSE '❌ personal_context missing' END as personal_context,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'communication_preferences'
  ) THEN '✅ communication_preferences exists' ELSE '❌ communication_preferences missing' END as communication_preferences,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'metadata'
  ) THEN '✅ metadata exists' ELSE '❌ metadata missing' END as metadata;

-- Check all MVP tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'integrations', 'entities', 'relationships',
    'calendar_events', 'emails', 'tasks', 'conversations',
    'notifications', 'automations'
  )
ORDER BY table_name;
```

You should see:
- ✅ All enhanced columns exist
- ✅ All 10 MVP tables listed

## Alternative: Using Supabase CLI (if installed)

If you install Supabase CLI later:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Troubleshooting

### Error: "relation already exists"
- **Safe to ignore** - The migration checks for existence before creating

### Error: "column already exists"
- **Safe to ignore** - The migration uses `IF NOT EXISTS` checks

### Error: "permission denied"
- Make sure you're using the SQL Editor (not a restricted user)
- Check that you have admin access to the project

### Migration seems stuck
- Large migrations can take time
- Check the "Running queries" indicator in Supabase dashboard
- Wait for it to complete before running another query

## What Gets Created/Updated

### New Columns in `profiles`:
- `time_zone` - User's timezone
- `travel_preferences` - JSONB travel preferences
- `onboarding_completed` - Boolean flag
- `personal_context` - JSONB for agent-learned preferences
- `communication_preferences` - JSONB for notification preferences
- `metadata` - JSONB for flexible data storage

### New Indexes:
- `idx_profiles_email` - Fast email lookups
- `idx_profiles_time_zone` - Time-based queries
- `idx_profiles_travel_preferences_gin` - GIN index for JSONB
- `idx_profiles_personal_context_gin` - GIN index for JSONB
- `idx_profiles_onboarding` - Filter incomplete onboarding

### New Functions:
- `get_user_profile_context(user_id)` - Get all user context
- `get_travel_preferences(user_id)` - Get travel preferences with defaults
- `update_travel_preferences(user_id, preferences)` - Update preferences

## Next Steps After Migration

1. ✅ Verify migration success (run verification queries above)
2. ✅ Set environment variables for orchestrator:
   - `OPENAI_API_KEY` in Supabase Dashboard → Settings → Edge Functions
3. ✅ Test orchestrator endpoint
4. ⏭️ Create agent services (travel-agent, scheduling-agent, loyalty-agent)

