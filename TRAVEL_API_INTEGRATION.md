# Travel API Integration Guide

## Overview

Your AI concierge now supports **real-time flight and hotel searches** through multiple providers with automatic fallback.

## Architecture

```
User Request
  → OpenAI Function Calling (extract search params)
  → Search Functions (try providers in priority order)
  → Return Results
  → OpenAI formats results naturally
  → Present to user
```

## Current Providers

### 1. **Duffel** (Priority: 1 - Primary)
- **Status**: API key placeholder in database
- **Capabilities**: Flights, airlines, real-time pricing
- **Best for**: Accurate flight data, bookings
- **API Docs**: https://duffel.com/docs/api
- **Rate Limit**: 60/min (default)

**Setup Steps:**
```sql
UPDATE api_credentials
SET api_key = 'YOUR_DUFFEL_LIVE_API_KEY'
WHERE provider = 'duffel';
```

### 2. **SerpAPI** (Priority: 2 - Secondary)
- **Status**: Ready to activate
- **Capabilities**: Flights, hotels, reviews, supplementary data
- **Best for**: Google Flights/Hotels data, reviews, pricing trends
- **API Docs**: https://serpapi.com/google-flights-api
- **Rate Limit**: Varies by plan

**Setup Steps:**
```sql
UPDATE api_credentials
SET api_key = 'YOUR_SERPAPI_KEY'
WHERE provider = 'serpapi';
```

### 3. **Mondee** (Priority: 3 - Tertiary)
- **Status**: Awaiting API credentials
- **Capabilities**: Flights, hotels, packages
- **Best for**: B2B travel solutions, consolidated inventory
- **API Docs**: (Pending from Mondee)

**Setup Steps:**
```sql
UPDATE api_credentials
SET api_key = 'YOUR_MONDEE_API_KEY',
    api_secret = 'YOUR_MONDEE_SECRET',
    base_url = 'https://api.mondee.com'  -- Confirm with Mondee
WHERE provider = 'mondee';
```

## Recommended Additional Providers

### **Amadeus** (Highly Recommended)
- **Why**: Industry-leading GDS, comprehensive data
- **Capabilities**: Flights, hotels, car rentals, activities
- **Pricing**: Free tier (limited), pay-as-you-go
- **Best for**: Global inventory, accurate pricing
- **Docs**: https://developers.amadeus.com

**Add to database:**
```sql
INSERT INTO api_credentials (provider, api_key, api_secret, base_url, priority, metadata)
VALUES (
  'amadeus',
  'YOUR_AMADEUS_API_KEY',
  'YOUR_AMADEUS_API_SECRET',
  'https://api.amadeus.com',
  2,
  '{"supports": ["flights", "hotels", "cars", "activities"], "version": "v2"}'::jsonb
);
```

### **Skyscanner** (Recommended for comparisons)
- **Why**: Excellent for price comparisons, metasearch
- **Capabilities**: Flights, hotels, car rentals
- **Pricing**: Pay per query
- **Best for**: Finding best deals across multiple airlines
- **Docs**: https://partners.skyscanner.net

### **Kiwi.com** (Recommended for multi-city)
- **Why**: Great for complex itineraries, virtual interlining
- **Capabilities**: Flights (especially budget airlines)
- **Pricing**: Commission-based or API access
- **Best for**: Multi-city trips, budget options
- **Docs**: https://docs.kiwi.com

### **Hotels.com API** (Recommended for hotels)
- **Why**: EPS partner, comprehensive hotel inventory
- **Capabilities**: Hotels worldwide
- **Best for**: Hotel bookings with loyalty program
- **Docs**: https://developers.expediagroup.com

## How It Works

### Flight Search Flow

1. **User**: "I need a flight from NYC to Miami on December 14th"
2. **AI**: Asks for missing info (passengers, cabin class)
3. **User**: "Just me, business class"
4. **AI**: Calls `search_flights()` function
5. **System**:
   - Tries Duffel first
   - If fails, tries SerpAPI
   - If fails, tries Mondee
   - If all fail, returns fallback mock data
6. **AI**: Presents results naturally

### Hotel Search Flow

Similar flow but calls `search-hotels` edge function.

## Database Schema

### `api_credentials` Table
```sql
- provider (text): 'duffel', 'serpapi', 'mondee', etc.
- api_key (text): Primary API key
- api_secret (text): Optional secret for OAuth providers
- base_url (text): API endpoint
- is_active (boolean): Enable/disable provider
- rate_limit_per_minute (integer): Throttling
- priority (smallint): Lower = higher priority (1 = first)
- metadata (jsonb): Provider-specific config
```

## Edge Functions

### 1. `/functions/v1/search-flights`
**Request:**
```json
{
  "origin": "JFK",
  "destination": "MIA",
  "departure_date": "2025-12-14",
  "passengers": 1,
  "cabin_class": "business",
  "trip_type": "one_way"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "airline": "JetBlue",
      "flight_number": "B6 1501",
      "departure_time": "07:00 AM",
      "arrival_time": "10:15 AM",
      "duration": "3h 15m",
      "price": 649,
      "currency": "USD",
      "features": ["Lie-flat seats", "Premium dining"],
      "provider": "duffel"
    }
  ],
  "total": 5
}
```

### 2. `/functions/v1/search-hotels`
**Request:**
```json
{
  "location": "Miami",
  "check_in_date": "2025-12-14",
  "check_out_date": "2025-12-16",
  "guests": 1,
  "min_rating": 4.0
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "name": "The Luxury Collection Hotel",
      "rating": 4.8,
      "price_per_night": 450,
      "total_price": 900,
      "amenities": ["Pool", "Spa", "Concierge"],
      "provider": "serpapi"
    }
  ]
}
```

### 3. `/functions/v1/concierge-chat`
Main AI interface with function calling. Automatically triggers searches when it has enough info.

## Testing

### Test Flight Search Directly
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/search-flights \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "JFK",
    "destination": "LAX",
    "departure_date": "2025-12-20",
    "passengers": 1,
    "cabin_class": "economy"
  }'
```

### Test via Chat Interface
Just ask Paige: "Find me a flight from New York to LA on December 20th"

## Activation Checklist

- [ ] Update Duffel API key in database
- [ ] Add your SerpAPI key
- [ ] Test flight search with real data
- [ ] Add Mondee credentials when received
- [ ] Consider adding Amadeus for redundancy
- [ ] Set up monitoring for API rate limits
- [ ] Configure error alerts

## Fallback Strategy

The system will **always return results** even if all APIs fail:
1. Try Provider #1 (Duffel)
2. Try Provider #2 (SerpAPI)
3. Try Provider #3 (Mondee)
4. Return mock data with `is_fallback: true` flag

This ensures users **never see an error** - they always get options.

## Next Steps

1. **Bookings**: Add booking functions for each provider
2. **Webhooks**: Set up payment confirmation webhooks
3. **Loyalty**: Integrate airline/hotel loyalty programs
4. **Notifications**: Send booking confirmations via email/SMS
5. **Payments**: Integrate Stripe for payment processing

## Security Notes

- API keys stored in Supabase (RLS protected, service role only)
- Never exposed to client-side code
- All searches go through edge functions
- Rate limiting per provider configured in database
