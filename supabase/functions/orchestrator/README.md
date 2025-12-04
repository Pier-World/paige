# Orchestrator Service

The orchestrator is the central service that receives user messages, classifies intent, and routes to appropriate agents.

## Endpoint

`POST /orchestrator/chat`

## Request Body

```json
{
  "userId": "user-uuid",
  "message": "Find flights from NYC to SF next Tuesday",
  "conversationId": "optional-conversation-id"
}
```

## Response

```json
{
  "success": true,
  "taskId": "task-uuid",
  "conversationId": "conversation-message-id",
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

## How It Works

1. **Receive Message**: User sends a message via the chat interface
2. **Get Context**: Retrieves user profile, recent tasks, conversations, and upcoming trips
3. **Classify Intent**: Uses GPT-4 to classify intent (travel, scheduling, loyalty, other)
4. **Create Task**: Creates a task record in the `tasks` table
5. **Route to Agent**: Routes to appropriate agent service:
   - `travel` → `travel-agent`
   - `scheduling` → `scheduling-agent`
   - `loyalty` → `loyalty-agent`
   - `other` → General response
6. **Check Escalation**: Determines if human review is needed
7. **Store Response**: Saves assistant response to `conversations` table
8. **Create Notification**: Creates notification if escalated

## Intent Classification

The orchestrator uses GPT-4 to classify user intents with the following types:

- **travel**: Flight searches, hotel bookings, trip planning
- **scheduling**: Calendar management, meeting scheduling
- **loyalty**: Loyalty account management, points queries
- **other**: General questions or unclear requests

## Escalation Logic

A request is escalated to human review if:

- Intent confidence < 0.7
- Agent confidence < 0.7
- Agent result requires human
- Estimated transaction value > $500
- User explicitly asks for human
- Complex multi-step request

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `OPENAI_API_KEY` - OpenAI API key for GPT-4 intent classification

## Database Tables Used

- `profiles` - User profile and preferences
- `tasks` - Task tracking
- `conversations` - Message history
- `notifications` - User notifications
- `entities` - For upcoming trips context

## Agent Services

The orchestrator routes to these agent services:

- `/travel-agent/search-flights` - Travel agent
- `/scheduling-agent/find-slots` - Scheduling agent
- `/loyalty-agent/calculate-value` - Loyalty agent

## Error Handling

- If OpenAI API is unavailable, falls back to keyword-based classification
- If agent services fail, escalates to human
- All errors are logged and returned with appropriate status codes

