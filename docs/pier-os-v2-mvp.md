# Pier OS v2: Minimal Viable Product (6-8 Week MVP)

## Overview

This is a **ruthlessly scoped** version of Pier OS 2.0 focused on proving the core value proposition: AI-powered travel assistance with basic calendar awareness and loyalty optimization. Everything else is deferred to Phase 2.

**Core Value:** "Book my travel intelligently using my calendar context and loyalty accounts, then keep me organized."

---

## 1. Minimal Schema (10 Tables)

### Database Schema

```sql

-- ============================================================================

-- TABLE 1: user_profiles (Universal Personal Profile - Simplified)

-- ============================================================================

CREATE TABLE user_profiles (

  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  

  -- Identity

  full_name TEXT NOT NULL,

  email TEXT NOT NULL,

  phone_number TEXT,

  time_zone TEXT DEFAULT 'America/New_York',

  

  -- Travel Preferences (JSONB for flexibility)

  travel_preferences JSONB DEFAULT '{}'::jsonb,

  -- Example: {

  --   "preferred_airlines": ["United", "Delta"],

  --   "seat_preference": "aisle",

  --   "cabin_preference": "economy",

  --   "tsa_precheck": "123456789",

  --   "known_traveler_number": "XX1234567"

  -- }

  

  -- System

  onboarding_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- ============================================================================

-- TABLE 2: integrations (OAuth tokens and sync state combined)

-- ============================================================================

CREATE TABLE integrations (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Integration Type

  provider TEXT NOT NULL, -- 'google_gmail', 'google_calendar', 'stripe'

  

  -- OAuth Tokens (ENCRYPTED at application layer)

  access_token TEXT, -- encrypted

  refresh_token TEXT, -- encrypted

  expires_at TIMESTAMPTZ,

  scopes TEXT[],

  

  -- Sync State

  is_active BOOLEAN DEFAULT true,

  last_sync_at TIMESTAMPTZ,

  sync_cursor TEXT, -- Gmail historyId, Calendar syncToken, etc.

  

  -- Metadata

  metadata JSONB DEFAULT '{}'::jsonb,

  

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  

  UNIQUE(user_id, provider)

);

CREATE INDEX idx_integrations_user_provider ON integrations(user_id, provider);

CREATE INDEX idx_integrations_active ON integrations(user_id, is_active) WHERE is_active = true;

-- ============================================================================

-- TABLE 3: entities (Simplified PKG - Everything is an entity)

-- ============================================================================

CREATE TABLE entities (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Entity Type & Data

  entity_type TEXT NOT NULL, -- 'trip', 'flight', 'hotel', 'person', 'loyalty_account', 'payment_method'

  data JSONB NOT NULL, -- All entity-specific data goes here

  

  -- Metadata

  source TEXT, -- 'gmail', 'calendar', 'user_input', 'agent'

  source_id TEXT, -- Reference to source (email_id, calendar_event_id)

  confidence FLOAT DEFAULT 1.0,

  

  -- Timestamps

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_entities_user_type ON entities(user_id, entity_type);

CREATE INDEX idx_entities_source ON entities(source, source_id);

CREATE INDEX idx_entities_created ON entities(user_id, created_at DESC);

-- ============================================================================

-- TABLE 4: relationships (Simplified - Links between entities)

-- ============================================================================

CREATE TABLE relationships (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  from_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,

  to_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,

  relationship_type TEXT NOT NULL, -- 'includes', 'paid_with', 'booked_with', 'related_to'

  

  metadata JSONB DEFAULT '{}'::jsonb,

  

  created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_relationships_from ON relationships(from_entity_id);

CREATE INDEX idx_relationships_to ON relationships(to_entity_id);

CREATE INDEX idx_relationships_user ON relationships(user_id);

-- ============================================================================

-- TABLE 5: calendar_events (Google Calendar sync)

-- ============================================================================

CREATE TABLE calendar_events (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Google Calendar IDs

  gcal_event_id TEXT NOT NULL,

  gcal_calendar_id TEXT NOT NULL,

  

  -- Event Data

  title TEXT,

  description TEXT,

  location TEXT,

  

  -- Timing

  start_time TIMESTAMPTZ NOT NULL,

  end_time TIMESTAMPTZ NOT NULL,

  all_day BOOLEAN DEFAULT false,

  time_zone TEXT,

  

  -- Status

  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'

  

  -- Related entities (denormalized for quick access)

  related_trip_id UUID REFERENCES entities(id),

  

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  

  UNIQUE(user_id, gcal_event_id)

);

CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time);

CREATE INDEX idx_calendar_events_trip ON calendar_events(related_trip_id) WHERE related_trip_id IS NOT NULL;

-- ============================================================================

-- TABLE 6: emails (Simplified - Just parsed emails)

-- ============================================================================

CREATE TABLE emails (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Gmail metadata

  gmail_message_id TEXT NOT NULL,

  gmail_thread_id TEXT,

  

  -- Email basics

  subject TEXT,

  from_address TEXT,

  received_at TIMESTAMPTZ NOT NULL,

  

  -- Body (truncated for performance)

  body_preview TEXT, -- First 500 chars

  

  -- Classification

  category TEXT, -- 'travel_confirmation', 'receipt', 'other'

  

  -- Extracted data

  extracted_data JSONB DEFAULT '{}'::jsonb,

  -- Example for travel_confirmation:

  -- {

  --   "confirmation_number": "ABC123",

  --   "airline": "United",

  --   "flight_number": "UA123",

  --   "from": "JFK",

  --   "to": "SFO",

  --   "departure": "2025-12-05T08:00:00Z"

  -- }

  

  -- Processing

  processed BOOLEAN DEFAULT false,

  

  created_at TIMESTAMPTZ DEFAULT NOW(),

  

  UNIQUE(user_id, gmail_message_id)

);

CREATE INDEX idx_emails_user_received ON emails(user_id, received_at DESC);

CREATE INDEX idx_emails_category ON emails(user_id, category) WHERE category IS NOT NULL;

CREATE INDEX idx_emails_unprocessed ON emails(user_id) WHERE processed = false;

-- ============================================================================

-- TABLE 7: tasks (User requests + Agent tasks)

-- ============================================================================

CREATE TABLE tasks (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Task definition

  title TEXT NOT NULL,

  description TEXT,

  task_type TEXT NOT NULL, -- 'user_request', 'automation', 'agent_task'

  

  -- Agent assignment

  assigned_agent TEXT, -- 'travel', 'scheduling', 'loyalty', null

  

  -- Status

  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'awaiting_human', 'completed', 'failed'

  priority INTEGER DEFAULT 5, -- 1-10

  

  -- Input/Output

  input_data JSONB DEFAULT '{}'::jsonb,

  output_data JSONB DEFAULT '{}'::jsonb,

  

  -- Human escalation

  requires_human BOOLEAN DEFAULT false,

  escalation_reason TEXT,

  

  -- Timing

  due_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  started_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ

);

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);

CREATE INDEX idx_tasks_agent ON tasks(assigned_agent, status) WHERE assigned_agent IS NOT NULL;

-- ============================================================================

-- TABLE 8: conversations (Chat messages)

-- ============================================================================

CREATE TABLE conversations (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Message

  role TEXT NOT NULL, -- 'user', 'assistant', 'system'

  content TEXT NOT NULL,

  

  -- Context

  related_task_id UUID REFERENCES tasks(id),

  

  -- Metadata

  metadata JSONB DEFAULT '{}'::jsonb,

  

  created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_conversations_user_created ON conversations(user_id, created_at DESC);

CREATE INDEX idx_conversations_task ON conversations(related_task_id) WHERE related_task_id IS NOT NULL;

-- ============================================================================

-- TABLE 9: notifications (User alerts)

-- ============================================================================

CREATE TABLE notifications (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Notification content

  title TEXT NOT NULL,

  message TEXT NOT NULL,

  notification_type TEXT DEFAULT 'info', -- 'info', 'alert', 'success', 'error'

  

  -- Action

  action_url TEXT,

  action_label TEXT,

  

  -- Related entities

  related_entity_id UUID REFERENCES entities(id),

  related_task_id UUID REFERENCES tasks(id),

  

  -- Status

  read_at TIMESTAMPTZ,

  

  created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- ============================================================================

-- TABLE 10: automations (Scheduled jobs and rules)

-- ============================================================================

CREATE TABLE automations (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  

  -- Automation definition

  name TEXT NOT NULL,

  automation_type TEXT NOT NULL, -- 'daily_brief', 'award_watch', 'trip_reminder'

  

  -- Config

  config JSONB DEFAULT '{}'::jsonb,

  -- Example for daily_brief:

  -- {

  --   "schedule": "0 6 * * *",

  --   "delivery_channels": ["push", "email"]

  -- }

  

  -- Status

  is_active BOOLEAN DEFAULT true,

  

  -- Execution tracking

  last_run_at TIMESTAMPTZ,

  next_run_at TIMESTAMPTZ,

  

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_automations_user_active ON automations(user_id, is_active) WHERE is_active = true;

CREATE INDEX idx_automations_next_run ON automations(next_run_at) WHERE is_active = true;

-- ============================================================================

-- Row Level Security (RLS)

-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)

CREATE POLICY "Users access own data" ON user_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users access own data" ON integrations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON entities FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON relationships FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON calendar_events FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON emails FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON notifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own data" ON automations FOR ALL USING (auth.uid() = user_id);

```

---

## 2. Minimal Services

### Service Architecture

```

Frontend (React/TypeScript via Bolt)

    ↓

API Gateway (Supabase Edge Functions)

    ↓

┌─────────────────────────────────────────────────┐

│  CORE SERVICES (All Supabase Edge Functions)   │

├─────────────────────────────────────────────────┤

│  1. gmail-sync                                  │

│  2. calendar-sync                               │

│  3. orchestrator (intent → agent routing)       │

│  4. travel-agent                                │

│  5. scheduling-agent (basic)                    │

│  6. loyalty-agent (stub)                        │

│  7. home-feed-generator                         │

│  8. daily-brief-automation                      │

└─────────────────────────────────────────────────┘

    ↓

External APIs (Google, Amadeus, Stripe)

```

### Service Specs

#### **Service 1: gmail-sync**

**File:** `supabase/functions/gmail-sync/index.ts`

**Responsibilities:**

- OAuth flow for Gmail

- Initial sync (last 30 days only - not 90)

- Webhook handler for new emails

- Basic email classification (travel vs other)

- Entity creation from travel confirmations

**Key Functions:**

```typescript

// 1. Initial sync

async function initialGmailSync(userId: string, accessToken: string)

// 2. Incremental sync (webhook)

async function processGmailWebhook(data: any)

// 3. Email classification

async function classifyEmail(email: GmailMessage): Promise<EmailCategory>

// 4. Extract travel data

async function extractTravelData(email: GmailMessage): Promise<TravelConfirmation | null>

```

**Endpoints:**

- `POST /gmail-sync/init` - Start initial sync

- `POST /gmail-sync/webhook` - Gmail push notification handler

---

#### **Service 2: calendar-sync**

**File:** `supabase/functions/calendar-sync/index.ts`

**Responsibilities:**

- OAuth flow for Google Calendar

- Bidirectional sync

- Event storage

- Link events to trips (basic)

**Key Functions:**

```typescript

// 1. Initial sync

async function initialCalendarSync(userId: string, accessToken: string)

// 2. Bidirectional sync

async function syncCalendarEvents(userId: string)

// 3. Create calendar event

async function createCalendarEvent(userId: string, eventData: CalendarEventInput)

// 4. Link event to trip

async function linkEventToTrip(eventId: string, tripId: string)

```

**Endpoints:**

- `POST /calendar-sync/init` - Start initial sync

- `POST /calendar-sync/webhook` - Calendar change webhook

- `POST /calendar-sync/create-event` - Create new event

---

#### **Service 3: orchestrator**

**File:** `supabase/functions/orchestrator/index.ts`

**Responsibilities:**

- Receive user messages

- Classify intent (GPT-4)

- Route to appropriate agent

- Manage task lifecycle

- Decide human escalation

**Key Functions:**

```typescript

// 1. Handle user message

async function handleUserMessage(userId: string, message: string)

// 2. Classify intent

async function classifyIntent(message: string, context: UserContext): Promise<Intent>

// 3. Route to agent

async function routeToAgent(intent: Intent, context: TaskContext): Promise<AgentResult>

// 4. Check escalation

async function shouldEscalate(result: AgentResult): Promise<boolean>

```

**Endpoints:**

- `POST /orchestrator/chat` - Main chat endpoint

---

#### **Service 4: travel-agent**

**File:** `supabase/functions/travel-agent/index.ts`

**Responsibilities:**

- Flight search (Amadeus)

- Hotel search (Amadeus)

- Booking creation (entity + relationships)

- Price tracking (basic)

**Key Functions:**

```typescript

// 1. Search flights

async function searchFlights(params: FlightSearchParams): Promise<FlightOption[]>

// 2. Search hotels

async function searchHotels(params: HotelSearchParams): Promise<HotelOption[]>

// 3. Create booking

async function createBooking(userId: string, booking: BookingData): Promise<Entity>

// 4. Rank options

async function rankOptions(options: any[], preferences: TravelPreferences): Promise<any[]>

```

**Endpoints:**

- `POST /travel-agent/search-flights`

- `POST /travel-agent/search-hotels`

- `POST /travel-agent/create-booking`

---

#### **Service 5: scheduling-agent (basic)**

**File:** `supabase/functions/scheduling-agent/index.ts`

**Responsibilities:**

- Find free time slots

- Check calendar conflicts

- Suggest meeting times

- (NO complex coordination yet)

**Key Functions:**

```typescript

// 1. Find free slots

async function findFreeSlots(userId: string, duration: number, dateRange: DateRange)

// 2. Check conflicts

async function checkConflicts(userId: string, proposedTime: Date)

```

**Endpoints:**

- `POST /scheduling-agent/find-slots`

- `POST /scheduling-agent/check-conflicts`

---

#### **Service 6: loyalty-agent (stub)**

**File:** `supabase/functions/loyalty-agent/index.ts`

**Responsibilities:**

- Store loyalty accounts (manual entry only for MVP)

- Calculate simple points value

- (NO API integrations, NO scraping, NO transfers)

**Key Functions:**

```typescript

// 1. Add loyalty account

async function addLoyaltyAccount(userId: string, account: LoyaltyAccountInput)

// 2. Calculate redemption value

async function calculateRedemptionValue(points: number, program: string): Promise<number>

```

**Endpoints:**

- `POST /loyalty-agent/add-account`

- `POST /loyalty-agent/calculate-value`

---

#### **Service 7: home-feed-generator**

**File:** `supabase/functions/home-feed/index.ts`

**Responsibilities:**

- Generate Today/Tomorrow sections

- Show upcoming trips (7 days)

- Show recent tasks

- Show unread notifications

**Key Functions:**

```typescript

async function generateHomeFeed(userId: string): Promise<HomeFeed>

```

**Endpoints:**

- `GET /home-feed` - Get home feed

**Response Structure:**

```typescript

interface HomeFeed {

  today: {

    summary: string;

    calendar_events: CalendarEvent[];

    tasks: Task[];

  };

  tomorrow: {

    summary: string;

    calendar_events: CalendarEvent[];

  };

  upcoming_trips: TripSummary[];

  recent_tasks: Task[];

  notifications: Notification[];

}

```

---

#### **Service 8: daily-brief-automation**

**File:** `supabase/functions/daily-brief/index.ts`

**Responsibilities:**

- Run at 6 AM daily (pg_cron)

- Aggregate today + tomorrow + trips

- Generate AI summary (GPT-4)

- Create notification

**Key Functions:**

```typescript

async function generateDailyBrief(userId: string): Promise<void>

```

**Endpoints:**

- `POST /daily-brief/generate` - Trigger brief (called by pg_cron)

---

## 3. Minimal UI Spec (for Bolt)

### Pages & Components

```

App Shell

├── Navigation

│   ├── Home

│   ├── Travel

│   ├── Tasks

│   └── Profile

│

├── HOME PAGE

│   ├── Header

│   │   └── "Ask Pier anything" search/chat bar

│   ├── Today Section

│   │   ├── AI Summary (1-2 sentences)

│   │   ├── Calendar Events List

│   │   └── Tasks Due Today

│   ├── Tomorrow Section

│   │   ├── AI Summary (1-2 sentences)

│   │   └── Calendar Events List

│   ├── Upcoming Trips (7 days)

│   │   └── Trip Cards

│   │       ├── Trip name

│   │       ├── Dates

│   │       ├── Destination

│   │       └── Bookings count

│   └── Notifications

│       └── Notification Cards

│

├── TRAVEL PAGE

│   ├── Search Section

│   │   └── Natural language: "Find flights from NYC to SF next Tuesday"

│   ├── Active Trips

│   │   └── Trip Cards (detailed)

│   │       ├── Flight details

│   │       ├── Hotel details

│   │       └── Edit/Cancel buttons

│   └── Past Trips

│

├── TASKS PAGE

│   ├── Active Tasks

│   │   └── Task Cards

│   │       ├── Title

│   │       ├── Status badge

│   │       ├── Agent assigned

│   │       └── Created date

│   └── Completed Tasks

│

└── PROFILE PAGE

    ├── Personal Info

    │   ├── Name, Email, Phone

    │   └── Time Zone

    ├── Travel Preferences

    │   ├── Preferred airlines

    │   ├── Seat preference

    │   ├── TSA PreCheck

    │   └── Known Traveler Number

    ├── Loyalty Accounts

    │   └── Add/Edit loyalty accounts

    ├── Connected Services

    │   ├── Gmail (connected/disconnected)

    │   ├── Google Calendar (connected/disconnected)

    │   └── Stripe (connected/disconnected)

    └── Automations

        └── Daily Brief toggle

```

### Key UI Components

#### **1. Chat Interface (Global)**

```typescript

// Appears on every page as a floating button or top bar

<ChatInterface>

  <MessageList messages={conversations} />

  <InputBar 

    onSend={(message) => sendToOrchestrator(message)}

    placeholder="Ask Pier anything..."

  />

  <TypingIndicator when={agentWorking} />

</ChatInterface>

```

#### **2. Home Feed**

```typescript

<HomeFeed>

  <TodaySection>

    <AISummary>{feed.today.summary}</AISummary>

    <EventsList events={feed.today.calendar_events} />

    <TasksList tasks={feed.today.tasks} />

  </TodaySection>

  

  <TomorrowSection>

    <AISummary>{feed.tomorrow.summary}</AISummary>

    <EventsList events={feed.tomorrow.calendar_events} />

  </TomorrowSection>

  

  <UpcomingTrips trips={feed.upcoming_trips} />

  

  <NotificationsList notifications={feed.notifications} />

</HomeFeed>

```

#### **3. Trip Card**

```typescript

<TripCard trip={trip}>

  <TripHeader>

    <TripName>{trip.data.name}</TripName>

    <TripDates>{formatDateRange(trip.data.dates)}</TripDates>

  </TripHeader>

  

  <BookingsList>

    {trip.bookings.map(booking => (

      <BookingItem booking={booking} />

    ))}

  </BookingsList>

  

  <TripActions>

    <Button>View Details</Button>

    <Button>Edit</Button>

  </TripActions>

</TripCard>

```

#### **4. Task Card**

```typescript

<TaskCard task={task}>

  <TaskTitle>{task.title}</TaskTitle>

  <TaskMeta>

    <StatusBadge status={task.status} />

    <AgentBadge agent={task.assigned_agent} />

    <TimeAgo date={task.created_at} />

  </TaskMeta>

  <TaskActions>

    <Button onClick={viewDetails}>View</Button>

    {task.requires_human && <Badge>Needs Review</Badge>}

  </TaskActions>

</TaskCard>

```

---

## 4. Implementation Checklist

### **MILESTONE 1: Foundation (Week 1)**

#### Backend Setup

- [ ] Create Supabase project

- [ ] Apply 10-table schema via Supabase dashboard or migration

- [ ] Enable RLS policies

- [ ] Set up environment variables:

  - [ ] `GOOGLE_CLIENT_ID`

  - [ ] `GOOGLE_CLIENT_SECRET`

  - [ ] `OPENAI_API_KEY`

  - [ ] `ANTHROPIC_API_KEY`

  - [ ] `AMADEUS_API_KEY`

  - [ ] `AMADEUS_API_SECRET`

  - [ ] `STRIPE_SECRET_KEY`

  - [ ] `MASTER_ENCRYPTION_KEY`

#### Core Services (Cursor)

- [ ] Create `supabase/functions` directory structure

- [ ] Implement encryption utilities (`lib/encryption.ts`)

- [ ] Implement Google OAuth flow

  - [ ] `/auth/google` redirect

  - [ ] `/auth/google/callback` handler

  - [ ] Token storage with encryption

  - [ ] Token refresh logic

#### Gmail Integration

- [ ] Implement `gmail-sync/init` endpoint

  - [ ] Initial 30-day sync

  - [ ] Store emails in `emails` table

  - [ ] Basic classification (GPT-4)

- [ ] Implement `gmail-sync/webhook` handler

  - [ ] Set up Gmail push notifications

  - [ ] Incremental sync

- [ ] Create email parsing function

  - [ ] Extract travel confirmations

  - [ ] Create entities from confirmations

  - [ ] Link to trips

#### Calendar Integration

- [ ] Implement `calendar-sync/init` endpoint

  - [ ] Initial sync

  - [ ] Store events in `calendar_events` table

- [ ] Implement `calendar-sync/webhook` handler

  - [ ] Real-time sync

- [ ] Implement `calendar-sync/create-event` endpoint

**Deliverable:** Users can connect Gmail + Calendar, see synced data in Supabase.

---

### **MILESTONE 2: UI Build (Week 2)**

#### Bolt UI Implementation

- [ ] Rebuild app shell with navigation

- [ ] Create **Home Page**

  - [ ] Global chat interface

  - [ ] Today section

  - [ ] Tomorrow section

  - [ ] Upcoming trips section

  - [ ] Notifications section

- [ ] Create **Travel Page**

  - [ ] Natural language search

  - [ ] Active trips list

  - [ ] Past trips list

  - [ ] Trip detail view

- [ ] Create **Tasks Page**

  - [ ] Active tasks list

  - [ ] Completed tasks list

  - [ ] Task detail view

- [ ] Create **Profile Page**

  - [ ] Personal info form

  - [ ] Travel preferences form

  - [ ] Loyalty accounts CRUD

  - [ ] Connected services status

  - [ ] Automations toggles

#### API Integration (Frontend)

- [ ] Set up Supabase client

- [ ] Implement auth flow

- [ ] Create API hooks:

  - [ ] `useHomeFeed()`

  - [ ] `useTrips()`

  - [ ] `useTasks()`

  - [ ] `useProfile()`

  - [ ] `useSendMessage()`

**Deliverable:** Functional UI that can display static/mocked data.

---

### **MILESTONE 3: Orchestration + Agents (Week 3-4)**

#### Orchestrator

- [ ] Implement `orchestrator/chat` endpoint

  - [ ] Receive user message

  - [ ] Store in `conversations` table

  - [ ] Classify intent with GPT-4

  - [ ] Create `task` record

  - [ ] Route to agent

  - [ ] Return response

#### Travel Agent

- [ ] Set up Amadeus API client

- [ ] Implement `travel-agent/search-flights`

  - [ ] Parse search parameters from natural language

  - [ ] Call Amadeus flight search

  - [ ] Rank results by user preferences

  - [ ] Return top 3 options

- [ ] Implement `travel-agent/search-hotels`

  - [ ] Similar to flights

- [ ] Implement `travel-agent/create-booking`

  - [ ] Create `entity` for booking (flight/hotel)

  - [ ] Create `entity` for trip (if new)

  - [ ] Create `relationship` linking booking to trip

  - [ ] Store in database

  - [ ] Return confirmation

#### Scheduling Agent (Basic)

- [ ] Implement `scheduling-agent/find-slots`

  - [ ] Query `calendar_events` for user

  - [ ] Find gaps in schedule

  - [ ] Return available slots

- [ ] Implement `scheduling-agent/check-conflicts`

  - [ ] Check if proposed time conflicts with existing events

#### Loyalty Agent (Stub)

- [ ] Implement `loyalty-agent/add-account`

  - [ ] Manual entry form

  - [ ] Create `entity` of type `loyalty_account`

  - [ ] Store account details in `data` JSONB

- [ ] Implement `loyalty-agent/calculate-value`

  - [ ] Simple cents-per-point calculation

  - [ ] Hardcoded values for common programs

#### Escalation Logic

- [ ] Implement confidence scoring

- [ ] Implement escalation rules:

  - [ ] Confidence < 0.7 → escalate

  - [ ] Financial value > $500 → escalate

  - [ ] User explicitly asks for human → escalate

- [ ] Create Front integration (basic)

  - [ ] Send task to Front inbox when escalated

  - [ ] Update task status to `awaiting_human`

**Deliverable:** End-to-end flow: User asks for flights → Agent searches → Returns options → Can book.

---

### **MILESTONE 4: Home Feed + Automation (Week 5-6)**

#### Home Feed Generation

- [ ] Implement `home-feed` endpoint

  - [ ] Query today's calendar events

  - [ ] Query tomorrow's calendar events

  - [ ] Query upcoming trips (next 7 days)

  - [ ] Query recent tasks

  - [ ] Query unread notifications

  - [ ] Generate AI summaries with GPT-4

  - [ ] Return structured JSON

#### Daily Brief Automation

- [ ] Set up pg_cron in Supabase

- [ ] Create cron job: `0 6 * * *` (6 AM daily)

- [ ] Implement `daily-brief/generate`

  - [ ] Call home feed generator

  - [ ] Format as notification

  - [ ] Create notification in `notifications` table

  - [ ] Send push notification (if configured)

  - [ ] Send email via Front (optional)

#### Notifications

- [ ] Implement notification creation

- [ ] Implement notification display in UI

- [ ] Implement mark as read

**Deliverable:** Daily brief arrives at 6 AM, home feed shows contextual summary.

---

### **MILESTONE 5: Polish + Testing (Week 7-8)**

#### Data Flow Testing

- [ ] Test Gmail sync end-to-end

  - [ ] Connect Gmail

  - [ ] Verify emails syncing

  - [ ] Verify travel confirmations parsed

  - [ ] Verify trips created

- [ ] Test Calendar sync end-to-end

  - [ ] Connect Calendar

  - [ ] Verify events syncing

  - [ ] Verify events linked to trips

  - [ ] Create event from Pier, verify in Google

- [ ] Test travel booking flow

  - [ ] Search flights

  - [ ] Select option

  - [ ] Create booking

  - [ ] Verify entity + relationships created

  - [ ] Verify appears in home feed

#### UI/UX Polish

- [ ] Loading states for all async operations

- [ ] Error handling and user-friendly messages

- [ ] Responsive design (mobile + desktop)

- [ ] Empty states

- [ ] Onboarding flow for new users

#### Security

- [ ] Test RLS policies

- [ ] Test encryption/decryption

- [ ] Secure API endpoints (require auth)

- [ ] Rate limiting (basic)

#### Documentation

- [ ] API endpoint documentation

- [ ] Schema documentation

- [ ] Deployment guide

- [ ] User guide (basic)

**Deliverable:** Production-ready MVP, deployed to staging environment.

---

## 5. Deferred to Phase 2

These features are **explicitly out of scope** for the 6-8 week MVP:

### Data Model

- ❌ Vector embeddings and semantic search

- ❌ Audit logs

- ❌ Event sourcing / temporal queries

- ❌ Analytics tables

### Integrations

- ❌ Stripe payment processing (just store payment methods)

- ❌ Loyalty program APIs

- ❌ Loyalty scraping

- ❌ Front inbox bidirectional sync (just one-way escalation)

- ❌ Additional email providers

- ❌ Additional calendar providers

### Agents

- ❌ Money agent (card optimization)

- ❌ Logistics agent (route planning)

- ❌ Documents agent (OCR, parsing)

- ❌ Household agent

### Features

- ❌ Complex loyalty optimization (transfers, award charts)

- ❌ Award seat monitoring

- ❌ Price drop alerts

- ❌ Multi-city trip planning

- ❌ Group travel coordination

- ❌ Advanced scheduling (meeting coordination with others)

- ❌ Packing lists

- ❌ Weather integration

- ❌ Ride sharing / transfers

### Infrastructure

- ❌ Advanced caching (Redis)

- ❌ Message queue (beyond basic pg_cron)

- ❌ Advanced monitoring/observability

- ❌ Multi-region deployment

---

## 6. Success Metrics for MVP

After 6-8 weeks, you should be able to:

1. **Connect** Gmail + Calendar via OAuth ✓

2. **See** past 30 days of emails synced and classified ✓

3. **See** calendar events synced bidirectionally ✓

4. **Ask** "Find flights from NYC to SF next Tuesday" in chat ✓

5. **Get** ranked flight options based on preferences ✓

6. **Book** a flight and see it appear as a trip ✓

7. **See** trip in home feed under "Upcoming Trips" ✓

8. **Receive** daily brief at 6 AM with today/tomorrow summary ✓

9. **View** all tasks and their status ✓

10. **Escalate** to human when agent is uncertain ✓

---

## 7. Bolt Prompt for UI Rebuild

```markdown

# Pier OS v2 - UI Rebuild

Build a modern, AI-powered personal operating system interface with 4 main pages.

## Design Requirements

**Theme:** 

- Modern, clean, professional

- NOT the typical AI purple gradient aesthetic

- Consider: Deep navy + electric blue accent OR charcoal + emerald OR warm dark mode

- Use a distinctive font (NOT Inter, NOT Roboto - try: Space Grotesk, Plus Jakarta Sans, Manrope, or Outfit)

- Subtle animations and micro-interactions

- Glass morphism or subtle gradients for depth

**Layout:**

- Sidebar navigation (Home, Travel, Tasks, Profile)

- Global chat interface (floating button that expands, or persistent top bar)

- Responsive (desktop-first, but mobile-friendly)

## Pages

### 1. Home Page

- **Header:** Large "Ask Pier anything" search/chat bar (prominent, inviting)

- **Today Section:**

  - AI-generated 1-2 sentence summary

  - List of calendar events (time, title, location)

  - Tasks due today

- **Tomorrow Section:**

  - AI-generated summary

  - List of calendar events

- **Upcoming Trips (7 days):**

  - Trip cards showing: name, dates, destination, booking count

  - Click to view details

- **Notifications:**

  - Unread notifications with type badges

### 2. Travel Page

- **Search Bar:** Natural language input ("Find flights from NYC to SF next Tuesday")

- **Active Trips:**

  - Detailed trip cards with flight/hotel info

  - Edit and cancel buttons

- **Past Trips:**

  - Archived trip cards

### 3. Tasks Page

- **Active Tasks:**

  - Task cards showing: title, status badge, agent assigned, created date

  - "Needs Review" badge for human escalation

- **Completed Tasks:**

  - Collapsed section

### 4. Profile Page

- **Personal Info:** Name, email, phone, timezone (editable)

- **Travel Preferences:** Airlines, seat preference, TSA PreCheck, KTN

- **Loyalty Accounts:** Add/edit accounts with program name and number

- **Connected Services:** Gmail, Calendar, Stripe (connected/disconnected status)

- **Automations:** Daily Brief toggle

## Components Needed

1. ChatInterface (floating or top bar with message list + input)

2. TripCard (compact and detailed variants)

3. TaskCard (with status badges)

4. CalendarEventCard

5. NotificationCard

6. StatusBadge (for task status, agent type)

7. ConnectionStatus (for integrations)

## State Management

- Use React hooks (useState, useEffect)

- Simulate API calls for now (mock data)

- Later we'll connect to Supabase

Build this with React + TypeScript + Tailwind CSS. Make it feel premium and intelligent, not generic AI.

```

---

## Summary

This minimal Pier OS v2 is designed to be **actually shippable in 6-8 weeks** by a small team using:

- **Bolt** for fast UI iteration

- **Cursor** for backend implementation

- **Claude** for agent logic and complex workflows

The 10-table schema is **sufficient** to prove the core value proposition: intelligent travel assistance with calendar awareness and basic loyalty optimization.

