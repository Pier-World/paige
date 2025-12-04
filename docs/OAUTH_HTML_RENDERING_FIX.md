# OAuth Callback HTML Rendering Fix

## Problem
The OAuth callback success/error pages were displaying as plain text/HTML source code instead of rendering properly in the browser. Users saw raw HTML markup instead of the styled success page.

## Root Cause
The issue was caused by including CORS headers in HTML responses. While CORS headers are necessary for API/JSON responses, they can interfere with proper HTML content-type interpretation in browsers, especially in OAuth popup windows. Additionally, missing cache control headers could cause browsers to cache responses with incorrect content-type interpretation.

## The Fix

### Changes Made

1. **Removed CORS headers from HTML responses**
   - The `corsHeaders` object was being spread into the HTML response headers
   - CORS headers (`Access-Control-Allow-Origin`, etc.) are not needed for HTML pages and can interfere with proper rendering
   - HTML responses are displayed directly in the browser, not fetched via JavaScript, so CORS doesn't apply

2. **Added explicit cache control headers**
   ```typescript
   {
     'Content-Type': 'text/html; charset=utf-8',
     'Cache-Control': 'no-cache, no-store, must-revalidate',
     'Pragma': 'no-cache',
     'Expires': '0',
   }
   ```
   These headers ensure:
   - The browser doesn't cache the response
   - Forces fresh rendering of the HTML
   - Prevents any cached "text" interpretation from previous requests

3. **Applied fix to both success and error responses**
   - Both the success callback and error callback now use the simplified header approach
   - CORS headers remain on JSON/API responses (like the initiate OAuth endpoint)

### Why This Works

The issue occurred because:
1. **Content-Type negotiation**: Mixing CORS headers with HTML responses can confuse browser content-type negotiation, especially in popup windows
2. **Popup window context**: OAuth popups may have stricter content rendering rules and can be more sensitive to header combinations
3. **Caching issues**: Without explicit cache control, the browser might have cached a previous response with incorrect content-type interpretation

By simplifying the headers to only what's necessary for HTML rendering and adding explicit cache control, the browser now correctly interprets and renders the HTML content.

## Implementation

### Key Changes in Code

**Before:**
```typescript
return new Response(htmlContent, {
  status: 200,
  headers: {
    ...corsHeaders,  // ← PROBLEM: Spreading CORS headers
    'Content-Type': 'text/html; charset=utf-8',
  },
});
```

**After:**
```typescript
return new Response(htmlContent, {
  status: 200,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});
```

### Important Notes

- **CORS headers are still used for API responses**: The `initiateOAuth` function and other JSON responses still include CORS headers, which is correct
- **Only HTML responses changed**: This fix only affects the callback success/error pages, not the OAuth initiation flow
- **No frontend changes needed**: This is purely a backend/Edge Function fix

## Testing

After deploying this fix:
1. Trigger a new OAuth flow (Gmail or Calendar connection)
2. Complete the Google authorization
3. You should now see a properly styled success page with:
   - Pier branding (dark theme)
   - Success icon with animation
   - "Connected Successfully" message
   - Close button that works
   - Auto-close functionality after 2 seconds

## Verification

To verify the fix is working:
1. Open browser developer tools (F12)
2. Go to Network tab
3. Trigger OAuth flow
4. Check the callback response:
   - **Headers should show**: `Content-Type: text/html; charset=utf-8`
   - **Headers should NOT include**: `Access-Control-Allow-Origin` (for HTML responses)
   - **Response should render**: As a styled page, not raw HTML text

## Rollback Plan

If this doesn't resolve the issue, check:
1. **Supabase Edge Function configuration**: Verify there are no platform-level content-type restrictions
2. **Browser popup blocker**: Test in different browsers (Chrome, Firefox, Safari)
3. **Frontend window.open() implementation**: Verify the popup is opened correctly in `ProfilePage.tsx`
4. **Browser cache**: Clear browser cache and try again

However, this fix should resolve the HTML rendering issue in the vast majority of cases.

## Related Files

- `supabase/functions/auth-google/index.ts` - Main OAuth handler
- `src/pages/ProfilePage.tsx` - Frontend OAuth initiation

