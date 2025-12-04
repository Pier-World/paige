# Orchestrator Service - Setup & Usage

## ✅ What's Been Built

The MVP orchestrator service is complete and ready to use! It:

1. **Receives user messages** via `POST /orchestrator/chat`
2. **Classifies intent** using GPT-4 (travel, scheduling, loyalty, other)
3. **Routes to agents** based on intent type
4. **Handles escalation** when confidence is low or human review is needed
5. **Stores everything** in `tasks` and `conversations` tables

## 🚀 Running Migrations First

Before using the orchestrator, you need to run the database migrations:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql`
4. Paste and run the query
5. (Optional) If you have `user_preferences` table, also run `20251201_align_user_preferences_with_profiles.sql`

### Option 2: Supabase CLI

```bash
cd /Users/spencerchandlee/paige
supabase db push
```

### Option 3: Direct SQL

```bash
psql <your-connection-string> -f supabase/migrations/20251201_verify_and_enhance_profiles_schema.sql
```

## 📋 Environment Variables

Make sure these are set in your Supabase Edge Functions environment:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `OPENAI_API_KEY` - OpenAI API key for GPT-4

To set them:
1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add environment variables

## 🧪 Testing the Orchestrator

### Test Request

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "message": "Find flights from NYC to SF next Tuesday"
  }'
```

### Expected Response

```json
{
  "success": true,
  "taskId": "task-uuid",
  "conversationId": "conversation-id",
  "intent": "travel",
  "confidence": 0.95,
  "message": "I found some travel options for you.",
  "requiresHuman": false,
  "agentResult": {
    "success": true,
    "data": { ... },
    "confidence": 0.95,
    "message": "..."
  }
}
```

## 🔄 How It Works

### Flow Diagram

```
User Message
    ↓
Orchestrator receives message
    ↓
Get user context (profile, preferences, recent tasks)
    ↓
Classify intent with GPT-4
    ↓
Create task in database
    ↓
Route to agent:
  - travel → travel-agent
  - scheduling → scheduling-agent
  - loyalty → loyalty-agent
  - other → general response
    ↓
Check escalation (confidence < 0.7?)
    ↓
Store response in conversations
    ↓
Create notification if escalated
    ↓
Return result to user
```

## 📊 Database Tables Used

The orchestrator uses these tables:

- **`profiles`** - User profile, travel preferences, personal context
- **`tasks`** - Task tracking and status
- **`conversations`** - Message history
- **`notifications`** - User notifications (for escalations)
- **`entities`** - For upcoming trips context

## 🎯 Intent Types

The orchestrator classifies messages into:

1. **travel** - Flight searches, hotel bookings, trip planning
2. **scheduling** - Calendar management, meeting scheduling
3. **loyalty** - Loyalty account management, points queries
4. **other** - General questions or unclear requests

## ⚠️ Escalation Logic

A request is escalated to human review if:

- Intent confidence < 0.7
- Agent confidence < 0.7
- Agent result requires human
- Estimated transaction value > $500
- User explicitly asks for human
- Complex multi-step request

When escalated:
- Task status → `awaiting_human`
- Notification created
- User notified

## 🔗 Agent Services

The orchestrator routes to these services (which need to be created):

- `/travel-agent/search-flights` - Travel agent
- `/scheduling-agent/find-slots` - Scheduling agent
- `/loyalty-agent/calculate-value` - Loyalty agent

**Note:** These agent services need to be created next. The orchestrator will handle errors gracefully if they don't exist yet.

## 🐛 Error Handling

- If OpenAI API is unavailable → Falls back to keyword-based classification
- If agent services fail → Escalates to human
- All errors are logged and returned with appropriate status codes

## 📝 Next Steps

1. ✅ Run database migrations
2. ✅ Set environment variables
3. ✅ Test orchestrator endpoint
4. ⏭️ Create travel-agent service
5. ⏭️ Create scheduling-agent service
6. ⏭️ Create loyalty-agent service
7. ⏭️ Connect frontend to orchestrator

## 📚 Related Files

- `supabase/functions/orchestrator/index.ts` - Main orchestrator code
- `supabase/functions/orchestrator/README.md` - Detailed documentation
- `docs/IMPLEMENTATION_PLAN.md` - Full implementation plan
- `docs/DATABASE_SCHEMA_VERIFICATION.md` - Schema documentation

