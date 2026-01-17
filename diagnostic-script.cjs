#!/usr/bin/env node

/**
 * OpenSauce POS Diagnostic Script
 * Run this script on the client's system to gather diagnostic information
 * Usage: node diagnostic-script.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(50));
console.log('OpenSauce POS - Diagnostic Report');
console.log('='.repeat(50));
console.log(`Generated: ${new Date().toISOString()}`);
console.log('');

console.log('1. SYSTEM INFORMATION');
console.log('-'.repeat(30));
console.log(`Platform: ${os.platform()}`);
console.log(`Release: ${os.release()}`);
console.log(`Version: ${os.version ? os.version() : 'N/A'}`);
console.log(`Architecture: ${os.arch()}`);
console.log(`Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
console.log(`Free Memory: ${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`);
console.log(`CPU Model: ${os.cpus()[0]?.model || 'Unknown'}`);
console.log(`CPU Cores: ${os.cpus().length}`);
console.log(`Username: ${os.userInfo().username}`);
console.log('');

console.log('2. NODE.JS INFORMATION');
console.log('-'.repeat(30));
console.log(`Node.js Version: ${process.version}`);
console.log(`Process PID: ${process.pid}`);
console.log(`Process Platform: ${process.platform}`);
console.log(`Process Architecture: ${process.arch}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log(`Executable Path: ${process.execPath}`);
console.log('');

console.log('3. FILE SYSTEM CHECKS');
console.log('-'.repeat(30));

// Check common directories
const checkPaths = [
    process.cwd(),
    path.join(process.cwd(), 'database'),
    path.join(process.cwd(), 'sqlite.db'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'OpenSauce POS'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'OpenSauce POS', 'database'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'OpenSauce POS', 'database', 'sqlite.db')
];

checkPaths.forEach(checkPath => {
    try {
        const exists = fs.existsSync(checkPath);
        const stats = exists ? fs.statSync(checkPath) : null;
        const type = stats ? (stats.isDirectory() ? 'DIR' : 'FILE') : 'N/A';
        const writable = stats ? 'W' : 'N/A';
        console.log(`${checkPath}: ${exists ? 'EXISTS' : 'MISSING'} (${type})`);
    } catch (error) {
        console.log(`${checkPath}: ERROR - ${error.message}`);
    }
});
console.log('');

console.log('4. SQLITE CHECK');
console.log('-'.repeat(30));
try {
    const sqlite3 = require('better-sqlite3');
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'OpenSauce POS', 'database', 'sqlite.db');

    console.log(`better-sqlite3 version: ${sqlite3?.version || 'Unknown'}`);

    // Try to open database
    try {
        const db = new sqlite3(dbPath, { readonly: true });
        console.log('Database opened successfully');

        // Try a simple query
        const result = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type = "table"').get();
        console.log(`Tables found: ${result.count}`);

        db.close();
        console.log('Database closed successfully');
    } catch (dbError) {
        console.log(`Database error: ${dbError.message}`);
        console.log(`Error code: ${dbError.code || 'N/A'}`);
        console.log(`Error errno: ${dbError.errno || 'N/A'}`);
    }
} catch (sqliteError) {
    console.log(`better-sqlite3 not available: ${sqliteError.message}`);
}
console.log('');

console.log('5. PRINTING LIBRARIES CHECK');
console.log('-'.repeat(30));
const printLibs = ['escpos', 'escpos-usb', 'escpos-network'];

printLibs.forEach(lib => {
    try {
        require.resolve(lib);
        console.log(`${lib}: AVAILABLE`);
    } catch (error) {
        console.log(`${lib}: NOT FOUND`);
    }
});
console.log('');

console.log('6. NETWORK CHECK');
console.log('-'.repeat(30));
// Simple network connectivity test
const http = require('http');

const testConnection = (url, timeout = 5000) => {
    return new Promise((resolve) => {
        const req = http.get(url, { timeout }, (res) => {
            resolve(`SUCCESS (${res.statusCode})`);
        });

        req.on('error', (err) => {
            resolve(`FAILED (${err.code})`);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve('TIMEOUT');
        });
    });
};

(async () => {
    console.log('Testing connectivity...');
    const result = await testConnection('http://localhost:5001/api/health');
    console.log(`Local API (port 5001): ${result}`);

    console.log('');
    console.log('='.repeat(50));
    console.log('END OF DIAGNOSTIC REPORT');
    console.log('='.repeat(50));
    console.log('');
    console.log('Please send this output to support for analysis.');
})();