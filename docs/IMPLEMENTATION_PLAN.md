# Pier OS v2 MVP - Implementation Plan

## Current State Assessment

### ✅ **COMPLETED**

1. **Database Schema**
   - ✅ 10-table MVP schema migration exists
   - ✅ RLS policies enabled
   - ✅ Indexes created

2. **UI/Design**
   - ✅ All 5 pages implemented (Home, Calendar, Perks, Memberships, Experiences)
   - ✅ Dark luxury design system applied
   - ✅ Components created (TaskCard, TripCard, NotificationCard, etc.)
   - ✅ Navigation updated

3. **OAuth & Sync (Partial)**
   - ✅ `auth-google` Edge Function (OAuth flow)
   - ✅ `gmail-sync` Edge Function (basic implementation)
   - ✅ `calendar-sync` Edge Function (basic implementation)
   - ✅ Encryption utilities (`_shared/encryption.ts`)
   - ✅ Google OAuth helper (`_shared/google-oauth.ts`)

### ⚠️ **NEEDS ALIGNMENT**

1. **Schema Mismatch**
   - Existing code uses old schema: `requests`, `concierge_messages`, `concierge_conversations`
   - MVP spec uses: `tasks`, `conversations`
   - **Action:** Refactor all services to use MVP schema

2. **Orchestrator Service**
   - ✅ `ai-orchestrator` exists but uses old schema
   - ❌ Missing GPT-4 intent classification
   - ❌ Missing proper agent routing
   - **Action:** Rewrite to match MVP spec

3. **Agent Services**
   - ✅ `search-flights` exists (uses Duffel, not Amadeus)
   - ❌ `travel-agent` service missing (needs to be created)
   - ❌ `scheduling-agent` missing
   - ❌ `loyalty-agent` missing
   - **Action:** Create new services per MVP spec

4. **Home Feed & Automation**
   - ❌ `home-feed` service missing
   - ❌ `daily-brief` automation missing
   - **Action:** Create both services

5. **Frontend Integration**
   - ✅ `ConciergeInput` component exists
   - ❌ Not connected to orchestrator
   - ❌ No real-time updates
   - **Action:** Connect frontend to backend services

---

## Implementation Roadmap

### **PHASE 1: Schema Alignment & Core Services (Week 1-2)**

#### Step 1.1: Verify & Update Database Schema ✅
- [x] Verify all 10 tables exist with correct structure
- [x] Ensure `profiles` table has all MVP columns (using `profiles` as `user_profiles`)
- [x] Add enhanced columns for agent indexing (`personal_context`, `communication_preferences`, `metadata`)
- [x] Verify all indexes are created (including GIN indexes for JSONB)
- [x] Test RLS policies
- [x] Create helper functions for agent queries
- [x] Create verification script (`supabase/scripts/verify_schema.sql`)
- [x] Create enhancement migration (`20251201_verify_and_enhance_profiles_schema.sql`)
- [x] Create alignment migration for `user_preferences` table (`20251201_align_user_preferences_with_profiles.sql`)

**Files Created:**
- `supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql` - Main enhancement
- `supabase/migrations/20251201_align_user_preferences_with_profiles.sql` - Preference alignment
- `supabase/scripts/verify_schema.sql` - Verification script
- `docs/DATABASE_SCHEMA_VERIFICATION.md` - Documentation

#### Step 1.2: Refactor Existing Services to MVP Schema
- [ ] Update `gmail-sync` to use `emails` table (already correct)
- [ ] Update `calendar-sync` to use `calendar_events` table (already correct)
- [ ] Update `auth-google` to use `integrations` table (already correct)
- [ ] **NEW:** Create `orchestrator` service using `tasks` and `conversations` tables
- [ ] **NEW:** Create `travel-agent` service
- [ ] **NEW:** Create `scheduling-agent` service
- [ ] **NEW:** Create `loyalty-agent` service (stub)

#### Step 1.3: Environment Variables Setup
- [ ] Document required environment variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `OPENAI_API_KEY` (for GPT-4)
  - `AMADEUS_API_KEY` (for flight/hotel search)
  - `AMADEUS_API_SECRET`
  - `MASTER_ENCRYPTION_KEY`
- [ ] Create `.env.example` file
- [ ] Verify all Edge Functions can access env vars

---

### **PHASE 2: Orchestrator & Agent Services (Week 2-3)**

#### Step 2.1: Create MVP Orchestrator Service ✅
**File:** `supabase/functions/orchestrator/index.ts`

**Requirements:**
- [x] Endpoint: `POST /orchestrator/chat`
- [x] Receive user message
- [x] Store in `conversations` table (role: 'user')
- [x] Create `task` record (task_type: 'user_request')
- [x] Call GPT-4 for intent classification
- [x] Route to appropriate agent:
  - Travel intent → `travel-agent`
  - Scheduling intent → `scheduling-agent`
  - Loyalty intent → `loyalty-agent`
- [x] Handle escalation logic (confidence < 0.7)
- [x] Store assistant response in `conversations` table
- [x] Update task status
- [x] Get user context (profile, preferences, recent tasks/trips)
- [x] Create notifications for escalated tasks

**Key Functions:**
```typescript
async function handleUserMessage(userId: string, message: string)
async function classifyIntent(message: string, context: UserContext): Promise<Intent>
async function routeToAgent(intent: Intent, taskId: string): Promise<AgentResult>
async function shouldEscalate(result: AgentResult): Promise<boolean>
async function getUserContext(supabase: any, userId: string): Promise<UserContext>
```

**Files Created:**
- `supabase/functions/orchestrator/index.ts` - Main orchestrator service
- `supabase/functions/orchestrator/README.md` - Documentation

#### Step 2.2: Create Travel Agent Service ✅
**File:** `supabase/functions/travel-agent/index.ts`

**Requirements:**
- [x] Endpoint: `POST /travel-agent/search-flights`
- [x] Endpoint: `POST /travel-agent/search-hotels`
- [x] Endpoint: `POST /travel-agent/create-booking`
- [x] Integrate with existing `search-flights` function (uses Duffel/SerpAPI)
- [x] Parse search parameters from intent parameters
- [x] Rank results by user preferences (from `profiles.travel_preferences`)
- [x] Create `entities` for bookings (entity_type: 'flight' or 'hotel')
- [x] Create `entities` for trips (entity_type: 'trip')
- [x] Create `relationships` linking bookings to trips
- [x] Update task with results

**Key Functions:**
```typescript
async function searchFlights(params: FlightSearchParams): Promise<FlightOption[]>
async function searchHotels(params: HotelSearchParams): Promise<HotelOption[]>
async function createBooking(userId: string, booking: BookingData): Promise<Entity>
function rankFlightsByPreferences(flights: any[], preferences: any): any[]
```

**Files Created:**
- `supabase/functions/travel-agent/index.ts` - Main travel agent service
- `supabase/functions/travel-agent/README.md` - Documentation

**Features:**
- Preference-based ranking (preferred airlines, nonstop, morning flights)
- Integration with existing search-flights function
- Creates entities and relationships for bookings/trips
- Updates tasks with search results

#### Step 2.3: Create Scheduling Agent Service
**File:** `supabase/functions/scheduling-agent/index.ts`

**Requirements:**
- [ ] Endpoint: `POST /scheduling-agent/find-slots`
- [ ] Endpoint: `POST /scheduling-agent/check-conflicts`
- [ ] Query `calendar_events` for user
- [ ] Find free time slots
- [ ] Check for conflicts
- [ ] Return available slots

**Key Functions:**
```typescript
async function findFreeSlots(userId: string, duration: number, dateRange: DateRange)
async function checkConflicts(userId: string, proposedTime: Date)
```

#### Step 2.4: Create Loyalty Agent Service (Stub)
**File:** `supabase/functions/loyalty-agent/index.ts`

**Requirements:**
- [ ] Endpoint: `POST /loyalty-agent/add-account`
- [ ] Endpoint: `POST /loyalty-agent/calculate-value`
- [ ] Manual entry only (no API integrations)
- [ ] Create `entities` of type 'loyalty_account'
- [ ] Simple points value calculation

**Key Functions:**
```typescript
async function addLoyaltyAccount(userId: string, account: LoyaltyAccountInput)
async function calculateRedemptionValue(points: number, program: string): Promise<number>
```

---

### **PHASE 3: Home Feed & Automation (Week 3-4)**

#### Step 3.1: Create Home Feed Generator
**File:** `supabase/functions/home-feed/index.ts`

**Requirements:**
- [ ] Endpoint: `GET /home-feed`
- [ ] Query today's calendar events
- [ ] Query tomorrow's calendar events
- [ ] Query upcoming trips (next 7 days)
- [ ] Query recent tasks
- [ ] Query unread notifications
- [ ] Generate AI summaries with GPT-4
- [ ] Return structured JSON matching `HomeFeed` interface

**Key Functions:**
```typescript
async function generateHomeFeed(userId: string): Promise<HomeFeed>
async function generateAISummary(events: CalendarEvent[], tasks: Task[]): Promise<string>
```

#### Step 3.2: Create Daily Brief Automation
**File:** `supabase/functions/daily-brief/index.ts`

**Requirements:**
- [ ] Endpoint: `POST /daily-brief/generate`
- [ ] Call home feed generator
- [ ] Format as notification
- [ ] Create notification in `notifications` table
- [ ] Set up pg_cron job (6 AM daily)

**Key Functions:**
```typescript
async function generateDailyBrief(userId: string): Promise<void>
```

**pg_cron Setup:**
```sql
SELECT cron.schedule(
  'daily-brief',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-brief/generate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"userId": "..."}'::jsonb
  );
  $$
);
```

---

### **PHASE 4: Frontend Integration (Week 4-5)**

#### Step 4.1: Connect ConciergeInput to Orchestrator
**File:** `src/components/ui/ConciergeInput.tsx`

**Requirements:**
- [ ] Update `handleSend` to call orchestrator endpoint
- [ ] Show loading state while processing
- [ ] Display assistant response
- [ ] Handle errors gracefully

#### Step 4.2: Update HomePage to Use Home Feed Service
**File:** `src/pages/HomePage.tsx`

**Requirements:**
- [ ] Replace direct Supabase queries with `home-feed` endpoint call
- [ ] Display AI summaries
- [ ] Show real-time updates (Supabase realtime subscriptions)

#### Step 4.3: Create Task Management UI
**File:** `src/pages/TasksPage.tsx`

**Requirements:**
- [ ] Query `tasks` table
- [ ] Filter by status (active, awaiting_review, completed)
- [ ] Display task details
- [ ] Show "Needs Review" badge for escalated tasks
- [ ] Allow task actions (approve, reject, view details)

#### Step 4.4: Update TravelPage for Booking Flow
**File:** `src/pages/TravelPage.tsx`

**Requirements:**
- [ ] Connect ConciergeInput to orchestrator
- [ ] Display flight/hotel search results
- [ ] Allow booking selection
- [ ] Show booking confirmation
- [ ] Display active trips from `entities` table

#### Step 4.5: Real-time Updates
**Requirements:**
- [ ] Set up Supabase realtime subscriptions for:
  - `tasks` table (status changes)
  - `conversations` table (new messages)
  - `notifications` table (new notifications)
  - `calendar_events` table (new events)
- [ ] Update UI when data changes

---

### **PHASE 5: Profile & Preferences (Week 5-6)**

#### Step 5.1: Update ProfilePage
**File:** `src/pages/ProfilePage.tsx`

**Requirements:**
- [ ] Load user data from `user_profiles` table
- [ ] Edit personal info (name, email, phone, time_zone)
- [ ] Edit travel preferences (JSONB editor or form):
  - Preferred airlines
  - Seat preference
  - Cabin preference
  - TSA PreCheck number
  - Known Traveler Number
- [ ] Display connected services (Gmail, Calendar)
- [ ] Add loyalty accounts (via `loyalty-agent`)

#### Step 5.2: Create Loyalty Account Management
**Requirements:**
- [ ] Form to add loyalty account
- [ ] List existing accounts from `entities` table
- [ ] Display account details (program, number, points)
- [ ] Calculate redemption value

---

### **PHASE 6: Testing & Polish (Week 6-7)**

#### Step 6.1: End-to-End Testing
- [ ] Test Gmail sync flow
  - Connect Gmail
  - Verify emails syncing
  - Verify travel confirmations parsed
  - Verify trips created
- [ ] Test Calendar sync flow
  - Connect Calendar
  - Verify events syncing
  - Verify events linked to trips
  - Create event from Pier, verify in Google
- [ ] Test travel booking flow
  - Ask for flights in chat
  - Verify orchestrator routes to travel-agent
  - Verify search results returned
  - Verify booking creates entities/relationships
  - Verify appears in home feed
- [ ] Test escalation flow
  - Trigger low confidence scenario
  - Verify task marked as `awaiting_human`
  - Verify notification created

#### Step 6.2: Error Handling & Loading States
- [ ] Add loading spinners for all async operations
- [ ] Add error messages for failed operations
- [ ] Add retry logic for failed API calls
- [ ] Add empty states for no data

#### Step 6.3: Security Review
- [ ] Test RLS policies (users can only see their data)
- [ ] Verify encryption/decryption working
- [ ] Test API endpoint authentication
- [ ] Add rate limiting (basic)

---

### **PHASE 7: Deployment & Documentation (Week 7-8)**

#### Step 7.1: Environment Setup
- [ ] Deploy all Edge Functions to Supabase
- [ ] Configure environment variables in Supabase dashboard
- [ ] Set up pg_cron for daily brief
- [ ] Configure Gmail push notifications
- [ ] Configure Google Calendar webhooks

#### Step 7.2: Documentation
- [ ] API endpoint documentation
- [ ] Schema documentation
- [ ] Deployment guide
- [ ] User guide (basic)

---

## Priority Order (What to Build First)

### **IMMEDIATE (This Week)**

1. **Schema Verification**
   - Verify `user_profiles` table exists (may need migration)
   - Ensure all tables match MVP spec exactly

2. **Orchestrator Service (MVP Version)**
   - Create new `orchestrator` service using `tasks` and `conversations`
   - Basic GPT-4 intent classification
   - Route to travel-agent for travel intents

3. **Travel Agent Service**
   - Create `travel-agent` service
   - Flight search (use existing `search-flights` or integrate Amadeus)
   - Create entities/relationships for bookings

4. **Frontend Integration**
   - Connect `ConciergeInput` to orchestrator
   - Display responses in UI
   - Show loading states

### **NEXT (Week 2)**

5. **Home Feed Service**
   - Generate today/tomorrow summaries
   - Query trips, events, tasks
   - AI summaries

6. **Scheduling Agent**
   - Basic free slot finding
   - Conflict checking

7. **Loyalty Agent (Stub)**
   - Manual account entry
   - Basic value calculation

### **THEN (Week 3-4)**

8. **Daily Brief Automation**
   - pg_cron setup
   - Notification generation

9. **Real-time Updates**
   - Supabase subscriptions
   - Live UI updates

10. **Profile & Preferences**
    - Travel preferences form
    - Loyalty account management

---

## Key Decisions Needed

1. **Amadeus vs Duffel**
   - Current: `search-flights` uses Duffel
   - MVP Spec: Recommends Amadeus
   - **Decision:** Keep Duffel if working, or switch to Amadeus?

2. **GPT-4 vs Claude**
   - Current: Some services use OpenAI
   - MVP Spec: Mentions GPT-4
   - **Decision:** Standardize on GPT-4 or Claude?

3. **Schema Migration**
   - Current: May have `profiles` table
   - MVP Spec: Uses `user_profiles`
   - **Decision:** Rename or create migration?

4. **Real-time vs Polling**
   - MVP Spec: Implies real-time
   - **Decision:** Use Supabase realtime subscriptions or polling?

---

## Next Immediate Steps

1. **Verify Database Schema**
   ```bash
   # Check if user_profiles table exists
   # Check all 10 tables match MVP spec
   ```

2. **Create Orchestrator Service**
   - Start with basic version
   - Connect to GPT-4
   - Route to travel-agent

3. **Create Travel Agent Service**
   - Integrate flight search
   - Create entities/relationships

4. **Connect Frontend**
   - Update ConciergeInput
   - Display responses
   - Show task status

---

## Success Criteria

After completing this plan, you should be able to:

1. ✅ User sends message: "Find flights from NYC to SF next Tuesday"
2. ✅ Orchestrator classifies intent as travel
3. ✅ Travel agent searches flights
4. ✅ Results displayed in UI
5. ✅ User selects flight
6. ✅ Booking creates trip entity
7. ✅ Trip appears in home feed
8. ✅ Calendar events sync and link to trips
9. ✅ Daily brief arrives at 6 AM

---

## Questions to Resolve

1. Do we have Amadeus API credentials, or should we use Duffel?
2. Do we have OpenAI API key for GPT-4?
3. Should we use `user_profiles` or `profiles` table name?
4. Do we want real-time subscriptions or is polling acceptable for MVP?
5. Should we integrate Front for escalation, or just mark tasks as `awaiting_human`?

