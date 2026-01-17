# Desktop Application API Integration Fix - Implementation Plan

## Problem Statement
The Electron desktop application is experiencing API connection issues because frontend API calls are being made to the Vite development server instead of the backend server. This causes 404 errors and timeouts.

## Root Cause
1. Frontend makes API calls to `/api/*` endpoints
2. In Electron, these go to Vite server (port 5173) instead of backend server (dynamic port like 65097)
3. Vite server doesn't have these API endpoints, resulting in 404s

## Solution Approach
Update all frontend API calls to dynamically get the backend server URL through Electron IPC and make requests directly to the backend.

## Files That Need Updates

### 1. `client/src/contexts/auth-context.tsx` ✅ (DONE)
- Update login function to use backend server URL
- Already implemented with serverUrl variable

### 2. `client/src/App.tsx`
- Line 65: `fetch('/api/users')` → `fetch('${serverUrl}/api/users')`
- Line 68: `fetch('/api/auth/setup')` → `fetch('${serverUrl}/api/auth/setup')`

### 3. `client/src/pages/bot-settings.tsx`
- Line 36: `fetch('/api/bot-settings')` → `fetch('${serverUrl}/api/bot-settings')`
- Line 87: `fetch('/api/bot-settings')` → `fetch('${serverUrl}/api/bot-settings')`

### 4. `client/src/pages/whatsapp-admin.tsx`
- Line 45: `fetch('/api/whatsapp/send-test')` → `fetch('${serverUrl}/api/whatsapp/send-test')`
- Line 78: `fetch('/api/whatsapp/broadcast')` → `fetch('${serverUrl}/api/whatsapp/broadcast')`

### 5. `client/src/pages/orders.tsx`
- Line 56: `fetch(/api/orders?${params.toString()})` → `fetch(${serverUrl}/api/orders?${params.toString()})`

### 6. `client/src/lib/auth-utils.ts`
- Line 12: `fetch(/api${endpoint})` → `fetch(${serverUrl}/api${endpoint})`
- Line 28: `fetch('/api/auth/setup')` → `fetch('${serverUrl}/api/auth/setup')`
- Line 43: `fetch('/api/auth/verify')` → `fetch('${serverUrl}/api/auth/verify')`

### 7. `client/src/pages/settings.tsx`
- Line 135: `fetch('/api/discovery')` → `fetch('${serverUrl}/api/discovery')`
- Line 203: `fetch('/api/generate-pairing-qr')` → `fetch('${serverUrl}/api/generate-pairing-qr')`

## Implementation Pattern

For each file, add this code at the beginning of functions that make API calls:

```javascript
// Get server URL from Electron IPC or use fallback
let serverUrl = window.location.origin;
if (typeof window !== 'undefined' && (window as any).electronAPI) {
  serverUrl = await (window as any).electronAPI.getServerUrl();
} else if (window.location.hostname === 'localhost') {
  serverUrl = 'http://localhost:5001'; // Fallback for web dev
}
```

Then update all fetch calls to use `${serverUrl}` prefix.

## Testing Plan

1. Restart Electron app: `npx electron electron/main.ts`
2. Verify login works (no 404 errors in console)
3. Check that all API endpoints load correctly
4. Verify WebSocket connections work
5. Test WhatsApp functionality
6. Confirm all CRUD operations work

## Rollback Plan

If issues occur, revert changes by:
1. Restoring original fetch calls without serverUrl prefix
2. Rebuilding affected components
3. Falling back to proxy-based solution

## Success Criteria

- [ ] No 404 errors for API endpoints
- [ ] Successful user authentication
- [ ] Working WebSocket connections
- [ ] Functional WhatsApp integration
- [ ] All data loads correctly
- [ ] No timeout errors in console