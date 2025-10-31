# Point of Sale (POS) System

## Overview

This is a full-stack Point of Sale (POS) system built for retail environments. The application enables cashiers to process transactions, manage inventory, track sales, and handle various payment methods. It features barcode scanning capabilities, receipt printing, offline support through IndexedDB, and a comprehensive product catalog with category management.

The system is designed as a modern web application using React for the frontend and Express.js for the backend, with PostgreSQL as the persistent data store. The architecture supports both online and offline operations, making it resilient for retail environments with intermittent connectivity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: The application uses shadcn/ui components built on Radix UI primitives, providing a consistent and accessible user interface. TailwindCSS handles styling with a custom theme configuration supporting light/dark modes.

**State Management**: TanStack Query (React Query) manages server state with aggressive caching strategies (staleTime: Infinity, no automatic refetching). This approach optimizes for offline-first usage patterns where data changes are primarily user-initiated.

**Routing**: Wouter provides lightweight client-side routing with three main routes:
- `/` - Point of Sale interface
- `/inventory` - Product management
- `/sales` - Analytics and reporting

**Offline Support**: IndexedDB provides client-side persistence for products and orders. The system syncs products from the server and stores them locally, enabling core POS functionality even when the server is unavailable. This architecture prioritizes data availability over real-time consistency.

**Key Features**:
- **Barcode Scanner Integration**: Uses @zxing/library for webcam-based barcode scanning with environment-facing camera support
- **Receipt Printing**: jsPDF generates printable PDF receipts that open in new windows for printing
- **Numeric Keypad**: Calculator-style interface for PLU entry and quick calculations
- **Settings Management**: Persistent configuration stored in localStorage for currency symbols, printer settings, and QR code payment images

### Backend Architecture

**Framework**: Express.js with TypeScript running in ESM mode.

**API Design**: RESTful API with standard CRUD operations:
- `GET/POST /api/products` - Product listing and creation
- `GET/PATCH/DELETE /api/products/:id` - Individual product operations
- `GET /api/products/barcode/:barcode` - Barcode lookup
- `GET/POST /api/orders` - Order retrieval and creation

**Data Validation**: Zod schemas (via drizzle-zod) validate incoming requests, ensuring data integrity before database operations.

**Development Mode**: Vite middleware integration provides HMR (Hot Module Replacement) during development with custom error logging. Production builds serve static files from the dist directory.

**Storage Layer**: Abstracted through an IStorage interface with two implementations:
- **MemStorage**: In-memory storage with sample data for development/demo
- **Database Storage** (implied by schema): Production implementation using Drizzle ORM

This abstraction allows easy switching between storage backends and simplifies testing.

### Data Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect provides type-safe database operations and schema management.

**Schema Design**:
- **products**: Core product catalog with name, price, image URL, stock quantity, barcode (unique), and category
- **orders**: Transaction records storing items as JSON, total amount, payment method, and timestamp
- **orderItems**: Normalized order line items (defined but not actively used in favor of denormalized JSON in orders table)

**Design Decision**: Orders store items as denormalized JSON arrays rather than normalized relations. This trade-off prioritizes read performance and simplifies order retrieval at the cost of potential data inconsistencies and more complex inventory management. This approach suits a POS system where order history is primarily read-only after creation.

**Type Safety**: TypeScript types are inferred directly from Drizzle schemas using `$inferSelect`, ensuring compile-time type safety between database and application code.

### External Dependencies

**Database**: 
- **Neon Serverless PostgreSQL** (@neondatabase/serverless): Serverless Postgres provider optimized for edge and serverless environments
- **Connection**: Via DATABASE_URL environment variable (required)
- **Session Store**: connect-pg-simple provides PostgreSQL-backed session storage (dependency present but session middleware not visible in provided code)

**Build & Development Tools**:
- **Vite**: Frontend build tool and dev server with React plugin
- **esbuild**: Backend bundler for production builds
- **tsx**: TypeScript execution for development
- **Drizzle Kit**: Database migration and schema management tool

**Frontend Libraries**:
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing
- **react-hook-form**: Form handling with @hookform/resolvers for validation
- **date-fns**: Date manipulation and formatting
- **recharts**: Chart rendering for sales analytics

**Barcode & Printing**:
- **@zxing/library**: Barcode scanning via webcam
- **jspdf**: PDF receipt generation
- **idb**: IndexedDB wrapper for client-side storage

**UI Components**: Comprehensive Radix UI component library (@radix-ui/*) including dialogs, dropdowns, forms, tables, and navigation components

**Styling**:
- **TailwindCSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant styling
- **clsx & tailwind-merge**: Conditional class management

**Theme Management**: @replit/vite-plugin-shadcn-theme-json enables dynamic theme configuration via theme.json file