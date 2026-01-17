# OpenSauce P.O.S. Documentation

## Overview
OpenSauce P.O.S. is a modern Point of Sale system designed for flexibility and ease of use. It can run as a web application, a mobile app (via Capacitor), or a desktop application (via Electron).

## Tech Stack
- **Frontend**: React 18, Vite 7, TypeScript 5, Tailwind CSS 3
- **UI Components**: Radix UI, Lucide Icons, Framer Motion
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Database**: SQLite with Drizzle ORM and `better-sqlite3`
- **Native Integration**: Capacitor (Android/iOS), Electron (Desktop)
- **External Services**: WhatsApp Web integration, ESC/POS printer support

## Project Structure
- `client/`: Contains the React frontend application.
  - `src/components/`: Reusable UI components.
  - `src/pages/`: Page-level components (POS, Inventory, Sales, etc.).
  - `src/lib/`: Unified API client (`queryClient.ts`) and utility functions.
  - `src/hooks/`: Custom React hooks (translation, keyboard, etc.).
- `shared/`: Shared types and database schema definition.
- `docs/`: Technical documentation and implementation plans.
- `scripts/`: Utility scripts for database management, backups, and building.
- `dist/`: Build output directory (gitignored).

## Electron Integration
The application uses a hybrid approach for Electron:
1. **Direct Database Access**: When running in Electron, the frontend bypasses traditional HTTP API calls and uses `window.electronAPI` to communicate directly with the database via IPC handlers.
2. **IPC Bridge**: Defined in `preload.ts`, it exposes safe methods for:
   - CRUD operations on Products, Orders, Customers, Categories.
   - Authentication (PIN-based login).
   - System settings and setup.
3. **Environment Detection**: `App.tsx` and `queryClient.ts` detect `window.electronAPI` to switch behavior.

## Optimized Build Process (Target: 8GB RAM, HDD)
To ensure smooth building on low-resource hardware:
- **Build Concurrency**: Reduced to prevent memory exhaustion.
- **Optimized Minification**: Using faster minifiers where possible.
- **Disk I/O Management**: Minimizing temporary file creation.

---
*Created by Antigravity AI*
