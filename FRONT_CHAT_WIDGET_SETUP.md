# Front Chat Widget Integration - Setup Guide

## Overview

The Pier portal now uses the **Front Chat widget** as the single source of truth for all travel concierge messaging. This replaces the custom chat implementation and eliminates the complex conversation sync logic.

## Architecture

### Before (Custom Portal Chat)
```
User → Portal UI → Supabase → ai-orchestrator → Front (sync)
```
- Multiple conversation creation points
- Complex realtime subscriptions
- Orchestrator timeouts
- Duplicate message risks
- Front sync issues

### After (Front Widget)
```
User → Front Widget → Front Inbox → front-inbound webhook → ai-orchestrator → Front → Widget
```
- Single source of truth (Front)
- Native chat experience
- No custom message handling
- No timeouts or duplicates
- Automatic sync

## Setup Instructions

### 1. Get Your Front Chat ID

1. Log into your Front account
2. Go to **Settings → Channels → Chat**
3. Create a new Chat channel (or use existing)
4. Copy your **Chat ID** (format: `cha_xxxxx`)

### 2. Configure Environment Variable

Update your `.env` file:

```bash
VITE_FRONT_CHAT_ID=cha_xxxxx  # Replace with your actual Chat ID
```

### 3. (Optional) Enable Identity Verification

For added security, you can verify user identities using HMAC:

1. In Front, go to **Settings → Chat → Security**
2. Enable **Identity Verification**
3. Copy your **Secret Key**
4. Create an edge function or backend endpoint that generates the hash:

```typescript
import crypto from 'crypto';

export function generateFrontUserHash(email: string, secretKey: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(email)
    .digest('hex');
}
```

5. Store the hash in the `profiles.front_user_hash` column
6. The widget will automatically use it when initializing

## How It Works

### Portal Side

1. **Page Load** (`TravelPage.tsx`)
   - Loads Front Chat script
   - Initializes widget with user data
   - Configures custom launcher (no default bubble)

2. **User Clicks "Chat with Paige"**
   - Opens Front widget
   - User types message
   - Message goes directly to Front inbox

3. **Orchestrator Responds** (via Front)
   - `front-inbound` webhook receives message
   - Calls `ai-orchestrator`
   - Response appears in widget automatically

### No Portal Database Operations

The portal **no longer**:
- Creates conversations in Supabase
- Inserts messages into Supabase
- Syncs to Front via API calls
- Manages realtime subscriptions for chat

All messaging happens through Front!

## Customization

### Widget Appearance

The widget uses your Front branding by default. To customize:

```typescript
// In frontChat.ts, modify the config:
window.FrontChat('init', {
  chatId,
  useDefaultLauncher: false,
  welcomeMessageAppearance: 'hidden',
  // Add custom styling:
  theme: {
    brandColor: '#0C1424',
    fontFamily: 'Inter, sans-serif',
  },
});
```

### Launcher Button

The portal provides two launchers:
1. **Main card** - "Chat with Paige" section on Travel page
2. **Floating button** - Bottom-right corner, shows unread count

Both call `showFrontChat()` to open the widget.

### Unread Badge

The portal listens for unread messages:

```typescript
onUnreadChange((count) => {
  setUnreadCount(count);
});
```

Red badges appear on launcher buttons when count > 0.

## Testing

1. Start the dev server
2. Go to `/travel` page
3. Click "Open Paige Chat"
4. Verify widget opens
5. Send a test message
6. Check Front inbox to see the message
7. Reply from Front
8. Verify reply appears in widget

## Orchestrator Integration

Your existing `ai-orchestrator` in the other Bolt project continues to work:

1. Front webhook → `front-inbound` edge function
2. `front-inbound` → `ai-orchestrator`
3. `ai-orchestrator` → Processes message, posts response to Front
4. Front → Sends to widget automatically

**No changes needed to orchestrator!**

## Benefits

✅ **Eliminated Issues:**
- No more conversation creation race conditions
- No more orchestrator timeouts in portal
- No more duplicate messages
- No more complex Front sync logic
- No more realtime subscription management

✅ **New Capabilities:**
- Full conversation history across sessions
- File uploads (supported by Front widget)
- Typing indicators
- Read receipts
- Mobile support
- Human agent handoff (built into Front)

✅ **Simplified Code:**
- Removed ~200 lines of custom chat logic
- Single `frontChat.ts` utility module
- Clean, maintainable Travel page

## Troubleshooting

### Widget Not Loading

1. Check `VITE_FRONT_CHAT_ID` is set correctly
2. Open browser console, look for Front script errors
3. Verify Chat channel is active in Front settings

### User Not Identified

1. Check user has valid email in Supabase profile
2. Verify `initFrontChat()` is being called with correct data
3. Check browser console for Front initialization logs

### Messages Not Appearing

1. Verify `front-inbound` webhook is configured in Front
2. Check orchestrator logs in Supabase dashboard
3. Test webhook manually with curl/Postman

### Identity Verification Fails

1. Verify secret key matches Front settings
2. Check `front_user_hash` column has correct HMAC value
3. Try without verification first to isolate issue

## Migration Notes

### What Was Removed

- `getOrCreateConversation()` - No longer creates conversations from portal
- `createMessage()` - Messages now sent via Front widget only
- `syncConversationToFront()` - Widget handles sync automatically
- Custom chat UI components - Replaced by Front widget
- Realtime message subscriptions - Widget handles this

### What Remains

- Supabase profiles, members, trips, perks - Unchanged
- Request/offer tracking - Still used for search results display
- Travel store - Still manages intent chips and results
- Admin pages - Unchanged

### Backward Compatibility

Old API functions remain in `travelRequests.ts` but are marked deprecated. They can be removed in a future cleanup once confirmed no other code uses them.

## Next Steps

1. Add your Front Chat ID to `.env`
2. Test the integration
3. (Optional) Set up identity verification
4. Remove deprecated code once verified
5. Update orchestrator to use portal custom fields if needed

## Support

For Front-specific issues, see:
- [Front Chat SDK Docs](https://dev.frontapp.com/docs/chat-sdk)
- [Identity Verification](https://dev.frontapp.com/docs/chat-sdk#identity-verification)
- [Webhooks](https://dev.frontapp.com/docs/webhooks)
