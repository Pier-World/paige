# Property CMS Setup Guide

## Overview

The Property CMS is a critical component of the curated inventory system. It allows your team to manually tag, score, and curate hotels before they appear in recommendations. **Human curation IS the moat.**

## Recommended Tools

### Option 1: Retool (Recommended)
- **Pros**: Fast setup, great UI builder, built-in database connectors
- **Cons**: Paid service (but has free tier)
- **Best for**: Quick MVP, non-technical team members

### Option 2: Bolt.new
- **Pros**: AI-powered, very fast to build, free
- **Cons**: Newer platform, less mature
- **Best for**: Rapid prototyping

### Option 3: Custom Admin Panel
- **Pros**: Full control, can integrate with your app
- **Cons**: More development time
- **Best for**: Long-term, integrated solution

## Retool Setup Guide

### Step 1: Create Retool App

1. Sign up at https://retool.com
2. Create new app: "Pier Property CMS"
3. Connect Supabase database:
   - Go to Resources → Add Resource
   - Select "PostgreSQL"
   - Connection string: Get from Supabase Dashboard → Settings → Database → Connection string (URI)
   - Test connection

### Step 2: Create Hotel List View

**Component**: Table
- **Data Source**: Query `hotels` table
- **Columns to Display**:
  - Name
  - Primary City
  - Neighborhood
  - Quality Score
  - Is Active
  - Data Freshness
- **Actions**:
  - Click row → Open detail view
  - Add new hotel button

### Step 3: Create Hotel Detail Form

**Layout**: Multi-tab form organized by schema categories

#### Tab 1: Core Identity
- Name (text input)
- Brand Group (dropdown: Aman, Marriott, Independent, etc.)
- Address (text input)
- Lat/Lng (number inputs, or map picker if available)
- Neighborhood (text input with autocomplete)
- Primary City (dropdown: NYC, LA, Miami, SF, London, Austin)
- Website URL (text input)
- Pier Booking Link (text input)
- Booking Partners (multi-select: Amex FHR, Virtuoso, Direct)

#### Tab 2: Static Attributes
- Star Rating (number input, 3.0-5.0)
- Room Count (number input)
- Opening Year (number input)
- Last Renovated Year (number input)
- Rate Low/Mid/High (number inputs)
- Check-in/Check-out Times (time inputs)
- Loyalty Programs (multi-select: Bonvoy, Hyatt, Hilton, etc.)

#### Tab 3: Location & Access
- Business Cluster Proximity (multi-select tags)
- Walkability Score (slider 1-5)
- Transit Access (dropdown: excellent, good, poor)
- Airport Distance Minutes (number input)
- Near Key Areas (multi-select tags)

#### Tab 4: Design & Aesthetic
- Design Style (multi-select: minimalist, art-driven, classic luxury, maximalist, industrial, historic)
- Room Style (multi-select: spacious, compact, loft-like, suites-heavy)
- Bathroom Quality (dropdown: standard, luxury, rain showers, soaking tubs)
- Instagram Worthy (checkbox)

#### Tab 5: Atmosphere & Vibe
- Atmosphere (multi-select: quiet, party, scene-y, family, business, wellness, romantic)
- Guest Mix (multi-select: founders/VC, finance, fashion, influencer, locals, tourists)
- Noise Level (slider 1-5)
- Scene Level (slider 1-5)

#### Tab 6: Service Quality
- Service Style (dropdown: ultra-attentive, discreet, chill, inconsistent)
- Staff Kindness Score (slider 1-10)
- Check-in Flexibility Score (slider 1-5)
- Late Checkout Friendliness (slider 1-5)
- Discretion Score (slider 1-5)
- Concierge Quality (slider 0-3)
- Problem Resolution (dropdown: excellent, good, poor)

#### Tab 7: Amenities
- Gym Quality (slider 0-3)
- Spa Quality (slider 0-3)
- Pool Type (dropdown: rooftop, indoor, outdoor, none)
- Food/Drink Quality (dropdown: destination restaurant, solid, meh, none)
- Bar Scene (dropdown: quiet cocktails, lobby hang, clubby, none)
- Coworking Space (checkbox)
- Meeting Rooms (checkbox)
- Pet Friendly (checkbox)

#### Tab 8: Work & Tech
- WiFi Quality (slider 1-5)
- Desk in Room (checkbox)
- Power Outlets (dropdown: abundant, adequate, scarce)
- Creator Friendly (checkbox)
- Startup Friendly (checkbox)

#### Tab 9: Use Case Suitability
- Good for Solo Work (checkbox)
- Good for Couples (checkbox)
- Good for Families (checkbox)
- Good for Long Stays (checkbox)
- Good for Offsites (checkbox)
- Good for Board Meetings (checkbox)

#### Tab 10: Pier Specific
- Pier Perk Level (dropdown: none, preferred, VIP partner)
- Pier Benefits (multi-select: late checkout, breakfast, upgrade priority)
- Quality Score Internal (slider 1-100)
- Notes Curated (rich text area - this is critical for LLM context)
- Is Active (checkbox)
- Is Experimental (checkbox)

### Step 4: Create Queries

#### Query: Get Hotel
```sql
SELECT * FROM hotels WHERE id = {{ hotelId }}
```

#### Query: Update Hotel
```sql
UPDATE hotels
SET 
  name = {{ name }},
  brand_group = {{ brandGroup }},
  address = {{ address }},
  lat = {{ lat }},
  lng = {{ lng }},
  neighborhood = {{ neighborhood }},
  primary_city = {{ primaryCity }},
  -- ... all other fields
  updated_at = now()
WHERE id = {{ hotelId }}
```

#### Query: Create Hotel
```sql
INSERT INTO hotels (
  name, brand_group, address, lat, lng, neighborhood, primary_city,
  -- ... all fields
)
VALUES (
  {{ name }}, {{ brandGroup }}, {{ address }}, {{ lat }}, {{ lng }}, 
  {{ neighborhood }}, {{ primaryCity }},
  -- ... all values
)
RETURNING *
```

#### Query: List Hotels
```sql
SELECT 
  id,
  name,
  primary_city,
  neighborhood,
  quality_score_internal,
  is_active,
  data_freshness,
  created_at
FROM hotels
ORDER BY created_at DESC
LIMIT 100
```

### Step 5: Add Validation

Create JavaScript transformers to validate:
- Required fields (name, address, lat, lng, neighborhood, primary_city)
- Score ranges (1-5, 1-10, 0-3, 1-100)
- Coordinate ranges (lat: -90 to 90, lng: -180 to 180)

### Step 6: Add Bulk Import

Create a CSV import feature:
1. Template CSV with all columns
2. Upload CSV file
3. Parse and validate
4. Batch insert using Retool's batch operations

## Bolt.new Setup Guide

### Step 1: Create App
1. Go to https://bolt.new
2. Start with "Database Admin" template
3. Connect to Supabase PostgreSQL

### Step 2: Build Forms
- Use AI to generate forms: "Create a form for editing hotel properties with tabs for different categories"
- Bolt will auto-generate based on your schema

### Step 3: Customize
- Add validation rules
- Add rich text editor for `notes_curated`
- Add map picker for lat/lng

## Key Features to Implement

### 1. Data Freshness Tracking
- Automatically update `data_freshness` timestamp when any field changes
- Show warning if data is older than 90 days

### 2. Quality Score Calculator (Optional)
- Create a helper that suggests quality_score based on other fields
- But always allow manual override

### 3. Embedding Generation (Future)
- When `notes_curated` is updated, trigger embedding generation
- Store in `profile_embedding` field
- This can be done via Supabase Edge Function

### 4. Bulk Operations
- Bulk activate/deactivate hotels
- Bulk update neighborhoods
- Bulk update quality scores

### 5. Search & Filter
- Search by name, neighborhood, city
- Filter by: city, is_active, quality_score range, pier_perk_level
- Sort by: quality_score, created_at, data_freshness

## Workflow Recommendations

### Initial Curation Process
1. **Research Phase**: Team member researches hotel (website, reviews, etc.)
2. **Data Entry**: Fill out all fields in CMS using schema as checklist
3. **Review Phase**: Another team member reviews for completeness
4. **Activation**: Mark as `is_active = true` when ready
5. **Testing**: Test in recommendation system before going live

### Ongoing Maintenance
1. **Monthly Review**: Check `data_freshness`, update stale data
2. **Feedback Integration**: Update scores based on user feedback
3. **New Properties**: Add 5-10 new properties per month per geo

## Checklist for Each Hotel

Use this when curating:

- [ ] Core Identity: name, address, lat/lng, neighborhood, primary_city
- [ ] Static Attributes: star_rating, room_count, rates (low/mid/high)
- [ ] Location & Access: walkability, transit, airport distance
- [ ] Design & Aesthetic: design_style, room_style, bathroom_quality
- [ ] Atmosphere & Vibe: atmosphere, guest_mix, noise_level, scene_level
- [ ] Service Quality: service_style, staff_kindness, flexibility scores
- [ ] Amenities: gym, spa, pool, food/drink, bar scene
- [ ] Work & Tech: wifi_quality, desk, power_outlets, creator/startup friendly
- [ ] Use Case Suitability: solo work, couples, families, long stays, offsites
- [ ] Pier Specific: perk_level, benefits, quality_score, **curated notes** (critical!)

## Notes on Curated Notes Field

The `notes_curated` field is **critical** for LLM context. Write natural language descriptions like:

> "Boutique luxury in Tribeca. Exceptional service, quiet, perfect for business. Shibui Spa is world-class. Rooms are spacious with beautiful design. Great for meetings and offsites. Staff is incredibly discreet and accommodating."

This helps the LLM understand the property's character beyond just the structured fields.

## Next Steps

1. Set up Retool/Bolt account
2. Connect to Supabase
3. Build hotel list view
4. Build hotel detail form (multi-tab)
5. Test with one hotel entry
6. Start curating NYC hotels (25-40 properties)

