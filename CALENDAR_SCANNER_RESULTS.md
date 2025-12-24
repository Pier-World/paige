# Calendar Scanner - Initial Test Results

## Test Summary

**Date:** January 2025  
**User ID:** `66f01217-1e16-40e2-86cf-bb5afef42f4c`  
**Events Processed:** 63  
**Trips Detected:** 4  
**Execution Time:** 1.1 seconds  
**Errors:** 0

## Detected Trips Analysis

### ✅ High Confidence (90%) - CORRECT
**Trip:** Austin → New York  
**Event:** "Flight to New York (NK 1421)"  
**Dates:** Dec 26-27, 2025  
**Confidence:** 90%  
**Reasoning:** "explicit travel keywords, event in different city, multi-day event"  
**Status:** ✅ **CORRECT DETECTION** - This is a legitimate trip with explicit flight mention

### ⚠️ Medium Confidence (50%) - FALSE POSITIVES

1. **Denver Trip**
   - **Event:** "Dr Marcy Levy Dentist"
   - **Destination:** "Denver"
   - **Dates:** Jan 19, 2026
   - **Confidence:** 50%
   - **Reasoning:** "event in different city, multi-day event"
   - **Issue:** ❌ **FALSE POSITIVE** - This is a dentist appointment, not a trip. The system incorrectly:
     - Extracted "Denver" as the destination (likely from location field)
     - Classified it as multi-day when it's probably a single appointment
     - Should be filtered out (medical appointments, local services)

2. **"Google" Trip**
   - **Event:** "Meeting with Spencer Chandlee @ Pier between Spencer Chandlee and Jeremy Kagan"
   - **Destination:** "Google" (incorrectly extracted)
   - **Dates:** Jan 12, 2026
   - **Confidence:** 50%
   - **Reasoning:** "event in different city, multi-day event"
   - **Issue:** ❌ **FALSE POSITIVE** - Multiple problems:
     - "Google" is a company name, not a city
     - City extraction failed - extracted company name instead of actual location
     - Likely a local meeting, not travel

3. **NY 10022 Trip**
   - **Event:** "Vadim - Spencer | Coffee"
   - **Destination:** "NY 10022" (ZIP code, not city)
   - **Dates:** Dec 28, 2025
   - **Confidence:** 50%
   - **Reasoning:** "event in different city, multi-day event"
   - **Issue:** ❌ **FALSE POSITIVE** - Problems:
     - Extracted ZIP code "NY 10022" instead of city name "New York"
     - City extraction needs to handle ZIP codes and normalize to city names
     - Coffee meeting is likely local, not travel

## Issues Identified

### 1. City Extraction Problems
- **Issue:** Extracting non-city values as destinations
  - "Google" (company name)
  - "NY 10022" (ZIP code)
  - Need better validation that extracted value is actually a city

**Recommendation:**
- Add city name validation (check against known city list or geocoding API)
- Handle ZIP codes by extracting city from ZIP code database
- Filter out company names, building names, etc.

### 2. False Positive Filtering
- **Issue:** Detecting local appointments/services as trips
  - Dentist appointments
  - Local coffee meetings
  - Company meetings

**Recommendation:**
- Add exclusion keywords: "dentist", "doctor", "appointment", "coffee", "meeting" (when local)
- Check if destination is within reasonable distance of home (< 50 miles = likely local)
- Improve multi-day detection (single-day events shouldn't be marked as multi-day)

### 3. Multi-Day Detection Logic
- **Issue:** Single-day events being marked as "multi-day"
  - All 4 detected trips show "multi-day event" in reasoning
  - But 3 of them have same start_date and end_date

**Recommendation:**
- Fix duration calculation - if start_date === end_date, it's NOT multi-day
- Only mark as multi-day if actual duration >= 1 full day

### 4. Confidence Threshold
- **Issue:** 50% confidence threshold is too low
  - All false positives are at exactly 50% (minimum threshold)
  - High confidence (90%) detection is correct

**Recommendation:**
- Consider raising threshold to 60-70% to reduce false positives
- Or add additional filtering for 50-60% confidence trips

## What's Working Well

✅ **High-confidence detection** - The 90% confidence trip is correctly identified  
✅ **Explicit keyword detection** - "Flight to New York" correctly triggers high confidence  
✅ **Scoring algorithm** - Correctly scores explicit keywords + location + multi-day = 90  
✅ **Database storage** - All trips properly stored with metadata  
✅ **Error handling** - No errors during processing  
✅ **Performance** - Fast execution (1.1s for 63 events)

## Recommendations for Next Phase

### Option A: Improve Calendar Scanner (Recommended First)
**Priority:** High  
**Effort:** Medium

1. **Fix city extraction**
   - Add city name validation
   - Handle ZIP codes properly
   - Filter out company/building names

2. **Add exclusion filters**
   - Medical appointments (dentist, doctor)
   - Local services
   - Company meetings (when location is company name)

3. **Fix multi-day detection**
   - Correct duration calculation
   - Only mark as multi-day if actual days > 1

4. **Raise confidence threshold**
   - Consider 60-70% minimum
   - Or add manual review queue for 50-60%

**Expected Impact:** Reduce false positives from 75% to <20%

### Option B: Build Email Parser (Alternative)
**Priority:** Medium  
**Effort:** High

- Start email parser implementation
- Can validate calendar detections against email confirmations
- Cross-reference will improve overall accuracy

**Expected Impact:** Add new data source, validate existing detections

## Next Steps Decision

**Recommendation:** **Option A - Improve Calendar Scanner First**

**Reasoning:**
1. Current false positive rate is 75% (3 of 4 trips)
2. Quick wins available (city extraction, exclusion filters)
3. Better foundation before adding email parser
4. Email parser can then validate/improve calendar detections

**Estimated Time:** 2-3 hours to implement improvements

---

## Technical Details

### Current Scoring Breakdown
- Explicit keywords: +40 points
- Implicit keywords: +20 points  
- Location mismatch: +30 points
- Multi-day: +20 points
- Long duration: +10 points

### False Positive Pattern
All false positives scored exactly 50 points:
- Location mismatch: +30
- Multi-day (incorrect): +20
- No keywords: 0
- **Total: 50** (minimum threshold)

This suggests the multi-day detection bug is causing false positives to hit the threshold.

