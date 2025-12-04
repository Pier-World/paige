# Database Schema Verification & Enhancement Guide

## Overview

This guide helps you verify and enhance your database schema to align with the Pier OS v2 MVP specification and optimize it for AI agent indexing.

## Quick Start

### 1. Run Schema Verification

First, verify your current database state:

```bash
# Connect to your Supabase database and run:
psql <your-connection-string> -f supabase/scripts/verify_schema.sql
```

Or run it in the Supabase SQL Editor.

### 2. Apply Enhancements

Run the enhancement migration:

```bash
# In Supabase SQL Editor or via migration:
supabase migration up
```

The migration file `20251201_verify_and_enhance_profiles_schema.sql` will:
- ✅ Verify all MVP columns exist in `profiles` table
- ✅ Add enhanced columns for better agent indexing
- ✅ Create performance indexes
- ✅ Verify all 10 MVP tables exist
- ✅ Ensure RLS is enabled
- ✅ Add helper functions

## What Gets Enhanced

### Profiles Table Enhancements

The migration adds these columns to help agents better understand and serve users:

1. **`personal_context` (JSONB)**
   - Stores learned preferences, habits, and patterns
   - Example: `{"frequent_destinations": ["NYC", "SF"], "preferred_travel_times": ["morning"], "work_schedule": "9-5"}`
   - Helps agents make personalized recommendations

2. **`communication_preferences` (JSONB)**
   - User preferences for notifications and communication
   - Example: `{"notification_channels": ["email", "push"], "quiet_hours": {"start": "22:00", "end": "08:00"}}`
   - Helps agents communicate in the user's preferred style

3. **`metadata` (JSONB)**
   - Flexible storage for additional profile data
   - Can store any agent-discovered information
   - Example: `{"last_trip_destination": "Paris", "favorite_hotel_chains": ["Marriott"]}`

### Travel Preferences Structure

The migration ensures `travel_preferences` has a consistent structure:

```json
{
  "preferred_airlines": ["United", "Delta"],
  "seat_preference": "aisle",
  "cabin_preference": "economy",
  "tsa_precheck": "123456789",
  "known_traveler_number": "XX1234567",
  "meal_preferences": ["vegetarian"],
  "special_assistance": [],
  "frequent_destinations": ["NYC", "SF"],
  "booking_preferences": {
    "prefer_nonstop": true,
    "prefer_morning_flights": true,
    "prefer_window_seat": false,
    "prefer_aisle_seat": true
  },
  "budget_ranges": {
    "flight": {"min": 0, "max": 1000, "flexible": true},
    "hotel": {"per_night_min": 0, "per_night_max": 300, "flexible": true}
  },
  "special_requirements": {
    "dietary": ["vegetarian"],
    "accessibility": [],
    "allergies": ["peanuts"]
  },
  "loyalty_programs": [
    {"program": "United MileagePlus", "number": "123456789"}
  ]
}
```

## Performance Indexes

The migration creates these indexes for optimal query performance:

- `idx_profiles_email` - Fast email lookups
- `idx_profiles_time_zone` - Time-based queries
- `idx_profiles_travel_preferences_gin` - GIN index for JSONB queries on travel preferences
- `idx_profiles_personal_context_gin` - GIN index for JSONB queries on personal context
- `idx_profiles_onboarding` - Filter users who haven't completed onboarding

## Helper Functions

### `get_user_profile_context(user_id UUID)`

Retrieves all user context for agents:

```sql
SELECT * FROM get_user_profile_context('user-uuid-here');
```

Returns:
- Profile ID
- Full name, email, phone
- Time zone
- Travel preferences
- Personal context
- Communication preferences
- Onboarding status

### `get_travel_preferences(user_id UUID)`

Gets travel preferences with defaults:

```sql
SELECT get_travel_preferences('user-uuid-here');
```

### `update_travel_preferences(user_id UUID, preferences JSONB)`

Safely updates travel preferences (merges with existing):

```sql
SELECT update_travel_preferences(
  'user-uuid-here',
  '{"preferred_airlines": ["United"]}'::jsonb
);
```

## Verification Checklist

After running migrations, verify:

- [ ] All 10 MVP tables exist
- [ ] `profiles` table has all required columns
- [ ] Enhanced columns (`personal_context`, `communication_preferences`, `metadata`) exist
- [ ] All indexes are created
- [ ] RLS is enabled on all tables
- [ ] Helper functions are created and accessible
- [ ] Sample profile data shows correct structure

## Alignment with user_preferences Table

If you have an existing `user_preferences` table, run the alignment migration:

```bash
# Run: 20251201_align_user_preferences_with_profiles.sql
```

This migration:
- Migrates data from `user_preferences` to `profiles.travel_preferences`
- Creates a view for backward compatibility
- Adds helper functions for preference management

## Using in Agent Services

### Example: Travel Agent Querying User Preferences

```typescript
// In your travel-agent service
const { data: profile } = await supabase
  .from('profiles')
  .select('travel_preferences, personal_context, time_zone')
  .eq('id', userId)
  .single();

// Access preferences
const preferredAirlines = profile.travel_preferences?.preferred_airlines || [];
const seatPreference = profile.travel_preferences?.seat_preference;
const frequentDestinations = profile.personal_context?.frequent_destinations || [];
```

### Example: Updating Personal Context

```typescript
// When agent learns something about the user
await supabase
  .from('profiles')
  .update({
    personal_context: {
      ...existingContext,
      last_trip_destination: 'Paris',
      preferred_travel_times: ['morning', 'afternoon']
    }
  })
  .eq('id', userId);
```

## Next Steps

1. ✅ Run verification script
2. ✅ Apply enhancement migration
3. ✅ Test helper functions
4. ✅ Update agent services to use new columns
5. ✅ Start indexing user preferences and context

## Troubleshooting

### Migration Fails

If the migration fails, check:
- Do you have the required permissions?
- Are there existing constraints that conflict?
- Check the error message for specific table/column issues

### Missing Columns

If columns are missing after migration:
- Check if the migration ran completely
- Verify you're looking at the correct schema (`public`)
- Run the verification script to see what's missing

### RLS Issues

If RLS policies are blocking queries:
- Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
- Check if you're using the correct user context
- Ensure service role key is used for backend operations

## Related Files

- `supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql` - Main enhancement migration
- `supabase/migrations/20251201_align_user_preferences_with_profiles.sql` - Preference alignment
- `supabase/scripts/verify_schema.sql` - Verification script
- `docs/pier-os-v2-mvp.md` - MVP specification
- `docs/IMPLEMENTATION_PLAN.md` - Implementation roadmap

