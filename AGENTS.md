# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is OpenSauce POS, a Point of Sale system built with React, TypeScript, and Electron. The application supports both desktop (Electron) and web deployments with SQLite database storage.

## Core Architecture

### Frontend Structure
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (file-based routing)
- **State Management**: React Context + TanStack Query for server state
- **UI Components**: Radix UI primitives with custom components
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite

### Backend/Data Layer
- **Database**: SQLite with Drizzle ORM
- **API Layer**: Direct database access in Electron, REST API for web
- **Data Schema**: Shared types between client and server in `/shared/schema.ts`
- **Migrations**: Managed through Drizzle migration system

### Desktop Application
- **Platform**: Electron with Node.js backend
- **Main Process**: Handles database operations, printing, hardware integration
- **Renderer Process**: React frontend with IPC communication
- **Hardware Support**: Bluetooth printers, barcode scanners, cash drawers

## Essential Commands

### Development
```bash
# Start development server (web)
npm run dev

# Start Electron development
npm run dev:electron

# Build for production
npm run build

# Type checking
npm run check
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:lib
npm run test:service
npm run test:bot
npm run test:integration

# Run WhatsApp-specific tests
npm run test:whatsapp
```

### Database Operations
```bash
# Generate database schema
npm run generate:database

# Run database migrations
node migrate-db.cjs
```

### Mobile/Capacitor
```bash
# Sync mobile builds
npm run cap:sync

# Build for Android
npm run cap:android

# Build for iOS
npm run cap:ios
```

## Key Directories

- `client/src/` - Main React application source
- `electron/` - Electron main process and preload scripts
- `shared/` - Shared types and database schema
- `migrations/` - Database migration files
- `tests/` - Playwright test suites
- `src/` - Server-side utilities (minimal)

## Important Files

- `client/src/App.tsx` - Main application component with routing
- `shared/schema.ts` - Database schema definitions
- `electron/main.ts` - Electron main process
- `vite.config.ts` - Build configuration
- `package.json` - Dependencies and scripts

## Development Notes

- The application supports both Electron desktop and web deployments
- Database operations use direct SQLite access in Electron, REST API in web
- Hardware integration (printers, scanners) is handled through Electron APIs
- Internationalization support through translation hooks
- Offline synchronization capabilities built-in
- # Detailed Implementation Plan: Thermal Printer Character Encoding Fix

### Problem Analysis
The thermal printer cancels print jobs immediately because it receives UTF-8 encoded text but expects a specific character codepage (likely CP437, CP850, or CP1252). The font customization features introduce special characters that don't exist in the printer's current encoding.

### Phase 1: Database & Configuration Setup

**1. Extend Database Schema**
- Add `printer_codepage` column to settings table
- Add `printer_model` and `printer_manufacturer` for future compatibility
- Create migration to add these fields with sensible defaults

**2. Update Settings UI**
- Add "Printer Character Encoding" dropdown in printer settings
- Options: Auto-detect, CP437, CP850, CP1252, ISO-8859-1, UTF-8
- Add printer model selection for known device profiles
- Include help text explaining encoding importance

### Phase 2: Core Encoding Infrastructure

**3. Create Encoding Utility Module**
```typescript
// client/src/lib/printer-encoding.ts
export class PrinterEncoding {
  static encodeText(text: string, codepage: string): Uint8Array
  static detectBestEncoding(text: string): string
  static sanitizeForEncoding(text: string, codepage: string): string
  static getCodepageCommand(codepage: string): number[]
}
```

**4. Implement Character Mapping**
- Create mapping tables for special characters across codepages
- Handle currency symbols (R, €, £, ¥)
- Provide fallbacks for unsupported characters (replace with ASCII equivalents)
- Preserve important symbols while removing problematic ones

### Phase 3: ESC/POS Command Updates

**5. Modify ESC/POS Initialization**
Update `bluetooth-printer-service.ts` and Electron main process:
```typescript
// Set codepage before printing text
const codepageCommand = PrinterEncoding.getCodepageCommand(settings.printerCodepage);
commands.push(...codepageCommand);
```

**6. Update Text Encoding Process**
Replace direct UTF-8 encoding with configurable encoding:
```typescript
// Instead of: const lineBytes = encoder.encode(line);
// Use: const lineBytes = PrinterEncoding.encodeText(line, codepage);
```

### Phase 4: Compatibility & Fallback Mechanisms

**7. Auto-Detection Logic**
- Test common codepages during printer setup
- Store successful codepage in settings
- Provide manual override option

**8. Character Sanitization**
- Replace unsupported characters with ASCII equivalents
- Example: `€` → `EUR`, `£` → `GBP`, `™` → `(TM)`
- Log encoding issues for troubleshooting

**9. Error Recovery**
- If encoding fails, fall back to ASCII-only printing
- Provide user feedback about encoding issues
- Allow manual codepage testing

### Phase 5: Testing & Validation

**10. Printer Compatibility Testing**
- Add "Test Encoding" button in settings
- Print test receipts with various character sets
- Validate output quality for each codepage

**11. Comprehensive Logging**
- Log encoding decisions and command sequences
- Track printer responses and errors
- Enable hex dump output for debugging

### Phase 6: Documentation & Deployment

**12. User Documentation**
- Printer setup guide with encoding instructions
- Troubleshooting guide for common issues
- List of tested printer models and their required settings

**13. Admin Tools**
- Encoding test utilities
- Command sequence inspector
- Printer compatibility database

### Technical Implementation Details

**Database Changes:**
```sql
ALTER TABLE settings ADD COLUMN printer_codepage TEXT DEFAULT 'cp437';
ALTER TABLE settings ADD COLUMN printer_model TEXT;
ALTER TABLE settings ADD COLUMN printer_manufacturer TEXT;
```

**Key ESC/POS Commands:**
- `ESC t n` - Select character code table
- `CP437 = 0x00`, `CP850 = 0x10`, `CP1252 = 0x20`

**Encoding Libraries Needed:**
- `iconv-lite` for character encoding conversion
- Custom mapping tables for symbol replacement

**Testing Strategy:**
- Unit tests for encoding functions
- Integration tests with mock printers
- Real-device testing with multiple printer models
- Regression testing for existing functionality

This plan addresses the root cause while maintaining backward compatibility and providing robust fallback mechanisms for reliable thermal printing across different printer models and character sets.e because it receives UTF-8 encoded text but expects a specific character codepage (likely CP437, CP850, or CP1252). The font customization features introduce special characters that don't exist in the printer's current encoding.

### Phase 1: Database & Configuration Setup

**1. Extend Database Schema**
- Add `printer_codepage` column to settings table
- Add `printer_model` and `printer_manufacturer` for future compatibility
- Create migration to add these fields with sensible defaults

**2. Update Settings UI**
- Add "Printer Character Encoding" dropdown in printer settings
- Options: Auto-detect, CP437, CP850, CP1252, ISO-8859-1, UTF-8
- Add printer model selection for known device profiles
- Include help text explaining encoding importance

### Phase 2: Core Encoding Infrastructure

**3. Create Encoding Utility Module**
```typescript
// client/src/lib/printer-encoding.ts
export class PrinterEncoding {
  static encodeText(text: string, codepage: string): Uint8Array
  static detectBestEncoding(text: string): string
  static sanitizeForEncoding(text: string, codepage: string): string
  static getCodepageCommand(codepage: string): number[]
}
```

**4. Implement Character Mapping**
- Create mapping tables for special characters across codepages
- Handle currency symbols (R, , , )
- Provide fallbacks for unsupported characters (replace with ASCII equivalents)
- Preserve important symbols while removing problematic ones

### Phase 3: ESC/POS Command Updates

**5. Modify ESC/POS Initialization**
Update `bluetooth-printer-service.ts` and Electron main process:
```typescript
// Set codepage before printing text
const codepageCommand = PrinterEncoding.getCodepageCommand(settings.printerCodepage);
commands.push(...codepageCommand);
```

**6. Update Text Encoding Process**
Replace direct UTF-8 encoding with configurable encoding:
```typescript
// Instead of: const lineBytes = encoder.encode(line);
// Use: const lineBytes = PrinterEncoding.encodeText(line, codepage);
```

### Phase 4: Compatibility & Fallback Mechanisms

**7. Auto-Detection Logic**
- Test common codepages during printer setup
- Store successful codepage in settings
- Provide manual override option

**8. Character Sanitization**
- Replace unsupported characters with ASCII equivalents
- Example: ``  `EUR`, ``  `GBP`, ``  `(TM)`
- Log encoding issues for troubleshooting
**9. Error Recovery**
- If encoding fails, fall back to ASCII-only printing
- Provide user feedback about encoding issues
- Allow manual codepage testing

### Phase 5: Testing & Validation

**10. Printer Compatibility Testing**
- Add "Test Encoding" button in settings
- Print test receipts with various character sets
- Validate output quality for each codepage

**11. Comprehensive Logging**
- Log encoding decisions and command sequences
- Track printer responses and errors
- Enable hex dump output for debugging

### Phase 6: Documentation & Deployment

**12. User Documentation**
- Printer setup guide with encoding instructions
- Troubleshooting guide for common issues
- List of tested printer models and their required settings

**13. Admin Tools**
- Encoding test utilities
- Command sequence inspector
- Printer compatibility database

### Technical Implementation Details

**Database Changes:**
```sql
ALTER TABLE settings ADD COLUMN printer_codepage TEXT DEFAULT 'cp437';
ALTER TABLE settings ADD COLUMN printer_model TEXT;
ALTER TABLE settings ADD COLUMN printer_manufacturer TEXT;
```

**Key ESC/POS Commands:**
- `ESC t n` - Select character code table
- `CP437 = 0x00`, `CP850 = 0x10`, `CP1252 = 0x20`

**Encoding Libraries Needed:**
- `iconv-lite` for character encoding conversion
- Custom mapping tables for symbol replacement

**Testing Strategy:**
- Unit tests for encoding functions
- Integration tests with mock printers
- Real-device testing with multiple printer models
- Regression testing for existing functionality

This plan addresses the root cause while maintaining backward compatibility and providing robust fallback mechanisms for reliable thermal printing across different printer models and character sets.
