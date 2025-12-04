# Travel Agent Service

The travel agent handles flight and hotel searches, ranking results by user preferences, and creating bookings.

## Endpoints

### 1. Search Flights
`POST /travel-agent/search-flights`

**Request:**
```json
{
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "parameters": {
    "origin": "JFK",
    "destination": "SFO",
    "date": "2025-12-15",
    "passengers": 1,
    "cabin_class": "economy"
  },
  "message": "Find flights from NYC to SF"
}
```

**Response:**
```json
{
  "success": true,
  "confidence": 0.9,
  "message": "I found 25 flight options...",
  "data": {
    "flights": [...],
    "search_params": {...}
  }
}
```

### 2. Search Hotels
`POST /travel-agent/search-hotels`

**Request:**
```json
{
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "parameters": {
    "location": "San Francisco",
    "check_in": "2025-12-15",
    "check_out": "2025-12-18",
    "guests": 2,
    "rooms": 1
  }
}
```

### 3. Create Booking
`POST /travel-agent/create-booking`

**Request:**
```json
{
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "bookingData": {
    "type": "flight",
    "airline": "United",
    "flight_number": "UA123",
    "origin": "JFK",
    "destination": "SFO",
    "departure_date": "2025-12-15",
    "price": 450
  }
}
```

## Features

1. **Flight Search**
   - Uses existing `search-flights` function (Duffel/SerpAPI)
   - Ranks results by user preferences
   - Returns top 10 options

2. **Preference-Based Ranking**
   - Preferred airlines get priority
   - Nonstop flights preferred (if user preference)
   - Morning flights preferred (if user preference)
   - Cabin class matching
   - Falls back to price sorting

3. **Booking Creation**
   - Creates `entities` for bookings (flight/hotel)
   - Creates `entities` for trips
   - Creates `relationships` linking bookings to trips
   - Updates task status

4. **Task Integration**
   - Updates task with search results
   - Stores top options in `output_data`
   - Tracks search parameters

## User Preferences Used

From `profiles.travel_preferences`:
- `preferred_airlines` - Airlines to prioritize
- `booking_preferences.prefer_nonstop` - Prefer nonstop flights
- `booking_preferences.prefer_morning_flights` - Prefer morning departures
- `cabin_preference` - Preferred cabin class

## Database Tables Used

- `profiles` - User travel preferences
- `tasks` - Task tracking and results
- `entities` - Bookings and trips
- `relationships` - Links bookings to trips

## Integration

Called by:
- `orchestrator` service when intent is `travel`

Calls:
- `search-flights` function for actual flight search
- (Future) Hotel search API

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

