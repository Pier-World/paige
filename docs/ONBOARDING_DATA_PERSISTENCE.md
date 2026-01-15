# Onboarding Data Persistence

This document outlines where onboarding data is saved and how it's used across the platform.

## Data Flow

When a user completes onboarding, their data is saved to multiple tables to ensure it's accessible for all platform features:

### 1. `profiles.personal_context` (JSONB)
**Purpose**: Complete onboarding record for reference

**Structure**:
```json
{
  "name": "User Name",
  "goals": ["maximize-points", "travel-optimization", ...],
  "memberships": ["amex-platinum", "chase-sapphire-reserve", ...],
  "travel_preferences": {
    "style": ["luxury", "city", ...],
    "interests": ["points-maximization", "lounge-access", ...]
  }
}
```

**Used by**: 
- Profile page display
- User context retrieval
- General user understanding

### 2. `members.preferences` (JSONB)
**Purpose**: Quick access to interests for filtering and recommendations

**Structure**:
```json
{
  "interests": ["Points Maximization", "Travel", "Lounge Access", ...],
  "preferred_cities": []
}
```

**Used by**:
- Perk filtering and sorting
- Quick interest matching
- Member dashboard

### 3. `user_preferences` (Table)
**Purpose**: Structured travel preferences for booking flows

**Structure**:
```json
{
  "travel_preferences": {
    "hotel": {
      "preferred_brands": ["Marriott", "Hilton"],
      "amenities": [],
      "room_type": "standard",
      "location_preference": "central"
    },
    "dining": {
      "cuisine_preferences": [],
      "dining_style": ["fine_dining", "local"],
      "price_range": "moderate"
    },
    "flight": {
      "preferred_airlines": ["Delta", "United"],
      "seat_preference": "window",
      "cabin_class": "economy",
      "nonstop_preferred": true
    }
  }
}
```

**Used by**:
- Travel request processing
- Booking flows
- Flight/hotel/dining recommendations

### 4. `user_hotel_preferences` (Table)
**Purpose**: Hotel-specific preferences for recommendation engine

**Structure**:
```json
{
  "preferred_brands": ["Marriott", "Hilton"],
  "design_style_ranked": ["luxury", "classic", "modern"],
  "atmosphere_ranked": ["refined", "elegant", "urban"],
  "loyalty_programs": [
    {
      "program": "Marriott Bonvoy",
      "status": "member",
      "priority": 1
    }
  ]
}
```

**Used by**:
- Hotel recommendation engine (`get-hotel-recommendations`)
- Hotel scoring and ranking
- Filtering and matching logic

## Data Mapping

### Goals → Interests
- `maximize-points` → "Points Maximization"
- `travel-optimization` → "Travel"
- `track-benefits` → "Travel"
- `discover-opportunities` → "Travel"
- `redeem-rewards` → "Travel"

### Memberships → Brands/Airlines
**Hotel Brands**:
- `marriott-bonvoy` → "Marriott"
- `hilton-honors` → "Hilton"

**Airlines**:
- `delta-skymiles` → "Delta"
- `united-mileageplus` → "United"

### Travel Styles → Design/Atmosphere
**Design Styles**:
- `luxury` → ["luxury", "classic"]
- `beach` → ["modern", "tropical"]
- `city` → ["modern", "contemporary"]

**Atmospheres**:
- `luxury` → ["refined", "elegant"]
- `adventure` → ["energetic", "vibrant"]
- `beach` → ["relaxed", "casual"]
- `city` → ["urban", "sophisticated"]
- `foodie` → ["social", "culinary"]
- `cultural` → ["authentic", "immersive"]

## Usage Across Platform

### Recommendations
- **Hotel Recommendations**: Uses `user_hotel_preferences` for scoring and filtering
- **Perk Recommendations**: Uses `members.preferences.interests` for matching
- **Flight Recommendations**: Uses `user_preferences.travel_preferences.flight`

### Searches
- **Hotel Search**: Filters by `user_hotel_preferences.preferred_brands`
- **Perk Search**: Matches against `members.preferences.interests`
- **General Search**: Uses `profiles.personal_context` for context

### Tasks & Requests
- **Travel Requests**: Uses `user_preferences.travel_preferences` for defaults
- **Booking Tasks**: References `user_hotel_preferences` for hotel selection
- **Concierge Tasks**: Uses all preference sources for personalization

### Opportunities
- **Trip Opportunities**: Uses `profiles.personal_context.travel_preferences`
- **Benefit Opportunities**: Uses `members.preferences.interests`
- **Upgrade Opportunities**: Uses `user_hotel_preferences.loyalty_programs`

## Data Access Patterns

### For Recommendations
```typescript
// Hotel recommendations
const { data: hotelPrefs } = await supabase
  .from('user_hotel_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// Perk recommendations
const { data: member } = await supabase
  .from('members')
  .select('preferences')
  .eq('id', userId)
  .single();
```

### For Personalization
```typescript
// Full context
const { data: profile } = await supabase
  .from('profiles')
  .select('personal_context')
  .eq('id', userId)
  .single();

// Travel preferences
const { data: userPrefs } = await supabase
  .from('user_preferences')
  .select('travel_preferences')
  .eq('profile_id', userId)
  .single();
```

## Notes

- All data saves are non-blocking (warnings logged but don't fail onboarding)
- Data is normalized across tables for efficient querying
- Preferences can be updated later via profile page
- Missing data defaults to sensible values for recommendations


