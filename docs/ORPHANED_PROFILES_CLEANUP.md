# Orphaned Profiles Cleanup

## Problem
The `profiles` table contains many records that don't correspond to actual members in the `members` table. These are likely:
- Test data
- System/automated emails (noreply@, subscriptions@, etc.)
- Email parsing artifacts
- Profiles created for non-member auth users

## Solution

### Migration Files Created

1. **`20250120_cleanup_orphaned_profiles.sql`**
   - Deletes orphaned profiles that:
     - Don't exist in `members` table
     - Don't exist in `auth.users` table
     - Are not referenced in important tables (conversations, channels, etc.)
     - Are clearly test/system data (noreply@, test@, UUID emails, etc.)
   - Adds a trigger that **warns** (doesn't block) when creating profiles not linked to members
   - Creates a `valid_profiles` view for easy querying

2. **`20250120_add_profile_member_constraint.sql`**
   - Creates helper functions and views
   - Adds `orphaned_profiles_view` to easily identify problematic profiles

### Code Changes

Updated the following files to only create profiles for actual members:
- `src/lib/api/travelRequests.ts` - Now checks for member before creating profile
- `src/lib/api/orchestrator.ts` - Verifies member status before proceeding

## Running the Cleanup

### Step 1: Review Orphaned Profiles
```sql
-- See what will be deleted
SELECT * FROM orphaned_profiles_view;
```

### Step 2: Run Cleanup Migration
Run the migration in Supabase Dashboard:
```sql
-- This will delete orphaned profiles and add safeguards
-- File: supabase/migrations/20250120_cleanup_orphaned_profiles.sql
```

### Step 3: Verify Results
```sql
-- Check remaining profiles
SELECT COUNT(*) FROM profiles;

-- See valid profiles
SELECT * FROM valid_profiles WHERE profile_type = 'member';

-- Check for any remaining orphans
SELECT * FROM orphaned_profiles_view;
```

## Prevention

Going forward:
1. **Trigger Warning**: The trigger will log warnings when profiles are created without corresponding members
2. **Code Validation**: Updated code now checks for member status before creating profiles
3. **View for Monitoring**: Use `orphaned_profiles_view` to monitor for new orphans

## Notes

- The trigger **warns** but doesn't **block** to allow for legitimate email parsing use cases
- Profiles can still exist for email context, but they should be linked to conversations
- All actual members should have corresponding profiles (created automatically)

