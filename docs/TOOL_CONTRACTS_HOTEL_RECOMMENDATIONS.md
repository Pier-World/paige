# Orchestrator Tool Contracts: Hotel Recommendations

This document defines the tool contracts for the AI orchestrator to call when handling hotel recommendation requests. These tools implement the curated inventory matching system.

## Overview

The hotel recommendation system uses a layered approach:
1. **NLU Layer**: Parse natural language into structured intent
2. **Hard Filters**: Filter curated inventory (25-50 properties per geo)
3. **Deterministic Scoring**: Weighted scoring based on user preferences
4. **LLM Re-rank**: Final ranking with explanations
5. **Rate Shopping**: External APIs only for final 2-3 picks
6. **Concierge Handoff**: Structured payload to human concierge

---

## Tool 1: `parse_travel_request`

**Purpose**: NLU layer to extract structured intent from natural language

**Signature**:
```typescript
parse_travel_request(
  message: string,
  user_id: uuid
): {
  city: string | null,
  dates: daterange | null,
  budget_range: int4range | null,
  trip_type: string | null,
  party_size: number | null,
  constraints: jsonb,
  missing_fields: string[]
}
```

**Description**: 
Extracts structured travel intent from user's natural language message. Identifies missing critical information that requires clarification.

**Example Input**:
```json
{
  "message": "I need a hotel in NYC next weekend for a business trip",
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Example Output**:
```json
{
  "city": "NYC",
  "dates": "[2024-12-14,2024-12-16)",
  "budget_range": null,
  "trip_type": "business",
  "party_size": 1,
  "constraints": {
    "work_friendly": true
  },
  "missing_fields": ["budget_range"]
}
```

**Implementation Notes**:
- Use GPT-4 for NLU extraction
- Return `null` for fields that cannot be determined
- `missing_fields` should prioritize: city, dates, budget
- `constraints` is a flexible JSONB object for any extracted requirements

---

## Tool 2: `get_clarifying_questions`

**Purpose**: Generate 1-3 smart follow-ups for missing critical info

**Signature**:
```typescript
get_clarifying_questions(
  parsed_request: object,
  missing_fields: string[]
): {
  questions: string[],
  priority: string
}
```

**Description**:
Generates contextual clarifying questions based on what's missing from the parsed request. Questions should be natural and conversational.

**Example Input**:
```json
{
  "parsed_request": {
    "city": "NYC",
    "dates": null,
    "budget_range": null,
    "trip_type": "business"
  },
  "missing_fields": ["dates", "budget_range"]
}
```

**Example Output**:
```json
{
  "questions": [
    "What dates are you looking for?",
    "What's your budget per night?"
  ],
  "priority": "high"
}
```

**Implementation Notes**:
- Maximum 3 questions to avoid overwhelming user
- Priority can be: "high", "medium", "low"
- Questions should be specific and actionable
- Use user's context (e.g., past bookings) to make questions smarter

---

## Tool 3: `get_hotel_recommendations`

**Purpose**: Core matching engine - filter → score → LLM re-rank

**Signature**:
```typescript
get_hotel_recommendations(
  city: string,
  dates: daterange | null,
  budget_range: int4range | null,
  trip_type: string | null,
  party_size: number | null,
  user_id: uuid
): {
  hotels: Array<{
    id: uuid,
    name: string,
    score: number,
    score_breakdown: {
      budget_fit: number,
      vibe_match: number,
      neighborhood_match: number,
      loyalty_bonus: number,
      pier_perks: number,
      taste_similarity: number
    },
    reason: string
  }>,
  filter_stats: {
    total_candidates: number,
    after_hard_filters: number,
    after_scoring: number,
    final_shown: number
  }
}
```

**Description**:
The core matching engine that:
1. Applies hard filters (city, budget, must-haves)
2. Scores candidates using weighted factors
3. LLM re-ranks top 5-8 to final 2-3 with explanations

**Scoring Weights** (tunable):
- Budget Fit: 0.25
- Vibe Match: 0.20
- Neighborhood Match: 0.15
- Loyalty Bonus: 0.15
- Pier Perks: 0.10
- Taste Vector Similarity: 0.15

**Example Input**:
```json
{
  "city": "NYC",
  "dates": "[2024-12-14,2024-12-16)",
  "budget_range": "[300,600)",
  "trip_type": "business",
  "party_size": 1,
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Example Output**:
```json
{
  "hotels": [
    {
      "id": "hotel-uuid-1",
      "name": "The Greenwich Hotel",
      "score": 0.87,
      "score_breakdown": {
        "budget_fit": 0.95,
        "vibe_match": 0.90,
        "neighborhood_match": 0.85,
        "loyalty_bonus": 0.80,
        "pier_perks": 0.70,
        "taste_similarity": 0.92
      },
      "reason": "Perfect for your business trip - excellent WiFi, quiet rooms, and walking distance to Soho meetings. Your past stays show you love boutique properties with great service."
    }
  ],
  "filter_stats": {
    "total_candidates": 35,
    "after_hard_filters": 12,
    "after_scoring": 8,
    "final_shown": 2
  }
}
```

**Implementation Notes**:
- Hard filters: city, budget (if specified), must-haves from user preferences
- Scoring uses deterministic weights (explainable)
- LLM re-rank takes top 5-8 and produces final 2-3 with natural language reasons
- Log everything to `recommendation_events` table

---

## Tool 4: `get_hotel_rates`

**Purpose**: Hit external APIs only for final 2-3 picks

**Signature**:
```typescript
get_hotel_rates(
  hotel_ids: uuid[],
  dates: daterange,
  user_loyalty: object
): {
  rates: Array<{
    hotel_id: uuid,
    source: string, // "google", "amex_fhr", "virtuoso", "direct"
    rate: number,
    currency: string,
    cancellation: string, // "free", "partial", "non-refundable"
    perks: string[] // ["breakfast", "upgrade", "late_checkout"]
  }>
}
```

**Description**:
Queries external APIs (Google Hotels, Amex FHR, Virtuoso) only for the final 2-3 hotel candidates. This is the cost advantage - we don't hit APIs for every property.

**Example Input**:
```json
{
  "hotel_ids": ["hotel-uuid-1", "hotel-uuid-2"],
  "dates": "[2024-12-14,2024-12-16)",
  "user_loyalty": {
    "amex_platinum": true,
    "virtuoso_member": false
  }
}
```

**Example Output**:
```json
{
  "rates": [
    {
      "hotel_id": "hotel-uuid-1",
      "source": "amex_fhr",
      "rate": 450,
      "currency": "USD",
      "cancellation": "free",
      "perks": ["breakfast", "upgrade", "$100_credit"]
    },
    {
      "hotel_id": "hotel-uuid-1",
      "source": "direct",
      "rate": 425,
      "currency": "USD",
      "cancellation": "partial",
      "perks": []
    },
    {
      "hotel_id": "hotel-uuid-2",
      "source": "google",
      "rate": 380,
      "currency": "USD",
      "cancellation": "free",
      "perks": []
    }
  ]
}
```

**Implementation Notes**:
- Only call for final 2-3 hotels (cost optimization)
- Check user's loyalty status for partner rates
- Return all available sources for comparison
- Sort by best value (rate + perks value)

---

## Tool 5: `create_concierge_booking_task`

**Purpose**: Structured handoff to human concierge

**Signature**:
```typescript
create_concierge_booking_task(
  hotel_id: uuid,
  dates: daterange,
  user_id: uuid,
  special_requests: string | null,
  rate_info: object
): {
  task_id: uuid,
  estimated_response_time: string
}
```

**Description**:
Creates a structured task for the human concierge team to complete the booking. Includes all necessary context.

**Example Input**:
```json
{
  "hotel_id": "hotel-uuid-1",
  "dates": "[2024-12-14,2024-12-16)",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "special_requests": "High floor, quiet room",
  "rate_info": {
    "source": "amex_fhr",
    "rate": 450,
    "perks": ["breakfast", "upgrade"]
  }
}
```

**Example Output**:
```json
{
  "task_id": "task-uuid-123",
  "estimated_response_time": "2-4 hours"
}
```

**Implementation Notes**:
- Creates task in `tasks` table with status `awaiting_human`
- Links to Front conversation if available
- Includes all booking context in task metadata
- Can be routed to appropriate concierge based on hotel/geo

---

## Integration with Orchestrator

These tools should be called by the orchestrator in this sequence:

1. User sends message → `parse_travel_request`
2. If missing fields → `get_clarifying_questions`
3. Once complete → `get_hotel_recommendations`
4. For final picks → `get_hotel_rates`
5. User confirms → `create_concierge_booking_task`
6. Log everything → `recommendation_events` table

## Error Handling

All tools should:
- Return structured error objects with `error` and `message` fields
- Log errors to `recommendation_events` table
- Gracefully degrade (e.g., if rate API fails, show hotel without rates)
- Never throw unhandled exceptions

## Performance Targets

- `parse_travel_request`: < 2s
- `get_clarifying_questions`: < 1s
- `get_hotel_recommendations`: < 3s (hard filters + scoring), < 5s (with LLM re-rank)
- `get_hotel_rates`: < 5s per hotel (external API dependent)
- `create_concierge_booking_task`: < 1s

Total time-to-first-rec target: **< 8 seconds**

