# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Lint/Test Commands

### Critical Commands
- `npm run dev` - Starts concurrent server (tsx) and Vite dev server
- `npm run start:server` - Run server only with tsx

### Testing Commands
- `npm run test` - Playwright tests
- `npm run test:whatsapp` - Specific WhatsApp tests (note: WhatsApp removed for core POS focus)
- `npm run test:lib`, `test:service`, `test:bot`, `test:integration` - Playwright test suites

## Code Style Guidelines

### Database Patterns
- Use Drizzle ORM queries in `server/routes.ts` - database operations are centralized there
- Database migrations are handled programmatically in `server/db.ts` (not Drizzle migrations)
- Always convert price/cost/values to strings before database operations

### Server Architecture
- Express server in `server/index.ts` with complex path resolution for packaged vs development
- Socket.io real-time communication setup in `server/socket.ts`

### Client Architecture
- React with Wouter routing in `client/src/App.tsx`
- First-time setup flow checks `/api/auth/setup` endpoint
- Remote barcode scanning via Socket.io custom events

### Non-Obvious Conventions
- Printer service uses dynamic imports to avoid startup dependencies

## Critical Gotchas
- Server port defaults to 5001
- Thermal printer support requires USB/network configuration via API
- WhatsApp integration removed from core POS functionality