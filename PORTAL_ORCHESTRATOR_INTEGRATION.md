# Portal Orchestrator Integration - Complete Rewrite

## Critical Architecture Change

**The portal now works EXACTLY like WhatsApp and Email** - all message processing goes through the orchestrator. The broken local parsing has been completely removed.

---

## What Changed

### Before (Broken)
```
User Message → Local Parser → Generate Response → Maybe Call Orchestrator
                ↓ (buggy)
          Ask same questions
          Wrong dates
          Doesn't understand context
```

### After (Fixed)
```
User Message → Database → Orchestrator → AI Response → Database → UI
                                ↓
                         (Same logic as WhatsApp/Email)
```

---

## Files Modified

### 1. `/src/components/layout/Navbar.tsx`
- Changed "Travel" to **"Concierge"** in navigation

### 2. `/src/pages/TravelPage.tsx`
- Changed header from "Travel Concierge" to **"Make a Request"**
- **REMOVED 90+ lines of broken local parsing logic**
- **NEW**: Direct orchestrator integration via `message_id`
- Messages now flow: Portal → Database → Orchestrator → Database → Portal (via real-time subscription)

---

## How It Works Now

### Step-by-Step Flow

1. **User Sends Message**
   ```typescript
   // User types: "flight from NYC to LA December 18th business class"
   await createMessage(conversationId, 'in', 'user', userInput, requestId);
   // Creates message record in database
   ```

2. **Call Orchestrator**
   ```typescript
   await supabase.functions.invoke('orchestrate-request', {
     body: {
       message_id: messageRecord.id,
       source: 'portal'
     }
   });
   ```

3. **Orchestrator Processes** (your existing edge function)
   - Reads message from database
   - Uses Claude to understand intent
   - Asks clarifying questions if needed
   - Searches APIs when ready
   - Writes AI response to database

4. **Real-Time Subscription Updates UI**
   ```typescript
   subscribeToNewMessages(conversationId, (newMsg) => {
     setIsTyping(false);
     setMessages(prev => [...prev, newMsg]);
   });
   ```

---

## What This Fixes

### ✅ No More Repeated Questions
The orchestrator maintains conversation context. It won't ask for departure city if you already said "NYC".

### ✅ Correct Date Parsing
The orchestrator uses Claude for date understanding, not regex.

### ✅ Smart Clarification
Only asks for truly missing information, not information you already provided.

### ✅ Consistent Behavior
Portal, WhatsApp, and Email all use the same AI logic.

---

## Front Sync Status

### Current Situation
The `syncConversationToFront()` call is still happening, but Front conversations aren't appearing.

### Root Cause
The `front-inbound` edge function (in your other Bolt project) needs:
1. Correct Front API credentials in environment variables
2. Proper error handling
3. Correct mapping of portal conversations to Front inbox

### Debugging
Check browser console for:
```
"Successfully synced to Front: cnv_abc123"  ✅ Working
"Front sync returned null"  ❌ front-inbound failed
Error logs  ❌ API issue
```

### To Fix Front Sync
You'll need to update the `front-inbound` edge function in your other project. The portal is calling it correctly, but that function isn't creating Front conversations.

---

## Testing the New Flow

### Test 1: Initial Request
**Input:** "I'd like to fly one way from NYC to LA December 10th, business class please"

**Expected:**
- Message appears in UI immediately
- Typing indicator shows
- ~2-3 seconds later: AI response appears
- AI should NOT ask for information you already provided
- If all info is complete: AI should say "I'm searching for options..."

### Test 2: Follow-Up
**Initial:** "flight to Austin business class"
**AI:** "When would you like to travel?"
**You:** "December 15th"

**Expected:**
- AI updates the request with new date
- Doesn't ask for date again
- Proceeds to search if all info is now complete

### Test 3: Human Handoff
1. Make a request
2. Wait for AI response
3. Click "Talk to Human Agent"

**Expected:**
- System message appears: "Connecting you..."
- Request status changes to `awaiting_approval`
- Request mode changes to `'human'`
- `front-approval` edge function is called

---

## Environment Requirements

### Required Edge Functions (in your other Bolt project)

1. **`orchestrate-request`** ✅ (working for WhatsApp/Email)
   - Receives: `message_id` and `source`
   - Processes: AI conversation logic
   - Writes: AI responses to database

2. **`front-inbound`** ⚠️ (needs fixing)
   - Receives: `conversation_id`, `profile_id`, `initial_message`
   - Creates: Front conversation in inbox
   - Returns: Front conversation ID

3. **`front-approval`** ⚠️ (unknown status)
   - Receives: `request_id`, `escalate: true`
   - Assigns: Human agent in Front
   - Notifies: Agent of new request

### Database Requirements ✅ (all exist)
- `conversations` table with `front_conversation_id`
- `messages` table with real-time triggers
- `requests` table with status and mode fields
- RLS policies allow authenticated users to access their data

---

## Console Debugging

When you send a message, you'll see:

```javascript
Message sent, calling orchestrator: {
  message_id: "abc-123",
  conversation_id: "xyz-789",
  text: "your message here"
}

// Then either:
Orchestrator success: { success: true, ... }
// OR
Orchestrator error: { error: "..." }
```

If you see errors, check:
1. `orchestrate-request` edge function logs
2. Claude API rate limits
3. Database permissions

---

## What You Need To Do

### Immediate Actions

1. **Hard Refresh Browser**
   - `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Verify new bundle loads: `TravelPage-whqCmvVT.js`

2. **Test Portal Flow**
   - Go to Concierge page (renamed from Travel)
   - Send: "flight from NYC to LA December 10th business class"
   - Verify AI responds intelligently without repeating questions

3. **Check Console Logs**
   - Open DevTools → Console
   - Look for orchestrator success/error messages
   - Report any errors you see

### Fix Front Sync (Separate Task)

In your other Bolt project with the edge functions:

1. **Check `front-inbound` function**
   - Verify Front API token is set
   - Check error logs when portal calls it
   - Test function directly with sample payload

2. **Check `front-approval` function**
   - Verify it assigns agents correctly
   - Check it's triggered when user clicks "Talk to Human Agent"

---

## Success Criteria

### Portal Works When:
- ✅ User can have natural conversation
- ✅ AI doesn't repeat questions
- ✅ AI understands context from previous messages
- ✅ Searches APIs when request is complete
- ✅ Results appear in UI
- ✅ Human handoff button works

### Front Integration Works When:
- ✅ Portal conversations appear in Front inbox
- ✅ Agents can see full message history
- ✅ Agents can reply from Front
- ✅ Agent replies appear in portal UI

---

## Architecture Benefits

### Why This Approach is Better

1. **Single Source of Truth**
   - One AI model (Claude in orchestrator)
   - One set of conversation rules
   - Consistent behavior across all channels

2. **Easier to Maintain**
   - Fix a bug once in orchestrator = fixed everywhere
   - No need to sync logic between portal and other channels

3. **Better AI Understanding**
   - Claude handles all language understanding
   - No brittle regex patterns
   - Natural multi-turn conversations

4. **Real-Time Updates**
   - AI responses appear instantly via subscriptions
   - No polling or manual refreshes needed

5. **Scalable**
   - Add new channels (SMS, Slack, etc.) easily
   - All use same orchestrator logic
   - Portal is just another client

---

## Next Steps

1. Test the portal thoroughly
2. Fix Front sync in the other project
3. Deploy and monitor production usage
4. Iterate on AI prompts in orchestrator for better responses

---

**The portal is now a true concierge interface that works exactly like your other channels. No more fighting with broken local parsing!**
