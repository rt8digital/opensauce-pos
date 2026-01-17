# OpenSauce POS Database Documentation

## Overview
This document provides comprehensive documentation for the OpenSauce POS database system, covering schema design, migration processes, development vs production environments, and maintenance procedures.

## Database Architecture

### Core Components
- **Database Engine**: SQLite with better-sqlite3 driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Definition**: TypeScript-based schema in `shared/schema.ts`
- **Migration System**: Custom SQL-based migrations with Drizzle integration

### Database Location

#### Development Environment
- **Path**: `./sqlite.db` (project root)
- **Used by**: Local development, testing, and debugging
- **Configuration**: `drizzle.config.ts`

#### Production Environment  
- **Path**: `%APPDATA%/opensauce-pos/database/sqlite.db` 
  - Windows: `C:\Users\[username]\AppData\Roaming\opensauce-pos\database\sqlite.db`
  - Cross-platform: `~/.config/opensauce-pos/database/sqlite.db`
- **Used by**: Electron production builds
- **Configuration**: Hardcoded in electron/main.ts

## Schema Structure

The database schema is defined in `shared/schema.ts` using Drizzle ORM syntax. Key tables include:

### Core Business Tables
- **users**: User accounts and authentication
- **customers**: Customer information and loyalty data
- **categories**: Product categorization
- **products**: Product inventory and pricing
- **orders**: Sales transactions (CRITICAL TABLE)
- **order_items**: Individual items within orders
- **discounts**: Pricing rules and promotions

### Configuration Tables
- **settings**: System-wide configuration and preferences
- **user_preferences**: Per-user customization settings

### Integration Tables
- **whatsapp_queue**: WhatsApp messaging queue
- **whatsapp_consent**: Customer consent management
- **bot_settings**: Chatbot configuration

### Audit & Compliance
- **audit_logs**: System activity tracking
- **cash_outs**: Cash register reconciliation
- **translations**: Multi-language support

## Migration System

### Migration Workflow
1. **Development**: Changes made to `shared/schema.ts`
2. **Generation**: `npm run generate` creates migration files
3. **Application**: Migrations applied via custom scripts or Drizzle migrator
4. **Production**: Migrations deployed with application builds

### Migration Scripts
Located in `scripts/` directory:
- `generate-database.js`: Full database initialization
- `apply-migrations.mjs`: Apply pending migrations
- `run-migrations.mjs`: Execute specific migrations
- `backup-database.js`: Database backup utility

### Migration Directory Structure
```
migrations/
├── meta/
│   ├── _journal.json          # Migration history tracking
│   └── *[version]_snapshot.json # Schema snapshots
├── 000_initial_schema.sql     # Base schema
├── 001_*_*.sql               # Incremental migrations
└── ...
```

## Development vs Production Differences

### Database Paths
| Environment | Path | Purpose |
|-------------|------|---------|
| Development | `./sqlite.db` | Local testing and development |
| Production | `%APPDATA%/opensauce-pos/database/sqlite.db` | User data persistence |

### Migration Handling
| Aspect | Development | Production |
|--------|-------------|------------|
| Migration Source | `migrations/` folder | Embedded in ASAR or separate folder |
| Application Time | Manual via scripts | Automatic on app startup |
| Error Handling | Verbose logging | Silent failure with fallback |

### Schema Validation
- **Development**: Strict schema validation with Drizzle
- **Production**: Graceful degradation with backward compatibility

## Recent Fixes and Improvements ✅

### Critical Issue RESOLVED: Missing `notes` Column
**Status**: FIXED ✅
**Problem**: Production database orders table missing `notes` column
**Impact**: Order creation fails with SQLITE_ERROR
**Solution**: Created and applied migration `0019_add_notes_column_to_orders.sql`
**Verification**: Confirmed column exists and order creation works

### Migration Folder RESOLVED: Production Build Resources
**Status**: FIXED ✅
**Problem**: `migrations` folder not included in Electron build
**Impact**: Automatic migrations don't run in production
**Solution**: Updated `package.json` build configuration to include `migrations/**/*` and `app-update.yml`

### Database Version RESOLVED: Native Module Compatibility
**Status**: FIXED ✅
**Problem**: Node.js version differences cause native module conflicts
**Solution**: Rebuilt native modules with `npm rebuild better-sqlite3`

## Maintenance Tools Created 🛠️

### Diagnostic Scripts
- `scripts/inspect-production-db.js`: Database structure analysis
- `scripts/quick-db-check.js`: Quick health verification
- `scripts/db-health-check.js`: Comprehensive health assessment
- `scripts/fix-notes-column.js`: Targeted migration fix

### New Migration
- `migrations/0019_add_notes_column_to_orders.sql`: Adds missing notes column to orders table

### Configuration Files
- `app-update.yml`: Auto-update configuration for development builds

## Known Issues and Solutions

*All critical issues have been resolved. The database system is now production-ready.*

## Database Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- Monitor database size and performance
- Check for failed migrations or schema inconsistencies

#### Weekly
- Run database integrity checks
- Clean up old audit logs and temporary data
- Verify backup integrity

#### Monthly
- Analyze query performance and optimize indexes
- Review and archive historical data
- Update statistics for query planner

### Backup Strategy
1. **Automated Backups**: Configurable frequency in settings
2. **Manual Backups**: Via admin interface or scripts
3. **Backup Location**: User-defined or default system location
4. **Recovery Process**: Restore from backup file to database path

### Troubleshooting Guide

#### Common Errors
1. **"table has no column named X"**
   - Run schema inspection script
   - Apply missing migrations
   - Check for version mismatches

2. **Migration conflicts**
   - Verify migration order in journal
   - Check for duplicate migration IDs
   - Manually resolve conflicting changes

3. **Connection failures**
   - Verify database file permissions
   - Check file path accessibility
   - Ensure sufficient disk space

#### Diagnostic Tools
- `scripts/inspect-production-db.js`: Database structure analysis
- Drizzle Studio: Visual schema browsing (`npx drizzle-kit studio`)
- SQLite CLI: Direct database interrogation

## Security Considerations

### Data Protection
- Sensitive data encryption at rest
- Secure backup file handling
- Access control via user roles

### Audit Trail
- Comprehensive logging of all database operations
- User attribution for all changes
- Tamper-evident log storage

## Performance Optimization

### Indexing Strategy
- Primary keys on all tables
- Foreign key relationships enforced
- Strategic secondary indexes for frequent queries

### Query Optimization
- Prepared statements for repeated operations
- Batch operations for bulk data processing
- Connection pooling for concurrent access

## Future Improvements

### Planned Enhancements
1. **Multi-database Support**: PostgreSQL/MySQL options
2. **Cloud Sync**: Remote database synchronization
3. **Advanced Analytics**: Built-in reporting and dashboards
4. **Real-time Updates**: WebSocket-based live data feeds

### Migration Strategy Evolution
1. **Automated Downgrades**: Safe rollback mechanisms
2. **Incremental Schema Updates**: Zero-downtime deployments
3. **Cross-version Compatibility**: Seamless upgrades between major versions

---

*Last Updated: January 13, 2026*
*Version: 1.6.7*