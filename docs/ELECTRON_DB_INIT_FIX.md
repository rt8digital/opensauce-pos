# Electron Database Initialization Fix

## Issue Summary
When running the Electron application in development mode (`npm run dev:electron`), the application would fail with a "Database not initialized" error. This was preventing user session restoration and other database-dependent features from functioning.

## Root Causes Identified
1. **Missing Database File**: The `sqlite.db` file was not present in the project root directory.
2. **Native Module Mismatch**: The `better-sqlite3` native module was compiled for a different Node.js version than the one used by Electron, causing it to fail to load properly.
3. **Execution Context**: In development, `process.cwd()` was being used to locate the database, but there was no robust fallback to create the database if it was missing during the development lifecycle.

## Implementation Details & Fixes

### 1. Standalone Database Initialization Script (`init-db.cjs`)
A new CommonJS script was created to manually initialize and seed the database. This script:
- Creates `sqlite.db` in the project root.
- Defines the full schema (Users, Products, Categories, Settings, etc.).
- Seeds default accounts:
    - **Admin**: PIN `888888`
    - **Cashier**: PIN `654321`
- Seeds sample categories and 15 product items to allow immediate testing.

### 2. Automatic Initialization in `electron/main.ts`
The database initialization logic in the main process was enhanced to be more resilient:
- Added a check in `initializeDatabase()` that detects if the database file is missing specifically in development mode (`isDev`).
- If missing, it now calls `initializeDefaultSchema()` automatically before attempting the connection.
- Added detailed debug logging (using `electron-log` and `console.log`) to track the exact `dbPath` and file existence status during startup.

### 3. Native Module Compatibility Fix
To resolve the binary compatibility issue with `better-sqlite3`, the following command was executed:
```bash
npx @electron/rebuild -f -w better-sqlite3
```
This forces a rebuild of the native module specifically for the Electron version currently in use.

## Verification Steps
1. **Database Integrity**: Verified using `check-db.cjs` that all tables exist and default users are correctly seeded.
2. **App Startup**: Confirmed that `npm run dev:electron` now initializes the connection and loads the application without console errors.
3. **Session Restoration**: Verified that the `db:auth:set-session` IPC call succeeds, allowing the `AuthProvider` to maintain user state.

## Usage for Developers
If you encounter database issues in the future:
- **To reset the DB**: Run `node init-db.cjs`
- **To verify the DB**: Run `node check-db.cjs`
- **If native modules fail**: Run `npm run rebuild:db` (which executes `electron-builder rebuild --force`) or use `@electron/rebuild` directly.
