#!/usr/bin/env node

import os from 'os';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createGzip, createDeflate } from 'zlib';
import { pipeline } from 'stream/promises';

/**
 * Database Backup Script
 * 
 * This script creates backups of the SQLite database with compression options.
 * It can backup both development and production databases.
 * 
 * Usage:
 * node scripts/backup-database.js [options]
 * 
 * Options:
 * --production    Backup production database instead of development
 * --compress      Compress the backup file (gzip)
 * --output <path> Custom output path for backup
 * --timestamp     Add timestamp to filename (default)
 */

console.log('🗄️  Database Backup Utility');

// Parse command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const useCompression = args.includes('--compress');
const addTimestamp = !args.includes('--no-timestamp');

// Get output path
const outputIndex = args.indexOf('--output');
let customOutputPath = null;
if (outputIndex !== -1 && args[outputIndex + 1]) {
    customOutputPath = args[outputIndex + 1];
}

// Determine database path
let dbPath;
if (isProduction) {
    // Check multiple locations for production database
    const installDir = path.dirname(process.execPath);
    const standardPath = path.join(installDir, 'database', 'sqlite.db');
    const rootPath = path.join(process.cwd(), 'database', 'sqlite.db');
    const resourcePath = path.join(process.resourcesPath, 'database', 'sqlite.db');
    const userDataPath = process.env.USER_DATA_PATH || path.join(os.homedir(), '.pos-app', 'sqlite.db');

    if (fs.existsSync(standardPath)) {
        dbPath = standardPath;
    } else if (fs.existsSync(rootPath)) {
        dbPath = rootPath;
    } else if (fs.existsSync(resourcePath)) {
        dbPath = resourcePath;
    } else {
        dbPath = userDataPath;
    }
} else {
    dbPath = path.join(process.cwd(), 'sqlite.db');
}

console.log(`📍 Database path: ${dbPath}`);

// Check if database exists
if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    process.exit(1);
}

// Generate backup filename
const timestamp = addTimestamp ? new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) : '';
const baseName = `backup-${timestamp || 'latest'}`;

// Determine output directory
const outputDir = customOutputPath ? path.dirname(customOutputPath) : path.join(process.cwd(), 'backups');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created backup directory: ${outputDir}`);
}

// Determine final backup path
let backupPath;
if (customOutputPath) {
    backupPath = customOutputPath;
} else {
    const extension = useCompression ? '.sqlite.gz' : '.sqlite';
    backupPath = path.join(outputDir, `${baseName}${extension}`);
}

console.log(`📦 Creating backup: ${backupPath}`);

try {
    // Get database info before backup
    const db = new Database(dbPath, { readonly: true });

    // Get table info
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📋 Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);

    // Get database size
    const stats = fs.statSync(dbPath);
    console.log(`💾 Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    db.close();

    // Perform backup
    console.log('🔄 Starting backup process...');

    if (useCompression) {
        // Compressed backup using gzip
        const source = fs.createReadStream(dbPath);
        const gzip = createGzip();
        const destination = fs.createWriteStream(backupPath);

        await pipeline(source, gzip, destination);
        console.log('✅ Compressed backup created successfully!');
    } else {
        // Simple file copy
        fs.copyFileSync(dbPath, backupPath);
        console.log('✅ Backup created successfully!');
    }

    // Show backup info
    const backupStats = fs.statSync(backupPath);
    const compressionRatio = useCompression ? ((1 - backupStats.size / stats.size) * 100).toFixed(1) : '0';

    console.log(`📊 Backup Details:`);
    console.log(`   Path: ${backupPath}`);
    console.log(`   Size: ${(backupStats.size / 1024 / 1024).toFixed(2)} MB`);
    if (useCompression) {
        console.log(`   Compression: ${compressionRatio}% reduction`);
    }
    console.log(`   Created: ${new Date().toISOString()}`);

    // Create backup metadata
    const metadataPath = backupPath.replace(/(\.gz)?$/, '.meta.json');
    const metadata = {
        originalDbPath: dbPath,
        backupPath: backupPath,
        createdAt: new Date().toISOString(),
        dbSize: stats.size,
        backupSize: backupStats.size,
        compressionRatio: compressionRatio,
        tables: tables.map(t => t.name),
        isProduction: isProduction,
        version: '1.0.0'
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Metadata saved: ${metadataPath}`);

} catch (error) {
    console.error('❌ Backup failed:', error.message);

    // Clean up partial backup if it exists
    if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        console.log('🧹 Cleaned up partial backup file');
    }

    process.exit(1);
}

console.log('🎉 Backup completed successfully!');
