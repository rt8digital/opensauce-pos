import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);
const reportFile = 'settings-db-report.txt';

let output = 'Checking settings table columns...\n';
const columns = db.prepare("PRAGMA table_info(settings)").all();
output += 'Columns in settings table:\n';
columns.forEach(col => {
    output += `- ${col.name} (${col.type})\n`;
});

const settings = db.prepare("SELECT * FROM settings LIMIT 1").get();
output += '\nCurrent settings data (keys):\n';
if (settings) {
    output += JSON.stringify(Object.keys(settings), null, 2);
    output += '\n\nFull settings data:\n';
    output += JSON.stringify(settings, null, 2);
} else {
    output += 'No settings found';
}

fs.writeFileSync(reportFile, output);
console.log(`Report written to ${reportFile}`);
db.close();
process.exit(0);
