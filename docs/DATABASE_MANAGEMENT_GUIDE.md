# POS Database Management Guide

This guide provides comprehensive instructions for managing the POS system database, including backup, restore, repair, and migration operations.

## Database Location Overview

The POS application uses SQLite with different locations based on the environment:

### Development Environment
- **Location**: `./sqlite.db` (project root directory)
- **Used during**: Development and testing

### Production Environment  
- **Location**: `%USERPROFILE%\.pos-app\sqlite.db` (user's home directory)
- **Used during**: Production deployment
- **Windows**: `C:\Users\[Username]\.pos-app\sqlite.db`

### Build Environment
- **Location**: `dist/sqlite.db` (for packaged builds)
- **Used during**: Application packaging

## Quick Start Scripts

For Windows users, the following batch files provide easy menu-driven access:

### `backup-database.bat`
Creates database backups with various options:
- Development/Production database selection
- Compressed/uncompressed backup options
- Custom backup paths

### `restore-database.bat`
Restores database from backup files:
- Lists available backups
- Development/Production target selection
- Automatic backup before restore

### `repair-database.bat`
Repairs and optimizes database:
- Full repair operations
- Individual operation selection
- Integrity checks and optimization

### `migrate-database.bat`
Manages database migrations:
- Run pending migrations
- Create new migrations
- Rollback operations
- Status monitoring

## Advanced Usage (Node.js Scripts)

### Backup Script

**File**: `scripts/backup-database.js`

**Usage**:
```bash
node scripts/backup-database.js [options]
```

**Options**:
- `--production` - Backup production database instead of development
- `--compress` - Compress the backup file (gzip)
- `--output <path>` - Custom output path for backup
- `--no-timestamp` - Skip timestamp in filename

**Examples**:
```bash
# Backup development database
node scripts/backup-database.js

# Compressed production backup
node scripts/backup-database.js --production --compress

# Custom backup location
node scripts/backup-database.js --output "C:\Backups\pos-backup.sqlite"
```

### Restore Script

**File**: `scripts/restore-database.js`

**Usage**:
```bash
node scripts/restore-database.js <backup-file> [options]
```

**Options**:
- `--production` - Restore to production database instead of development
- `--force` - Override existing database without confirmation
- `--no-backup` - Skip creating backup before restore

**Examples**:
```bash
# Restore to development
node scripts/restore-database.js "backups\backup-2023-12-18.sqlite"

# Force restore to production
node scripts/restore-database.js "backups\backup-2023-12-18.sqlite.gz" --production --force
```

### Repair Script

**File**: `scripts/repair-database.js`

**Usage**:
```bash
node scripts/repair-database.js [options]
```

**Options**:
- `--production` - Repair production database instead of development
- `--no-backup` - Skip backup before repair
- `--integrity` - Run integrity check only
- `--vacuum` - Run VACUUM to optimize database
- `--reindex` - Rebuild indexes
- `--fix-wal` - Fix WAL mode issues
- `--analyze` - Update statistics

**Examples**:
```bash
# Full repair (default)
node scripts/repair-database.js

# Integrity check only
node scripts/repair-database.js --integrity

# Production database vacuum
node scripts/repair-database.js --production --vacuum
```

### Migration Script

**File**: `scripts/migrate-database.js`

**Usage**:
```bash
node scripts/migrate-database.js [command] [options]
```

**Commands**:
- `up` - Run pending migrations (default)
- `down` - Rollback last migration
- `create <name>` - Create new migration file
- `status` - Show migration status
- `reset` - Reset database (DANGEROUS)

**Options**:
- `--production` - Use production database instead of development
- `--no-backup` - Skip backup before migration
- `--force` - Skip confirmation prompts
- `--to <version>` - Migrate to specific version

**Examples**:
```bash
# Run pending migrations
node scripts/migrate-database.js up

# Create new migration
node scripts/migrate-database.js create add_user_avatar

# Show migration status
node scripts/migrate-database.js status

# Rollback last migration
node scripts/migrate-database.js down
```

## Migration File Creation

### Creating New Migrations

1. **Create Migration File**:
   ```bash
   node scripts/migrate-database.js create add_user_avatar
   ```

2. **Edit Migration File** (in `migrations/` folder):
   ```sql
   -- Migration: add_user_avatar
   -- Created: 2023-12-18T10:30:00.000Z
   -- Description: add_user_avatar

   -- UP: Add your migration SQL here
   ALTER TABLE users ADD COLUMN avatar_path TEXT;
   CREATE INDEX IF NOT EXISTS idx_users_avatar ON users(avatar_path);

   -- DOWN: Add rollback SQL here (optional)
   ALTER TABLE users DROP COLUMN avatar_path;
   DROP INDEX IF EXISTS idx_users_avatar;
   ```

3. **Run Migration**:
   ```bash
   node scripts/migrate-database.js up
   ```

### Migration File Naming

- Files are automatically numbered: `0001_add_user_avatar.sql`
- Use descriptive names with underscores
- Keep names under 50 characters
- Use lowercase letters, numbers, and underscores

## Backup Strategies

### Regular Backup Schedule

**Daily Backups**:
```bash
# Compressed daily backup
node scripts/backup-database.js --production --compress
```

**Weekly Full Backups**:
```bash
# Uncompressed weekly backup
node scripts/backup-database.js --production
```

### Backup Retention

- **Daily backups**: Keep 7 days
- **Weekly backups**: Keep 4 weeks
- **Monthly backups**: Keep 12 months

### Offsite Backup

Copy backup files to external storage:
```bash
# Copy to external drive
copy "backups\*.sqlite.gz" "E:\POS-Backups\"

# Copy to cloud storage (manual)
# Upload to Google Drive, OneDrive, etc.
```

## Recovery Procedures

### Database Corruption

1. **Stop Application**: Ensure POS application is not running
2. **Check Integrity**:
   ```bash
   node scripts/repair-database.js --integrity
   ```
3. **Repair if Possible**:
   ```bash
   node scripts/repair-database.js --production
   ```
4. **Restore from Backup** (if repair fails):
   ```bash
   node scripts/restore-database.js "backups\latest-working-backup.sqlite.gz" --production
   ```

### Data Loss Recovery

1. **Identify Last Good Backup**:
   ```bash
   node scripts/migrate-database.js status --production
   ```
2. **Restore Database**:
   ```bash
   node scripts/restore-database.js "backups\backup-before-incident.sqlite" --production
   ```
3. **Run Migrations** (if needed):
   ```bash
   node scripts/migrate-database.js up --production
   ```

## Maintenance Tasks

### Weekly Maintenance

1. **Database Repair**:
   ```bash
   node scripts/repair-database.js --production --vacuum --reindex --analyze
   ```

2. **Backup Creation**:
   ```bash
   node scripts/backup-database.js --production --compress
   ```

### Monthly Maintenance

1. **Full Database Check**:
   ```bash
   node scripts/repair-database.js --production
   ```

2. **Archive Old Backups**:
   - Move backups older than 1 month to archive storage
   - Keep at least 12 monthly backups

## Troubleshooting

### Common Issues

**"Database not found" Error**:
- Check if database file exists in correct location
- Run `scripts/generate-database.js` for initial setup
- Verify file permissions

**Migration Errors**:
- Check migration file syntax
- Verify database connection
- Check for locked database files

**Permission Errors**:
- Run Command Prompt as Administrator
- Check file/folder permissions
- Ensure no other processes are using the database

**Corruption Issues**:
- Run integrity check first
- Use repair script with caution
- Restore from backup if necessary

### Log Files

Check the following locations for error information:
- Console output from scripts
- Application logs (if available)
- Windows Event Viewer (for system-level errors)

### Getting Help

1. **Check Documentation**: This guide covers most scenarios
2. **Review Script Output**: Scripts provide detailed error messages
3. **Check Backups**: Always verify you have recent backups before repairs
4. **Contact Support**: For critical issues, restore from the most recent backup

## Best Practices

### Before Any Operation
1. **Create Backup**: Always backup before repair or migration
2. **Stop Application**: Ensure POS app is not running
3. **Verify Space**: Ensure sufficient disk space for operations
4. **Test First**: Test operations on development database first

### Backup Practices
1. **Regular Schedule**: Set up automated daily backups
2. **Multiple Locations**: Store backups in different locations
3. **Verify Backups**: Test restore procedures periodically
4. **Label Clearly**: Use descriptive backup names

### Migration Practices
1. **Test Thoroughly**: Test migrations on development database
2. **Backup First**: Always backup before applying migrations
3. **Rollback Ready**: Ensure rollback SQL is properly written
4. **Document Changes**: Keep migration descriptions clear

### Security Considerations
1. **Access Control**: Limit database access to authorized personnel
2. **Backup Encryption**: Consider encrypting sensitive backups
3. **Audit Trail**: Log all database operations
4. **Secure Storage**: Store backups in secure locations

## Emergency Procedures

### Complete System Failure

1. **Assess Situation**: Determine extent of damage
2. **Stop Operations**: Prevent further damage
3. **Restore Backup**: Use most recent known-good backup
4. **Verify Data**: Check critical data integrity
5. **Document Incident**: Record what happened and actions taken

### Ransomware Attack

1. **Isolate System**: Disconnect from network immediately
2. **Do Not Pay**: Contact security professionals instead
3. **Restore from Backup**: Use offline backup sources
4. **Update Security**: Patch vulnerabilities
5. **Review Procedures**: Improve security measures

## Appendix

### Database Schema

The POS database contains the following main tables:
- `users` - System users and authentication
- `customers` - Customer information and loyalty
- `products` - Product catalog and inventory
- `orders` - Sales transactions
- `settings` - System configuration
- `categories` - Product categories
- `discounts` - Discount rules
- `translations` - Localization data

### File Extensions

- `.sqlite` - Uncompressed database file
- `.sqlite.gz` - Compressed database file (gzip)
- `.meta.json` - Backup metadata file
- `.sql` - Migration script file

### Command Reference

Quick reference for common commands:

```bash
# Backup
node scripts/backup-database.js --production --compress

# Restore
node scripts/restore-database.js "backup-file.sqlite.gz" --production

# Repair
node scripts/repair-database.js --production --vacuum --reindex

# Migrate
node scripts/migrate-database.js up --production

# Status
node scripts/migrate-database.js status --production
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatible with**: POS System v1.0+
