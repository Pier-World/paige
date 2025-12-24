# Calendar Scanner Troubleshooting

## Current Status

### Issues Found:
1. **Old trips still in database** - These were created before fixes were deployed
2. **Extraction priority bug** - "Flight to New York" extracted "Austin" because location was checked before title
3. **Title extraction regex** - Needs to handle lowercase titles properly

### Fixes Applied:

1. **Fixed extraction priority** - When explicit travel keywords are in title, prioritize title extraction over location
2. **Improved title extraction** - Better handling of multi-word cities like "New York"
3. **Fixed extractCityFromLocation bug** - Corrected undefined variable reference

## Next Steps

1. **Deploy the updated function** with these fixes
2. **Run a new scan** to test:
   ```bash
   curl -k -X POST "https://oifchjaqembbkdyfjctp.supabase.co/functions/v1/scan-calendar" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "66f01217-1e16-40e2-86cf-bb5afef42f4c"}'
   ```

3. **Expected results:**
   - "Dr Marcy Levy Dentist" → **EXCLUDED** (exclusion keyword)
   - "Google" meeting → **NO CITY EXTRACTED** (company name rejected)
   - "NY 10022" coffee → **EXCLUDED** (exclusion keyword + ZIP code rejected)
   - "Flight to New York" → **DETECTED** with correct destination "New York" (not "Austin")

4. **Clean up old trips** (optional):
   ```sql
   -- Delete old false positive trips
   DELETE FROM potential_trips
   WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
     AND detection_source = 'calendar'
     AND confidence_score = 50
     AND destination_city IN ('Google', 'NY 10022', 'Denver')
     AND metadata->>'calendar_event_title' IN (
       'Dr Marcy Levy Dentist',
       'Meeting with Spencer Chandlee @ Pier between Spencer Chandlee and Jeremy Kagan',
       'Vadim - Spencer | Coffee'
     );
   ```

## Verification Checklist

After deploying and running new scan:

- [ ] "Flight to New York" shows destination as "New York" (not "Austin")
- [ ] No new trips created for dentist appointment
- [ ] No new trips created for "Google" meeting
- [ ] No new trips created for "NY 10022" coffee
- [ ] Only high-confidence trips (≥60%) are auto-detected
- [ ] Logs show detailed processing information

