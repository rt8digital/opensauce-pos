# Comprehensive Debugging Guide

This guide provides systematic troubleshooting for all components of the OpenSauce P.O.S. system, including Electron, React frontend, Playwright tests, offline sync, peripherals, and mobile builds.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [React Frontend Issues](#react-frontend-issues)
- [Backend Server Issues](#backend-server-issues)
- [Database Issues](#database-issues)
- [Offline Sync Issues](#offline-sync-issues)
- [Peripheral Integration Issues](#peripheral-integration-issues)
- [WhatsApp Integration Issues](#whatsapp-integration-issues)
- [Mobile App Issues](#mobile-app-issues)
- [Playwright Testing Issues](#playwright-testing-issues)
- [Build & Packaging Issues](#build--packaging-issues)
- [Performance Issues](#performance-issues)

## Development Environment Setup

### Node.js Version Conflicts
**Symptoms:** Build errors, native module compilation failures
**Check:**
```bash
node --version  # Should be 18+ for Electron compatibility
npm --version
```
**Fix:**
- Use Node Version Manager (nvm) to switch versions
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Port Conflicts
**Symptoms:** "Port already in use" errors
**Check:**
```bash
# Windows
netstat -ano | findstr :5001
netstat -ano | findstr :5177

# Kill process
taskkill /PID <PID> /F
```
**Fix:** Change ports in `vite.config.ts` or `server/index.ts`


## React Frontend Issues

### Component Not Rendering
**Symptoms:** Blank page, missing UI elements
**Debug Steps:**
1. Check React DevTools for component tree
2. Verify data-testid attributes exist:
```javascript
// In DevTools Console
document.querySelector('[data-testid="nav-pos"]')
```
3. Check for JavaScript errors in Console
4. Verify routing in `App.tsx`:
```javascript
console.log('Current route:', window.location.pathname);
```

### State Management Issues
**Symptoms:** Data not updating, stale UI
**Debug Steps:**
1. Check React Query cache:
```javascript
// In DevTools Console
import { queryClient } from './lib/queryClient';
console.log(queryClient.getQueryCache().getAll());
```
2. Verify API endpoints return correct data
3. Check for optimistic updates in offline sync

### Virtual Keyboard Not Working
**Symptoms:** Touch inputs don't show virtual keyboard
**Debug Steps:**
1. Verify VirtualKeyboardProvider wraps the app
2. Check touch event detection:
```javascript
// In component
const isTouch = 'ontouchstart' in window;
console.log('Touch device:', isTouch);
```
3. Test keyboard context:
```javascript
const { showKeyboard } = useVirtualKeyboardContext();
console.log('Keyboard context:', { showKeyboard });
```

## Backend Server Issues

### Server Won't Start
**Symptoms:** Port binding errors, database connection failures
**Debug Steps:**
1. Check database initialization:
```bash
# In server/db.ts
console.log('Database path:', dbPath);
console.log('Database initialized:', !!db);
```
2. Verify port availability:
```bash
lsof -i :5001  # Linux/Mac
netstat -ano | findstr :5001  # Windows
```
3. Check for Zod validation errors in routes

### API Endpoint Failures
**Symptoms:** 500 errors, incorrect responses
**Debug Steps:**
1. Add logging to route handlers:
```javascript
app.get('/api/products', async (req, res) => {
  console.log('Fetching products...');
  try {
    const products = await db.select().from(schema.products);
    console.log('Found products:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});
```
2. Test with curl:
```bash
curl http://localhost:5001/api/products
```

## Database Issues

### SQLite Connection Errors
**Symptoms:** "Database locked", "no such table" errors
**Debug Steps:**
1. Check database file location:
```javascript
// In server/db.ts
console.log('Database path:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));
```
2. Verify WAL mode:
```sql
PRAGMA journal_mode;  -- Should return WAL
```
3. Check for concurrent access issues

### Migration Failures
**Symptoms:** Schema mismatches, migration errors
**Debug Steps:**
1. Check migration status:
```bash
ls -la migrations/meta/
cat migrations/meta/_journal.json
```
2. Run migrations manually:
```bash
npx drizzle-kit push
```
3. Verify schema matches in `shared/schema.ts`

## Offline Sync Issues

### Data Not Syncing
**Symptoms:** Changes made offline don't appear when online
**Debug Steps:**
1. Check sync queue:
```javascript
// In DevTools Console
const db = await indexedDB.open('pos-db');
const queue = await db.getAll('syncQueue');
console.log('Sync queue:', queue);
```
2. Verify online detection:
```javascript
console.log('Online status:', navigator.onLine);
window.addEventListener('online', () => console.log('Went online'));
```
3. Check sync processing logs in `offline-sync.ts`

### Sync Conflicts
**Symptoms:** Data inconsistencies between local and server
**Debug Steps:**
1. Inspect IndexedDB data:
```javascript
// In DevTools > Application > IndexedDB
// Check pos-db > products, orders, etc.
```
2. Verify conflict resolution logic
3. Check timestamps and version numbers

## Peripheral Integration Issues

### Printer Not Working
**Symptoms:** Print jobs fail, no output
**Debug Steps:**
1. Test printer connection:
```javascript
// In electron.js
const devices = await USB.getDevices();
console.log('USB devices:', devices);
```
2. Check ESC/POS library:
```javascript
try {
  const escpos = await import('escpos');
  console.log('ESC/POS loaded successfully');
} catch (error) {
  console.error('ESC/POS load error:', error);
}
```
3. Verify printer configuration in settings

### Scanner Not Detected
**Symptoms:** Barcode scans not registering
**Debug Steps:**
1. Check device permissions (especially mobile)
2. Verify scanner event listeners:
```javascript
// In socket.ts
socket.on('remote_scan', (data) => {
  console.log('Remote scan received:', data);
});
```
3. Test camera scanner fallback

### Cash Drawer Issues
**Symptoms:** Drawer won't open
**Debug Steps:**
1. Check serial port connection:
```javascript
const ports = await SerialPort.list();
console.log('Available ports:', ports);
```
2. Verify pulse duration settings
3. Test with different ports/COM devices

## WhatsApp Integration Issues

### WhatsApp Won't Connect
**Symptoms:** QR code not generating, connection failures
**Debug Steps:**
1. Check puppeteer initialization:
```javascript
// In server/whatsapp.ts
console.log('Starting WhatsApp client...');
```
2. Verify puppeteer browser launch:
```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
console.log('Browser launched');
```
3. Check for session persistence issues

### Message Sending Failures
**Symptoms:** Messages not delivered
**Debug Steps:**
1. Verify WhatsApp Web authentication
2. Check message format validation
3. Monitor puppeteer console logs

## Mobile App Issues

### Capacitor Build Failures
**Symptoms:** Android/iOS build errors
**Debug Steps:**
1. Check Capacitor configuration:
```bash
npx cap doctor
```
2. Verify plugin installations:
```bash
npx cap ls
```
3. Check native project setup:
```bash
npx cap open android
# Check for errors in Android Studio
```

### Device Linking Issues
**Symptoms:** Mobile devices not connecting to desktop
**Debug Steps:**
1. Verify Socket.io connection:
```javascript
// In mobile app
socket.on('connect', () => console.log('Connected to desktop'));
socket.on('connect_error', (error) => console.error('Connection error:', error));
```
2. Check firewall settings
3. Verify IP address configuration

## Playwright Testing Issues

### Tests Timing Out
**Symptoms:** Tests fail with timeout errors
**Debug Steps:**
1. Increase timeout in `playwright.config.ts`:
```javascript
use: {
  actionTimeout: 15000,
  navigationTimeout: 30000,
}
```
2. Add debugging to failing tests:
```javascript
await page.pause();  // Interactive debugging
```
3. Check for race conditions with `waitForLoadState`

### Element Not Found
**Symptoms:** `getByTestId` or selectors fail
**Debug Steps:**
1. Verify data-testid attributes exist:
```javascript
// In DevTools Console
document.querySelector('[data-testid="login-submit-button"]')
```
2. Check for dynamic content loading
3. Use Playwright codegen:
```bash
npx playwright codegen http://localhost:5177
```

### Flaky Tests
**Symptoms:** Tests pass/fail randomly
**Debug Steps:**
1. Add retry logic:
```javascript
test.describe('Flaky test group', () => {
  test.retries(3);
  // ...
});
```
2. Use more specific selectors
3. Add proper wait conditions

## Build & Packaging Issues

### Electron Builder Failures
**Symptoms:** Packaging fails, missing files
**Debug Steps:**
1. Check build output:
```bash
npm run build  # Verify dist/ folder created
```
2. Verify asarUnpack configuration in desktop packager config
3. Test with development build first:
```bash
npm run electron-dist
```

### Native Module Issues
**Symptoms:** "Module not found" in packaged app
**Debug Steps:**
1. Check electron-rebuild:
```bash
npm run rebuild-native
```
2. Verify native modules in node_modules
3. Check for platform-specific binaries

## Performance Issues

### Slow Startup
**Symptoms:** Long splash screen duration
**Debug Steps:**
1. Profile startup in `electron.js`:
```javascript
console.time('Startup');
console.timeEnd('Startup');
```
2. Check database initialization time
3. Optimize bundle size in `vite.config.ts`

### Memory Leaks
**Symptoms:** Increasing memory usage over time
**Debug Steps:**
1. Use Chrome DevTools Memory tab
2. Check for unsubscribed event listeners
3. Monitor IndexedDB storage growth

### UI Responsiveness Issues
**Symptoms:** Laggy interface, slow rendering
**Debug Steps:**
1. Check React DevTools Profiler
2. Verify virtual scrolling for large lists
3. Optimize re-renders with React.memo

## Common Error Patterns

### Silent Failures
**Many issues manifest as silent failures rather than errors**
- Check console logs in all processes (main, renderer, server)
- Enable verbose logging: `DEBUG=* npm run dev`
- Use electron-log for persistent logging

### Network-Related Issues
**Offline/online state changes cause various problems**
- Test with network throttling in DevTools
- Verify service worker registration
- Check CORS settings in development

### Platform-Specific Issues
**Windows, macOS, Linux have different behaviors**
- Test on target platform when possible
- Use platform-specific code paths
- Check file path separators and permissions

## Emergency Recovery

### Reset Application State
```bash
# Stop all processes
pkill -f "electron\|node.*server"

# Clear databases
rm -f sqlite.db*
rm -rf client/src/db-manager/App.tsx  # Wait, wrong

# Clear IndexedDB (in browser DevTools)
# Application > Storage > IndexedDB > Delete database

# Clear caches
rm -rf node_modules/.cache
npm cache clean --force
```

### Factory Reset
```bash
# Remove user data
rm -rf ~/Library/Application\ Support/OpenSauce\ P.O.S./  # macOS
rm -rf %APPDATA%/OpenSauce\ P.O.S./  # Windows

# Reinstall
npm install
npm run db:seed
```

## Getting Help

1. **Check existing documentation** in `docs/` folder
2. **Run diagnostic scripts** in `scripts/` folder
3. **Check GitHub Issues** for similar problems
4. **Enable maximum logging** before reporting issues
5. **Provide system information**: OS, Node version, Electron version

Remember: Most issues stem from async operations, state management, or platform differences. Always check logs first, then isolate components systematically.