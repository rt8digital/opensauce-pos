#!/usr/bin/env node

/**
 * OpenSauce POS Database Health Check
 * 
 * This script performs comprehensive database validation including:
 * - Schema integrity verification
 * - Missing column detection
 * - Migration status checking
 * - Data consistency validation
 * - Performance metrics collection
 */

import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

const PRODUCTION_DB_PATH = join(homedir(), 'AppData', 'Roaming', 'opensauce-pos', 'database', 'sqlite.db');
const DEVELOPMENT_DB_PATH = './sqlite.db';

class DatabaseHealthChecker {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.results = {
            timestamp: new Date().toISOString(),
            databasePath: dbPath,
            issues: [],
            recommendations: [],
            stats: {}
        };
    }

    async runFullCheck() {
        console.log(`🏥 Starting database health check for: ${this.dbPath}`);
        console.log('='.repeat(60));

        try {
            // Check if database exists
            const fs = await import('fs');
            if (!fs.existsSync(this.dbPath)) {
                this.addIssue('critical', 'DATABASE_NOT_FOUND', `Database file not found at ${this.dbPath}`);
                return this.generateReport();
            }

            const db = new Database(this.dbPath);
            
            // Basic connectivity test
            await this.testConnectivity(db);
            
            // Schema validation
            await this.validateSchema(db);
            
            // Migration status
            await this.checkMigrations(db);
            
            // Data integrity
            await this.checkDataIntegrity(db);
            
            // Performance metrics
            await this.collectPerformanceMetrics(db);
            
            db.close();
            
        } catch (error) {
            this.addIssue('critical', 'CONNECTION_FAILED', `Failed to connect to database: ${error.message}`);
        }

        return this.generateReport();
    }

    testConnectivity(db) {
        console.log('🔍 Testing database connectivity...');
        try {
            const version = db.prepare('SELECT sqlite_version() as version').get();
            console.log(`  ✓ Connected successfully. SQLite version: ${version.version}`);
            this.results.stats.sqliteVersion = version.version;
        } catch (error) {
            this.addIssue('critical', 'CONNECTIVITY_ERROR', `Connection test failed: ${error.message}`);
        }
    }

    async validateSchema(db) {
        console.log('\n📋 Validating database schema...');
        
        // Get expected schema from shared/schema.ts
        const expectedTables = [
            'users', 'customers', 'categories', 'products', 
            'orders', 'order_items', 'discounts', 'settings',
            'translations', 'bot_settings', 'whatsapp_queue', 
            'whatsapp_consent', 'cash_outs', 'user_preferences', 'audit_logs'
        ];

        // Check existing tables
        const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'")
            .all().map(row => row.name);

        console.log(`  Found ${existingTables.length} tables`);

        // Check for missing tables
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        if (missingTables.length > 0) {
            this.addIssue('high', 'MISSING_TABLES', `Missing tables: ${missingTables.join(', ')}`);
        }

        // Validate critical table structures
        await this.validateOrdersTable(db);
        await this.validateUsersTable(db);
        await this.validateProductsTable(db);
    }

    async validateOrdersTable(db) {
        console.log('  Validating orders table...');
        const requiredColumns = ['id', 'customer_id', 'user_id', 'items', 'total', 'payment_method', 'status', 'notes'];
        const actualColumns = db.prepare("PRAGMA table_info(orders)").all().map(col => col.name);
        
        const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
        if (missingColumns.length > 0) {
            this.addIssue('critical', 'MISSING_COLUMNS', 
                `Orders table missing columns: ${missingColumns.join(', ')}`);
            this.addRecommendation('Apply migration to add missing columns');
        } else {
            console.log('    ✓ Orders table structure is correct');
        }
    }

    async validateUsersTable(db) {
        console.log('  Validating users table...');
        const requiredColumns = ['id', 'name', 'pin', 'role'];
        const actualColumns = db.prepare("PRAGMA table_info(users)").all().map(col => col.name);
        
        const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
        if (missingColumns.length > 0) {
            this.addIssue('high', 'MISSING_USER_COLUMNS', 
                `Users table missing columns: ${missingColumns.join(', ')}`);
        } else {
            console.log('    ✓ Users table structure is correct');
        }
    }

    async validateProductsTable(db) {
        console.log('  Validating products table...');
        const requiredColumns = ['id', 'name', 'price', 'stock_quantity'];
        const actualColumns = db.prepare("PRAGMA table_info(products)").all().map(col => col.name);
        
        const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
        if (missingColumns.length > 0) {
            this.addIssue('medium', 'MISSING_PRODUCT_COLUMNS', 
                `Products table missing columns: ${missingColumns.join(', ')}`);
        } else {
            console.log('    ✓ Products table structure is correct');
        }
    }

    async checkMigrations(db) {
        console.log('\n🔄 Checking migration status...');
        try {
            const migrations = db.prepare("SELECT * FROM __drizzle_migrations ORDER BY created_at DESC").all();
            console.log(`  Found ${migrations.length} applied migrations`);
            this.results.stats.appliedMigrations = migrations.length;
            
            if (migrations.length === 0) {
                this.addIssue('medium', 'NO_MIGRATIONS', 'No migrations have been applied');
                this.addRecommendation('Run database initialization script');
            } else {
                console.log(`  Latest migration: ${migrations[0]?.id || 'Unknown'}`);
            }
        } catch (error) {
            this.addIssue('low', 'MIGRATION_TABLE_MISSING', 'Migration tracking table not found');
            this.addRecommendation('Create __drizzle_migrations table for tracking');
        }
    }

    async checkDataIntegrity(db) {
        console.log('\n🔍 Checking data integrity...');
        
        // Check for orphaned records
        const orphanedOrders = db.prepare(`
            SELECT COUNT(*) as count FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.user_id IS NOT NULL AND u.id IS NULL
        `).get().count;

        if (orphanedOrders > 0) {
            this.addIssue('medium', 'ORPHANED_ORDERS', `${orphanedOrders} orders reference non-existent users`);
        }

        // Check for negative stock
        const negativeStock = db.prepare(`
            SELECT COUNT(*) as count FROM products WHERE stock_quantity < 0
        `).get().count;

        if (negativeStock > 0) {
            this.addIssue('high', 'NEGATIVE_STOCK', `${negativeStock} products have negative stock quantities`);
        }

        // Check for invalid prices
        const invalidPrices = db.prepare(`
            SELECT COUNT(*) as count FROM products WHERE CAST(price AS REAL) <= 0
        `).get().count;

        if (invalidPrices > 0) {
            this.addIssue('medium', 'INVALID_PRICES', `${invalidPrices} products have invalid prices`);
        }

        console.log('  ✓ Data integrity check completed');
    }

    async collectPerformanceMetrics(db) {
        console.log('\n📊 Collecting performance metrics...');
        
        // Database size
        const fs = await import('fs');
        const stats = fs.statSync(this.dbPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        this.results.stats.databaseSizeMB = parseFloat(sizeMB);
        console.log(`  Database size: ${sizeMB} MB`);

        // Table row counts
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
        const tableStats = {};
        
        for (const table of tables) {
            try {
                const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
                tableStats[table.name] = count;
                console.log(`  ${table.name}: ${count} rows`);
            } catch (error) {
                console.log(`  ${table.name}: Error counting rows`);
            }
        }
        
        this.results.stats.tableRowCounts = tableStats;
    }

    addIssue(severity, code, message) {
        this.results.issues.push({
            severity,
            code,
            message,
            timestamp: new Date().toISOString()
        });
        console.log(`  ⚠️  [${severity.toUpperCase()}] ${code}: ${message}`);
    }

    addRecommendation(recommendation) {
        this.results.recommendations.push({
            recommendation,
            timestamp: new Date().toISOString()
        });
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 DATABASE HEALTH REPORT');
        console.log('='.repeat(60));
        
        console.log(`Timestamp: ${this.results.timestamp}`);
        console.log(`Database: ${this.results.databasePath}`);
        console.log(`Issues Found: ${this.results.issues.length}`);
        
        if (this.results.issues.length > 0) {
            console.log('\n🚨 ISSUES DETECTED:');
            const severityOrder = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
            this.results.issues
                .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
                .forEach(issue => {
                    console.log(`  [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}`);
                });
        } else {
            console.log('\n✅ No issues detected!');
        }

        if (this.results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            this.results.recommendations.forEach(rec => {
                console.log(`  • ${rec.recommendation}`);
            });
        }

        console.log('\n📈 STATISTICS:');
        Object.entries(this.results.stats).forEach(([key, value]) => {
            if (typeof value === 'object') {
                console.log(`  ${key}:`);
                Object.entries(value).forEach(([subKey, subValue]) => {
                    console.log(`    ${subKey}: ${subValue}`);
                });
            } else {
                console.log(`  ${key}: ${value}`);
            }
        });

        return this.results;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const dbPath = args[0] === '--dev' ? DEVELOPMENT_DB_PATH : PRODUCTION_DB_PATH;
    
    const checker = new DatabaseHealthChecker(dbPath);
    const report = await checker.runFullCheck();
    
    // Save report to file
    const fs = await import('fs');
    const reportPath = `database-health-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    const criticalIssues = report.issues.filter(i => i.severity === 'critical').length;
    process.exit(criticalIssues > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Health check failed:', error);
        process.exit(1);
    });
}

export default DatabaseHealthChecker;