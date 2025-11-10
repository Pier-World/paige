# Fixing "message_sent: false" in Orchestrator

## Problem

The orchestrator successfully finds flight results but fails to send them back to Front, resulting in:

```json
"message_sent": false
```

## Root Cause

The orchestrator is likely trying to send a message using the **wrong conversation ID** or **missing/incorrect Front API credentials**.

## Solution

### Step 1: Verify Front Webhook Payload

When Front sends a webhook to your `front-inbound` function, the payload looks like this:

```json
{
  "type": "inbound",
  "payload": {
    "conversation": {
      "id": "cnv_12345abc"  // <- THIS is the Front conversation ID you need
    },
    "message": {
      "id": "msg_67890def",
      "body": "I'd like to book a flight from NYC to LA",
      "author": {
        "email": "user@example.com"
      }
    }
  }
}
```

### Step 2: Pass Front Conversation ID to Orchestrator

Your `front-inbound` function should extract and pass the Front conversation ID:

```typescript
// In front-inbound/index.ts
const frontConversationId = payload.conversation.id; // cnv_xxxxx

// Pass this to orchestrator
const result = await searchFlights({
  query: messageBody,
  userId: userId,
  conversationId: conversationId,        // Supabase conversation (for internal tracking)
  frontConversationId: frontConversationId,  // <- ADD THIS
});
```

### Step 3: Update Orchestrator to Use Front Conversation ID

In your `ai-orchestrator` function, when sending the reply message:

```typescript
// WRONG - Don't use Supabase conversation ID
const frontResponse = await fetch(`${FRONT_API_URL}/conversations/${supabaseConversationId}/messages`, {
  // This will fail because Front doesn't know about Supabase IDs
});

// CORRECT - Use Front's conversation ID
const frontResponse = await fetch(`${FRONT_API_URL}/conversations/${frontConversationId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FRONT_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    author_id: 'alt:address:paige@pierconcierge.com', // Your bot's Front identity
    body: responseMessage,
    type: 'custom',
  }),
});
```

### Step 4: Verify Environment Variables

In your orchestrator project's edge function environment:

```bash
# Required for Front API
FRONT_API_TOKEN=your_front_api_token_here

# Front API base URL
FRONT_API_URL=https://api2.frontapp.com
```

To get your Front API token:
1. Go to Front → Settings → API & integrations
2. Create a new API token
3. Give it permissions: `Conversations: Write`, `Messages: Write`
4. Copy the token

### Step 5: Test Front API Call Directly

Test your Front API credentials with curl:

```bash
curl -X POST "https://api2.frontapp.com/conversations/cnv_REPLACE_WITH_REAL_ID/messages" \
  -H "Authorization: Bearer YOUR_FRONT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author_id": "alt:address:paige@pierconcierge.com",
    "body": "Test message from orchestrator",
    "type": "custom"
  }'
```

If this works, your credentials are correct.

### Step 6: Update Search Functions

Update your `search-flights`, `search-hotels`, etc. functions to:

1. Accept `frontConversationId` parameter
2. Pass it through to the response
3. Use it when posting to Front

Example:

```typescript
// In search-flights/index.ts
export async function searchFlights({
  query,
  userId,
  conversationId,
  frontConversationId,  // <- ADD THIS
  requestId,
}: {
  query: string;
  userId: string;
  conversationId: string;
  frontConversationId: string;  // <- ADD THIS
  requestId?: string;
}) {
  // ... search logic ...

  // When posting to Front, use frontConversationId
  const sent = await sendMessageToFront({
    conversationId: frontConversationId,  // <- Use Front's ID
    message: responseMessage,
  });

  return {
    success: true,
    message: responseMessage,
    message_sent: sent,
    conversation_id: conversationId,      // Supabase ID for internal tracking
    front_conversation_id: frontConversationId,  // Front ID for API calls
    // ...
  };
}
```

## Debugging Checklist

- [ ] Front webhook is delivering `conversation.id` correctly
- [ ] `front-inbound` extracts `conversation.id` from webhook payload
- [ ] `front-inbound` passes Front conversation ID to orchestrator
- [ ] Orchestrator receives `frontConversationId` parameter
- [ ] `FRONT_API_TOKEN` environment variable is set in edge function
- [ ] Orchestrator uses `frontConversationId` (not Supabase ID) in Front API calls
- [ ] Front API token has correct permissions
- [ ] API endpoint is correct: `https://api2.frontapp.com`
- [ ] Error handling logs Front API response errors

## Common Mistakes

### Mistake 1: Using Supabase Conversation ID with Front API
```typescript
// WRONG
fetch(`https://api2.frontapp.com/conversations/${supabaseConversationId}/messages`)
// Front has no idea what this UUID is
```

### Mistake 2: Not Passing Front Conversation ID from Webhook
```typescript
// front-inbound receives webhook but doesn't extract conversation.id
// orchestrator never gets the Front conversation ID it needs
```

### Mistake 3: Missing Authorization Header
```typescript
// WRONG
fetch(url, {
  headers: {
    'Content-Type': 'application/json',
  }
})

// CORRECT
fetch(url, {
  headers: {
    'Authorization': `Bearer ${FRONT_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
})
```

### Mistake 4: Wrong Author ID
```typescript
// WRONG - Using email that's not registered in Front
"author_id": "paige@example.com"

// CORRECT - Use the exact email or ID from Front
"author_id": "alt:address:paige@pierconcierge.com"
```

## Testing the Fix

1. Open Front widget in portal
2. Send test message: "Find me a flight from JFK to LAX"
3. Check orchestrator logs for:
   - ✅ `frontConversationId` is present and starts with `cnv_`
   - ✅ Front API call returns 202 or 200 status
   - ✅ `message_sent: true` in response
4. Check Front inbox - response should appear immediately
5. Check widget - user should see the response

## Expected Logs (Success)

```
✅ Received inbound message from Front
   - Front conversation ID: cnv_12345abc
   - Message: "Find me a flight from JFK to LAX"

✅ Calling orchestrator with frontConversationId

✅ Search completed successfully
   - Found 5 flight options
   - Generated response message

✅ Posting to Front API
   - URL: https://api2.frontapp.com/conversations/cnv_12345abc/messages
   - Status: 202 Accepted

✅ message_sent: true
```

## Front API Documentation

- [Front API - Send Message](https://dev.frontapp.com/reference/post_conversations-conversation-id-messages)
- [Front API - Authentication](https://dev.frontapp.com/docs/authentication)
- [Message Types](https://dev.frontapp.com/reference/messages)
