import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

// Production database path
const dbPath = join(homedir(), 'AppData', 'Roaming', 'opensauce-pos', 'database', 'sqlite.db');
const migrationPath = './migrations/0019_add_notes_column_to_orders.sql';

console.log('Applying migration to fix missing notes column...');
console.log('Database path:', dbPath);
console.log('Migration file:', migrationPath);

try {
    // Check if database exists
    const fs = await import('fs');
    if (!fs.existsSync(dbPath)) {
        console.error('ERROR: Production database not found at:', dbPath);
        console.log('Please ensure the application has been run at least once to create the database.');
        process.exit(1);
    }

    const db = new Database(dbPath);
    
    // Check current orders table structure
    console.log('\n=== CURRENT ORDERS TABLE STRUCTURE ===');
    const currentColumns = db.prepare("PRAGMA table_info(orders)").all();
    console.log('Current columns:');
    currentColumns.forEach(col => {
        console.log(`  ${col.name}: ${col.type}`);
    });
    
    // Check if notes column already exists
    const hasNotesColumn = currentColumns.some(col => col.name === 'notes');
    if (hasNotesColumn) {
        console.log('\n✓ Notes column already exists. Nothing to do.');
        db.close();
        process.exit(0);
    }
    
    console.log('\n✗ Notes column missing. Applying migration...');
    
    // Read and apply migration
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Executing:', migrationSql.trim());
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSql.split('--> statement-breakpoint');
    
    db.transaction(() => {
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    db.exec(trimmed);
                    console.log('  ✓ Statement executed successfully');
                } catch (e) {
                    if (e.message.includes('duplicate column name')) {
                        console.log('  ℹ Column already exists (ignoring error)');
                    } else {
                        throw e;
                    }
                }
            }
        }
    })();
    
    // Verify the fix
    console.log('\n=== VERIFICATION ===');
    const updatedColumns = db.prepare("PRAGMA table_info(orders)").all();
    const notesColumnExists = updatedColumns.some(col => col.name === 'notes');
    
    if (notesColumnExists) {
        console.log('✓ SUCCESS: Notes column has been added to orders table');
        console.log('Orders table now has', updatedColumns.length, 'columns:');
        updatedColumns.forEach(col => {
            console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
        });
    } else {
        console.log('✗ FAILED: Notes column was not added');
        process.exit(1);
    }
    
    // Test order creation (basic test)
    console.log('\n=== TESTING ORDER CREATION ===');
    try {
        // Test inserting an order with notes
        const stmt = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, notes, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const orderId = stmt.run(
            null, // customer_id
            1,    // user_id  
            '[]', // items
            '0',  // total
            'cash', // payment_method
            'pos',  // source
            'pending', // status
            'Test order with notes column', // notes
            Math.floor(Date.now() / 1000) // created_at
        ).lastInsertRowid;
        
        console.log('✓ Successfully created test order with notes column');
        console.log('  Order ID:', orderId);
        
        // Clean up test order
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
        console.log('✓ Test order cleaned up');
        
    } catch (error) {
        console.error('✗ FAILED: Could not create order with notes column');
        console.error('  Error:', error.message);
        process.exit(1);
    }
    
    db.close();
    console.log('\n🎉 Migration completed successfully!');
    console.log('The orders table now includes the notes column.');
    console.log('Order creation functionality should now work properly.');
    
} catch (error) {
    console.error('ERROR applying migration:', error.message);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
}