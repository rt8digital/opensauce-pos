import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

try {
    // Get all columns from settings table
    const columns = db.prepare("SELECT name FROM pragma_table_info('settings') ORDER BY name").all();
    console.log('Current columns in settings table:', columns.map(c => c.name));

    // Check for specific missing columns
    const expectedColumns = ['printer_type', 'whatsapp_enabled', 'whatsapp_phone_number', 'whatsapp_api_key', 'whatsapp_business_id', 'whatsapp_send_receipts'];
    const existingColumns = columns.map(c => c.name);

    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    const existingExpected = expectedColumns.filter(col => existingColumns.includes(col));

    console.log('\nExpected columns:', expectedColumns);
    console.log('Already exist:', existingExpected);
    console.log('Missing:', missingColumns);

} catch (error) {
    console.error('Error:', error);
} finally {
    db.close();
}
