import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

// Production database path from logs
const dbPath = join(homedir(), 'AppData', 'Roaming', 'opensauce-pos', 'database', 'sqlite.db');

console.log('Inspecting production database at:', dbPath);

try {
    const db = new Database(dbPath);
    
    // Check if orders table exists and its structure
    console.log('\n=== ORDERS TABLE STRUCTURE ===');
    const ordersInfo = db.prepare("PRAGMA table_info(orders)").all();
    console.log('Orders table columns:');
    ordersInfo.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Check if notes column exists
    const hasNotesColumn = ordersInfo.some(col => col.name === 'notes');
    console.log(`\nHas 'notes' column: ${hasNotesColumn ? 'YES' : 'NO'}`);
    
    // Check other tables
    console.log('\n=== ALL TABLES ===');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    tables.forEach(table => {
        console.log(`- ${table.name}`);
    });
    
    // Check migration status
    console.log('\n=== MIGRATION STATUS ===');
    try {
        const migrations = db.prepare("SELECT * FROM __drizzle_migrations ORDER BY created_at").all();
        console.log(`Applied migrations (${migrations.length}):`);
        migrations.forEach(m => {
            console.log(`  ${m.id} (${new Date(m.created_at).toISOString()})`);
        });
    } catch (e) {
        console.log('No migration table found or error accessing it');
    }
    
    // Check orders data
    console.log('\n=== ORDERS DATA ===');
    try {
        const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
        console.log(`Total orders: ${orderCount}`);
        
        if (orderCount > 0) {
            const sampleOrders = db.prepare("SELECT id, customer_id, user_id, total, status, created_at FROM orders LIMIT 3").all();
            console.log('Sample orders:');
            sampleOrders.forEach(order => {
                console.log(`  Order #${order.id}: ${order.total} (${order.status})`);
            });
        }
    } catch (e) {
        console.log('Error querying orders:', e.message);
    }
    
    db.close();
    console.log('\nDatabase inspection completed.');
    
} catch (error) {
    console.error('Error inspecting database:', error.message);
    if (error.code === 'SQLITE_CANTOPEN') {
        console.log('Database file does not exist or cannot be opened.');
    }
}