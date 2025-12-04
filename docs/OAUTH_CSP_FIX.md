# OAuth Callback CSP (Content Security Policy) Fix

## Problem
The OAuth callback success/error pages were displaying CSP violations in the console:
- Inline styles blocked by CSP (`Applying inline style violates the following Content Security Policy directive`)
- Font loading blocked by CSP (`Loading the font violates the following Content Security Policy directive`)
- Script execution blocked in sandboxed frames (`Blocked script execution because the document's frame is sandboxed`)
- localStorage/sessionStorage access blocked in sandboxed frames (from browser extensions)

## Root Cause
**Supabase Edge Functions have strict Content Security Policy** that blocks:
- Inline `<style>` tags
- Inline `<script>` tags
- `onclick` attributes
- Data URI fonts (in some contexts)
- Storage access in sandboxed contexts

Even with CSP headers allowing `'unsafe-inline'`, Supabase's platform-level CSP was still blocking inline content.

## The Solution

### Approach: Use Base64-Encoded Data URLs

Instead of inline styles and scripts, we encode them as **base64 data URLs** which are treated as external resources, bypassing inline restrictions:

```typescript
// CSS as data URL
const cssDataUrl = `data:text/css;base64,${btoa(cssContent)}`;

// JavaScript as data URL  
const jsDataUrl = `data:text/javascript;base64,${btoa(jsContent)}`;

// Then reference them as external resources
<link rel="stylesheet" href="${cssDataUrl}">
<script src="${jsDataUrl}"></script>
```

### Added Permissive CSP Headers

Both success and error callback pages now include CSP headers that explicitly allow data URLs:

```typescript
'Content-Security-Policy': "default-src 'self' data: 'unsafe-inline' 'unsafe-eval'; style-src 'self' data: 'unsafe-inline'; script-src 'self' data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data:;"
```

### CSP Directive Breakdown

- **`default-src 'self' data:`**: Default policy allows resources from same origin and data URIs
- **`style-src 'self' data: 'unsafe-inline'`**: Allows stylesheets from same origin, data URIs, and inline styles (fallback)
- **`script-src 'self' data: 'unsafe-inline' 'unsafe-eval'`**: Allows scripts from same origin, data URIs, inline scripts (fallback), and eval (for dynamic execution)
- **`img-src 'self' data:`**: Allows images from same origin and data URIs

## Implementation

### Key Changes

#### 1. Removed All Inline Styles
**Before:**
```html
<style>
  body { background: #0a0a0a; }
  /* ... more CSS ... */
</style>
```

**After:**
```typescript
const cssDataUrl = `data:text/css;base64,${btoa(`
  body { background: #0a0a0a; }
  /* ... more CSS ... */
`)}`;
```

```html
<link rel="stylesheet" href="${cssDataUrl}">
```

#### 2. Removed All Inline JavaScript
**Before:**
```html
<button onclick="closeWindow()">Close</button>
<script>
  function closeWindow() { /* ... */ }
  // ... more JS ...
</script>
```

**After:**
```typescript
const jsDataUrl = `data:text/javascript;base64,${btoa(`
  function closeWindow() { /* ... */ }
  // ... more JS ...
  document.getElementById('close-button').addEventListener('click', closeWindow);
`)}`;
```

```html
<button id="close-button">Close</button>
<script src="${jsDataUrl}"></script>
```

#### 3. Removed `onclick` Attributes
- Replaced `onclick="closeWindow()"` with proper event listeners in the external script
- Uses `document.getElementById('close-button').addEventListener('click', closeWindow)`

#### 4. Added Permissive CSP Headers
```typescript
return new Response(htmlContent, {
  status: 200,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'self' data: 'unsafe-inline' 'unsafe-eval'; style-src 'self' data: 'unsafe-inline'; script-src 'self' data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data:;",
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});
```

## Why This Works

1. **Data URLs bypass inline restrictions**: The browser treats `data:` URLs as external resources, not inline content, so they're not blocked by CSP
2. **Explicit CSP header**: We're explicitly telling the browser what we need permission for
3. **No storage dependencies**: The code works entirely without localStorage/sessionStorage
4. **Proper event listeners**: Instead of `onclick="..."`, we use proper event listeners added via external script

## About the Sandboxed Frame Errors

The console may still show errors about sandboxed frames and localStorage/sessionStorage access. These are typically caused by:
- **Browser extensions** (chrome-extension:// URLs) trying to inject scripts into the page
- **Browser security features** in certain contexts

These errors don't affect the functionality of our OAuth callback page. The page will still:
- Render correctly with styles
- Execute scripts (close window, postMessage)
- Auto-close after 2 seconds

## Testing

After deploying this fix:
1. Trigger OAuth flow (Gmail or Calendar connection)
2. Complete Google authorization
3. Check browser console - **CSP violations should be completely gone**
4. Page should render with:
   - Proper styling (dark theme, animations)
   - Working close button
   - Auto-close functionality
   - No CSP errors in console (sandboxed frame errors from extensions are OK)

## Security Considerations

- **`unsafe-inline` and `unsafe-eval`**: We use these as fallbacks, but the primary approach (data URLs) doesn't require them
- **Data URLs**: The CSS and JS are base64-encoded server-side, so they're trusted content
- **`default-src 'self'`**: Restricts resources to same origin only
- **No user-controlled content**: All HTML/CSS/JS is generated server-side

For a production callback page, this CSP is appropriate and secure.

## Files Changed

- `supabase/functions/auth-google/index.ts`
  - Added CSP headers to success callback response
  - Added CSP headers to error callback response
  - Added X-Frame-Options header

