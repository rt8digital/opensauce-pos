import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

const dbPath = join(homedir(), 'AppData', 'Roaming', 'opensauce-pos', 'database', 'sqlite.db');

console.log('🔍 OpenSauce POS Database Quick Check');
console.log('=====================================');

try {
    // Check if database exists
    const fs = await import('fs');
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Database not found at:', dbPath);
        console.log('💡 Run the application once to create the database');
        process.exit(1);
    }

    const db = new Database(dbPath);
    console.log('✅ Database connected successfully');

    // Check orders table structure
    console.log('\n📋 Checking orders table...');
    const ordersColumns = db.prepare("PRAGMA table_info(orders)").all();
    const columnNames = ordersColumns.map(c => c.name);
    
    console.log('   Columns found:', columnNames.join(', '));
    
    if (columnNames.includes('notes')) {
        console.log('✅ Notes column present - order creation should work');
    } else {
        console.log('❌ CRITICAL: Missing notes column - order creation will fail');
        console.log('💡 Run: node scripts/fix-notes-column.js');
        process.exit(1);
    }

    // Check migration status
    console.log('\n🔄 Checking migrations...');
    try {
        const migrations = db.prepare("SELECT COUNT(*) as count FROM __drizzle_migrations").get().count;
        console.log(`   Applied migrations: ${migrations}`);
    } catch (e) {
        console.log('   ⚠️  No migration tracking table found');
    }

    // Basic data counts
    console.log('\n📊 Data summary:');
    const tables = ['users', 'customers', 'products', 'orders'];
    tables.forEach(table => {
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            console.log(`   ${table}: ${count} records`);
        } catch (e) {
            console.log(`   ${table}: Error querying`);
        }
    });

    db.close();
    console.log('\n🎉 Database check completed - all systems operational!');

} catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
}