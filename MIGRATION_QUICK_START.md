# 🚀 Quick Start: Run Database Migrations

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

Go to: **https://supabase.com/dashboard**
- Select your project
- Click **"SQL Editor"** in the left sidebar

### 2. Run the Main Migration

1. Click **"New Query"** button (top right)
2. Open this file: `supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql`
3. **Copy ALL the contents** (Cmd+A, Cmd+C / Ctrl+A, Ctrl+C)
4. **Paste** into the SQL Editor
5. Click **"Run"** button (or press Cmd+Enter / Ctrl+Enter)

### 3. Check Results

You should see messages like:
- ✅ "Added time_zone column to profiles"
- ✅ "Added travel_preferences column to profiles"
- ✅ "All 10 MVP tables verified: ..."
- ✅ Various index creation messages

**If you see "already exists" errors:** These are safe to ignore - the migration is idempotent.

### 4. Verify Success

Run this quick check in SQL Editor:

```sql
-- Quick verification
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'personal_context'
  ) THEN '✅ personal_context' ELSE '❌ missing' END as personal_context,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'travel_preferences'
  ) THEN '✅ travel_preferences' ELSE '❌ missing' END as travel_preferences;
```

You should see both ✅.

### 5. (Optional) Run User Preferences Alignment

If you have a `user_preferences` table:

1. Open: `supabase/migrations/20251201_align_user_preferences_with_profiles.sql`
2. Copy and paste into SQL Editor
3. Run

---

## ✅ Done!

After migration:
- Your `profiles` table now has enhanced columns for agent indexing
- All indexes are created for performance
- Helper functions are available
- Ready to use orchestrator service!

## 📚 Full Documentation

See `docs/MIGRATION_RUN_GUIDE.md` for detailed instructions and troubleshooting.

