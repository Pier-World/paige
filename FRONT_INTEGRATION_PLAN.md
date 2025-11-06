# Front Integration Architecture

## Current State

### What We Have
1. **Front Chat Widget** - Embedded in `index.html` (chatId: `6f31fd010a7e9e777dc99ca3f15ff972`)
2. **Travel Concierge Portal** - Custom React app at `/travel` with Paige AI assistant
3. **Database Schema** - Already has `front_conversation_id` fields in:
   - `conversations` table
   - `requests` table
   - `messages` table with `front_message_id`

### Data Flow Today
```
User → Travel Portal → Supabase → Messages/Requests
                              ↓
                         (No Front sync)
```

## Integration Goal

Create a unified experience where:
1. User starts conversation in Travel Portal with Paige AI
2. When human agent is needed, conversation syncs to Front
3. Agent in Front can see full context and continue conversation
4. Messages from Front appear in Travel Portal in real-time
5. User sees seamless handoff from AI → Human

---

## Architecture Overview

```
┌─────────────────┐
│  Travel Portal  │
│   (Paige AI)    │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌──────────────┐  ┌──────────────┐
│   Supabase   │  │    Front     │
│   Messages   │◄─┤   Webhook    │
│ Conversations│  │   Handler    │
└──────────────┘  └──────────────┘
         │             ▲
         │             │
         └─────────────┘
      Front API calls
```

---

## Implementation Plan

### Phase 1: Webhook Receiver (Edge Function)

**Purpose**: Receive incoming messages from Front and store them in Supabase

**Edge Function**: `front-webhook`

```typescript
// supabase/functions/front-webhook/index.ts

Interface:
- POST /front-webhook
- Verify Front webhook signature
- Handle conversation events:
  * conversation_created
  * message_received (inbound from agent)
  * conversation_assigned
  * conversation_archived

Actions:
- Find or create conversation in Supabase using front_conversation_id
- Store incoming messages in messages table
- Update request status when agent takes over
- Trigger realtime notifications to portal
```

### Phase 2: Sync Portal Messages to Front

**Edge Function**: `sync-to-front`

```typescript
// supabase/functions/sync-to-front/index.ts

Trigger: When user sends message in portal
- Check if conversation has front_conversation_id
- If no: Check if human_requested=true
  * Create Front conversation via API
  * Store front_conversation_id
  * Send initial context message
- If yes: Send message to existing Front conversation
- Store front_message_id from response
```

**Front API Endpoints Needed**:
- `POST /conversations` - Create new conversation
- `POST /conversations/{id}/messages` - Send message
- `POST /conversations/{id}/comments` - Add internal notes

### Phase 3: Human Handoff Flow

**Add to Travel Portal UI**:

```typescript
// New component: HumanHandoffButton.tsx
- Shows "Talk to Human Agent" button
- On click:
  * Sets request.mode = 'human'
  * Calls sync-to-front function
  * Shows status: "Connecting you to an agent..."
  * Updates UI when agent joins
```

**Portal Message Flow**:
```
AI Message (Blue bubble, Paige icon)
  ↓
User clicks "Talk to Human Agent"
  ↓
System Message: "Connecting you to Sarah, our travel specialist..."
  ↓
Agent Message (Different color, Agent photo, "Sarah" name)
```

### Phase 4: Bi-directional Sync

**Realtime Subscriptions**:

```typescript
// In TravelPage.tsx
useEffect(() => {
  // Subscribe to new messages from Front
  const subscription = supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      // New message from agent via Front
      if (payload.new.sent_by === 'agent') {
        setMessages(prev => [...prev, {
          id: payload.new.id,
          content: payload.new.body,
          sender: 'agent',
          timestamp: payload.new.created_at,
          agentName: payload.new.raw?.agent_name,
          agentPhoto: payload.new.raw?.agent_photo
        }]);
      }
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [conversationId]);
```

---

## Database Schema Updates Needed

```sql
-- Add human handoff tracking
ALTER TABLE requests ADD COLUMN IF NOT EXISTS human_requested boolean DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS agent_assigned_at timestamptz;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS agent_name text;

-- Add Front metadata to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS agent_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS agent_photo_url text;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_messages_front_message_id ON messages(front_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_front_id ON conversations(front_conversation_id);
```

---

## Environment Variables

```env
# Front API
FRONT_API_TOKEN=your_front_api_token
FRONT_CHANNEL_ID=your_channel_id
FRONT_WEBHOOK_SECRET=your_webhook_secret
FRONT_INBOX_ID=your_inbox_id
```

---

## Front Webhook Configuration

**Setup in Front Dashboard**:

1. Go to Settings → Developers → Webhooks
2. Create new webhook
3. URL: `https://[your-project].supabase.co/functions/v1/front-webhook`
4. Events to subscribe:
   - `message.received` (inbound messages from agents)
   - `conversation.created`
   - `conversation.assigned`
   - `conversation.archived`
5. Save webhook secret to env vars

---

## User Experience Flow

### Scenario 1: AI Only
```
1. User: "I need a flight to Paris"
2. Paige: "Perfect! I'm searching for flights to Paris..."
3. Paige: Shows results
4. User selects and books
✓ No Front involvement
```

### Scenario 2: AI → Human
```
1. User: "I need a flight to Paris"
2. Paige: "Perfect! I'm searching..."
3. User: "Actually, I need help planning a complex itinerary"
4. [Paige detects complexity OR user clicks "Talk to Human"]
5. System: "Let me connect you with Sarah, our travel specialist"
   → Creates Front conversation
   → Sends full context to Front
   → Assigns to agent
6. Sarah (in Front): Sees full chat history + request details
7. Sarah: "Hi! I can definitely help with that itinerary"
   → Message goes to Front
   → Webhook sends to Supabase
   → Portal shows in real-time
8. User sees message in portal immediately
✓ Seamless handoff
```

### Scenario 3: Agent Proactive Reach-out
```
1. Agent in Front sees request needs attention
2. Agent sends message in Front
3. Webhook → Supabase → Portal notification
4. User opens portal, sees agent message
5. Conversation continues
```

---

## Technical Implementation Steps

### Step 1: Create Edge Functions
- [ ] Create `front-webhook` function
- [ ] Create `sync-to-front` function
- [ ] Add error handling and logging
- [ ] Add retry logic for failed syncs

### Step 2: Update Database
- [ ] Run migration to add new columns
- [ ] Add RLS policies for agent data
- [ ] Create indexes

### Step 3: Update Portal UI
- [ ] Add "Talk to Human" button
- [ ] Add agent message styling (different from AI)
- [ ] Add typing indicators for agents
- [ ] Add "Agent is typing..." status
- [ ] Add agent profile photos

### Step 4: Configure Front
- [ ] Set up webhook in Front dashboard
- [ ] Create API token with proper permissions
- [ ] Configure target inbox
- [ ] Test webhook delivery

### Step 5: Testing
- [ ] Test AI-only flow (no Front)
- [ ] Test human handoff flow
- [ ] Test agent-initiated contact
- [ ] Test message sync both directions
- [ ] Test with multiple simultaneous conversations
- [ ] Test error handling (Front API down, etc.)

### Step 6: Monitoring
- [ ] Add logging to edge functions
- [ ] Monitor webhook failures
- [ ] Track handoff rates
- [ ] Measure response times

---

## Benefits of This Approach

1. **Unified Inbox**: Agents see all conversations in Front
2. **Full Context**: Agents see AI chat history + structured request data
3. **Real-time**: Messages sync instantly both ways
4. **Seamless UX**: Users don't know they're switching channels
5. **Scalable**: AI handles simple requests, humans handle complex
6. **Trackable**: All conversations stored in Supabase + Front

---

## Alternative: Replace Portal Chat with Front Widget

**Simpler approach**:
- Remove custom Travel Portal chat
- Use Front widget directly on /travel page
- Customize Front widget to match your design
- Lose AI automation and smart chips

**Why current approach is better**:
- Keep AI automation
- Keep smart chips and structured data
- Keep custom UX
- Front becomes augmentation, not replacement

---

## Next Steps

1. **Decision**: Approve architecture
2. **Setup**: Configure Front webhooks and API
3. **Build**: Create edge functions
4. **Test**: Validate bi-directional sync
5. **Deploy**: Roll out to production
6. **Monitor**: Watch for issues

---

## Questions to Discuss

1. **When to handoff to human?**
   - User clicks button?
   - AI detects it can't help?
   - Request sits too long?
   - All of the above?

2. **Front inbox structure**:
   - One inbox for all travel?
   - Separate by request type?
   - Route by membership level?

3. **Agent assignment**:
   - Auto-assign to available agent?
   - Assign to specialist by request type?
   - Round-robin?

4. **Offline behavior**:
   - What if no agents available?
   - Queue messages?
   - Fallback to AI?

5. **Historical conversations**:
   - Sync past conversations to Front?
   - Start fresh?
   - Import selectively?
