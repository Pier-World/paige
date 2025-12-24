# Calendar Scanner Fixes - Implementation Summary

## Fixes Applied

### 1. ✅ City Extraction with Validation
**File:** `extractors.ts`

**Changes:**
- Added `US_CITIES` Set with ~50 major US cities (expandable)
- Added `CITY_ALIASES` map (NYC → New York, SF → San Francisco, etc.)
- Added `COMPANY_NAMES` Set to filter out company names
- Added `isValidCity()` function that:
  - Rejects ZIP codes (regex: `/^\d{5}(-\d{4})?$/`)
  - Rejects company names
  - Validates against known cities
  - Resolves aliases
- Updated `extractCityFromLocation()` and `extractCityFromTitle()` to validate before returning

**Impact:** 
- "Google" will no longer be extracted as a city
- "NY 10022" will be rejected (ZIP code)
- Only valid city names are returned

### 2. ✅ Fixed Multi-Day Detection Bug
**File:** `utils.ts`

**Changes:**
- Fixed `calculateDuration()` to properly calculate full days:
  - Strips time component from dates
  - Uses `Math.floor()` instead of `Math.ceil()`
  - Calculates actual day differences, not time differences

**Impact:**
- Single-day events (same start/end date) now correctly return 0 days
- Multi-day events correctly return actual day count
- Fixes false "multi-day" flags on single-day events

### 3. ✅ False Positive Filtering
**File:** `detector.ts`

**Changes:**
- Added `EXCLUSION_KEYWORDS` array with:
  - Medical terms (doctor, dentist, appointment, etc.)
  - Local services (haircut, car wash, grocery, etc.)
  - Local food/drink (coffee, lunch, dinner, etc.)
  - Local meetings (quick meeting, office visit, etc.)
- Early exit if exclusion keyword found (unless strong travel indicator present)
- Added distance check: if location mismatch but < 20 miles, skip (same metro area)

**Impact:**
- "Dr Marcy Levy Dentist" will be excluded
- "Coffee" meetings will be excluded
- Local appointments won't trigger false positives

### 4. ✅ Confidence Threshold Raised
**File:** `index.ts` and `types.ts`

**Changes:**
- Raised minimum threshold to 60% for auto-detection
- Added handling for 50-59% confidence trips (marked for review)
- Added `trips_needing_review` counter to response
- Updated `ScanResult` interface to include `trips_needing_review`

**Impact:**
- Only high-confidence trips (≥60%) are auto-detected
- Borderline trips (50-59%) are still created but flagged
- Below 50% trips are skipped entirely

### 5. ✅ Comprehensive Logging
**File:** `detector.ts`

**Changes:**
- Added detailed console logging for each event:
  - Event title and location
  - Extracted destination city
  - Distance calculations
  - Duration (days and hours)
  - All confidence factors
  - Final confidence score
  - Skip reasons (if applicable)
  - Detection results

**Impact:**
- Much easier to debug detection issues
- Can see exactly why events are detected or skipped
- Helps identify patterns in false positives

## Expected Results After Fixes

### Before Fixes:
- 4 trips detected
- 3 false positives (75% false positive rate)
- All at 50% confidence (minimum threshold)

### After Fixes:
- **1 trip detected** (Flight to New York at 90% confidence)
- **0 false positives** (all excluded or below threshold)
- **0 trips needing review** (unless borderline cases exist)

### Specific Event Handling:

1. **"Dr Marcy Levy Dentist" in Denver**
   - ❌ **EXCLUDED** - Exclusion keyword: "dentist"
   - No city extraction attempted

2. **"Google" meeting**
   - ❌ **NO CITY EXTRACTED** - "Google" rejected as company name
   - Falls below threshold (no location mismatch without valid city)

3. **"NY 10022" coffee meeting**
   - ❌ **NO CITY EXTRACTED** - ZIP code rejected
   - ❌ **EXCLUDED** - Exclusion keyword: "coffee"
   - Double-filtered for safety

4. **"Flight to New York"**
   - ✅ **DETECTED** at 90% confidence
   - Explicit keywords + location mismatch + multi-day = high confidence

## Testing Instructions

1. **Deploy the updated function** (manually via Supabase Dashboard)

2. **Run the scan again:**
   ```bash
   curl -k -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/scan-calendar" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "66f01217-1e16-40e2-86cf-bb5afef42f4c"}'
   ```

3. **Check the results:**
   - Should see: `trips_detected: 1` (or 0 if no high-confidence trips)
   - Should see: `trips_needing_review: 0` (or small number for borderline cases)
   - Check logs for detailed processing information

4. **Verify in database:**
   ```sql
   SELECT 
     id,
     destination_city,
     confidence_score,
     status,
     metadata->>'detection_reasoning' as reasoning
   FROM potential_trips
   WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
     AND detection_source = 'calendar'
   ORDER BY created_at DESC;
   ```

## Files Modified

1. `supabase/functions/scan-calendar/extractors.ts` - City validation
2. `supabase/functions/scan-calendar/utils.ts` - Fixed duration calculation
3. `supabase/functions/scan-calendar/detector.ts` - Exclusion keywords, distance checks, logging
4. `supabase/functions/scan-calendar/index.ts` - 60% threshold, needs_review handling
5. `supabase/functions/scan-calendar/types.ts` - Added trips_needing_review field

## Next Steps

After testing confirms the fixes work:
1. ✅ Calendar scanner is production-ready
2. → Move to email parser implementation
3. → Email parser can validate/improve calendar detections

