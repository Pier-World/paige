# Travel Concierge Upgrade - Implementation Guide

## Overview

The Travel Concierge has been upgraded from a simple chat interface to an intelligent, conversational travel request system with:

- **Entity extraction** from natural language input
- **Smart chips** for viewing/editing structured travel data
- **Realtime result streaming** via Supabase subscriptions
- **Live voice transcription** with Web Speech API
- **Booking flow** with confirmation modal
- **Supabase integration** with full CRUD + realtime support

## Architecture

### Components

**Frontend:**
- `TravelPage.tsx` - Main chat interface with integrated components
- `SmartChipsBar.tsx` - Editable chips showing extracted travel data
- `ResultCards.tsx` - Display flight/hotel/other offers
- `BookingModal.tsx` - Booking confirmation UI

**State Management:**
- `stores/travelStore.ts` - Zustand store for travel request state

**Business Logic:**
- `lib/travelParser.ts` - NLP entity extraction
- `lib/api/travelRequests.ts` - Supabase CRUD + realtime subscriptions

**Database:**
- Enhanced `requests` table with `entities` (JSONB), `results` (JSONB), `front_conversation_id`
- Existing `messages`, `conversations`, `channels`, `profiles` tables
- Realtime subscriptions for live updates

### Data Flow

1. **User input** → `parseTravelRequest()` extracts entities
2. **Create request** → Save to Supabase `requests` table
3. **Generate chips** → Display editable fields from entities
4. **Search** → `generateMockResults()` simulates orchestrator (3s delay)
5. **Stream results** → Realtime subscription updates UI with offers
6. **Select & book** → Update request status, show confirmation

## Key Features

### 1. Entity Extraction

```typescript
parseTravelRequest("Round trip NYC to Austin Friday to Sunday, business class")
```

Extracts:
- Route: JFK → AUS
- Dates: Departure & return
- Cabin: Business
- Passengers: 1 (default)

Supports:
- Airports (codes + city names with disambiguation)
- Dates (natural language: "tomorrow", "next weekend", "Oct 28")
- Hotels (city, check-in/out, brand preferences)
- Cabin class, passengers, budget, nonstop preference
- Add-ons (driver, lounge, experiences)

### 2. Smart Chips

Chips display extracted fields:
- **Flight**: Route, Dates, Cabin, Passengers, Nonstop
- **Hotel**: City, Check-in, Check-out, Brand, Budget
- **Add-ons**: Driver, Transfer, Dining, Lounge

Click any chip to edit inline:
- Dropdown for predefined options (cabin class, nonstop)
- Text input for open fields (budget, city)
- Changes sync to Supabase instantly

### 3. Voice Input with Live Transcription

Enhanced Web Speech API integration:
- **Press mic** → Start listening
- **Live transcript** displays in blue banner above input
- **Final transcript** appends to input field
- **Press again** → Stop recording

Continuous recognition with interim results for better UX.

### 4. Result Cards

Displays offers with:
- Supplier type icon (flight, hotel, etc.)
- Summary, description, highlights
- Price with currency formatting
- "Select" button (visual indicator when selected)
- Image placeholder (stock photos)

Sorted by rank, filterable by price/rating.

### 5. Booking Modal

After selecting an offer:
- Summary of booking (service, dates, price)
- Trip details from entities
- Travel protection badge
- Payment method display
- Confirm/Cancel actions
- Success animation on completion

## Database Schema

### Enhanced `requests` table

```sql
CREATE TABLE requests (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  intent intent_t,           -- enum: flight, hotel, etc.
  raw_text text,
  entities jsonb,             -- structured travel data
  status text,                -- new, collecting, offered, booked
  results jsonb,              -- array of offers
  front_conversation_id text, -- link to Front inbox
  created_at timestamptz
);
```

### Entities JSONB Structure

```json
{
  "types": ["flight", "hotel"],
  "flight": {
    "from": "JFK",
    "to": "AUS",
    "depart": "2025-10-31",
    "return": "2025-11-02",
    "cabin": "Business",
    "nonstop": true,
    "passengers": 1
  },
  "hotel": {
    "city": "Paris",
    "check_in": "2025-10-28",
    "check_out": "2025-11-01",
    "brand_prefs": ["Ritz"],
    "amenities": ["Spa", "Breakfast"]
  }
}
```

### Results JSONB Structure

```json
[
  {
    "id": "flight-1-123456",
    "supplier_type": "air",
    "summary": "JFK → AUS - Business Class",
    "terms": {
      "description": "Nonstop flight",
      "highlights": ["Lie-flat seats", "Lounge access"],
      "per": "per person"
    },
    "price_cents": 289900,
    "currency": "USD",
    "rank": 1,
    "selected": false
  }
]
```

## API Functions

### Travel Requests

```typescript
// Create new request
const request = await createTravelRequest(userId, rawText, intent);

// Update request
await updateTravelRequest(requestId, { entities, status, results });

// Subscribe to realtime updates
const unsubscribe = subscribeToRequestUpdates(requestId, (updated) => {
  setActiveTravelRequest(updated);
});
```

### Messages

```typescript
// Create message
await createMessage(conversationId, 'in', 'user', body, requestId);

// Subscribe to new messages
const unsubscribe = subscribeToNewMessages(conversationId, (newMsg) => {
  addMessageToUI(newMsg);
});
```

## Integration with Orchestrator

The current implementation uses `generateMockResults()` to simulate the orchestrator. To integrate with the real orchestrator:

1. **Replace mock function** in `lib/api/travelRequests.ts`
2. **Call orchestrator API** with request entities
3. **Stream results** back to Supabase `requests.results`
4. **Realtime subscription** automatically updates UI

Example orchestrator integration:

```typescript
export async function searchWithOrchestrator(requestId: string, intent: TravelIntent) {
  // Call your orchestrator endpoint
  const response = await fetch('https://orchestrator.api/search', {
    method: 'POST',
    body: JSON.stringify({ intent }),
  });

  const offers = await response.json();

  // Update Supabase - realtime subscription will update UI
  await updateTravelRequest(requestId, {
    results: offers,
    status: 'offered',
  });
}
```

## Front Integration

The `front_conversation_id` field links travel requests to Front conversations:

```typescript
// Set Front conversation ID when creating request
await updateTravelRequest(requestId, {
  front_conversation_id: frontConvId,
});
```

This allows agents in Front to:
- See full travel request context
- View extracted entities and search results
- Take over conversation from AI when needed

## Testing Checklist

✅ **User types travel request** → Entities extracted, chips displayed
✅ **Edit chip value** → Supabase updates, chip re-renders
✅ **Voice input** → Live transcript displays, finalizes on completion
✅ **Results stream in** → Cards appear after 3s delay
✅ **Select offer** → Visual indicator, "Proceed to Booking" appears
✅ **Confirm booking** → Status updates, confirmation message sent
✅ **Realtime updates** → Changes in DB instantly reflect in UI
✅ **Conversation persistence** → Messages saved and loaded on page refresh

## Example User Flow

1. User navigates to `/travel`
2. Welcome message from Paige displays
3. User types: **"Round trip NYC to Austin this Friday to Sunday, business class"**
4. System extracts:
   - Flight: JFK → AUS
   - Depart: 2025-10-31
   - Return: 2025-11-02
   - Cabin: Business
   - Passengers: 1
5. Paige responds: **"Perfect! I'm searching for JFK → AUS, Oct 31 to Nov 2, in Business class, for 1 passenger..."**
6. Smart chips display below message (editable)
7. After 3s, result cards appear with 2 flight options
8. User clicks **"Select"** on preferred option
9. **"Proceed to Booking"** button appears
10. User clicks, booking modal opens with summary
11. User confirms → Status updates to 'booked'
12. Confirmation message from concierge team

## Next Steps

- [ ] Connect to real orchestrator API
- [ ] Implement Front webhook integration
- [ ] Add payment processing
- [ ] Enhance entity extraction (more airports, dates, etc.)
- [ ] Add trip management UI (view past bookings)
- [ ] Implement multi-turn conversation (clarifying questions)
- [ ] Add file upload (passport, preferences)

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **State**: Zustand
- **Backend**: Supabase (Postgres + Realtime)
- **Auth**: Supabase Auth
- **Voice**: Web Speech API
- **Deployment**: Vite build

---

**Built for Pier Members Club** - Luxury travel concierge experience