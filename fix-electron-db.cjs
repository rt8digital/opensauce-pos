#!/usr/bin/env node

/**
 * Robust Electron Database Fix Script
 * Fixes common Electron + better-sqlite3 compatibility issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.cwd();
const NODE_MODULES_PATH = path.join(PROJECT_ROOT, 'node_modules');
const BETTER_SQLITE3_PATH = path.join(NODE_MODULES_PATH, 'better-sqlite3');

console.log('🚀 Starting Electron Database Fix Process...\n');

// Utility functions
const runCommand = (command, description) => {
  console.log(`🔧 ${description}`);
  console.log(`   Command: ${command}\n`);
  
  try {
    const result = execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_arch: process.arch,
        npm_config_platform: process.platform,
        npm_config_target_arch: process.arch,
        npm_config_runtime: 'electron',
        npm_config_disturl: 'https://electronjs.org/headers',
        npm_config_build_from_source: 'true'
      }
    });
    console.log(`✅ ${description} - Completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
};

const checkDirectoryExists = (dirPath) => {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
};

const checkFileExists = (filePath) => {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
};

// Main fix process
async function fixElectronDatabase() {
  console.log('🔍 Diagnosing current state...\n');
  
  // Check if better-sqlite3 exists
  if (!checkDirectoryExists(BETTER_SQLITE3_PATH)) {
    console.log('📦 better-sqlite3 not found, installing...');
    runCommand('npm install better-sqlite3 --save', 'Installing better-sqlite3');
  }
  
  // Clean node_modules cache
  console.log('🧹 Cleaning npm cache...');
  runCommand('npm cache clean --force', 'Cleaning npm cache');
  
  // Remove problematic build directories
  const buildDirs = [
    path.join(BETTER_SQLITE3_PATH, 'build'),
    path.join(BETTER_SQLITE3_PATH, 'prebuilds')
  ];
  
  buildDirs.forEach(dir => {
    if (checkDirectoryExists(dir)) {
      console.log(`🗑️  Removing ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  
  // Rebuild better-sqlite3 for Electron
  console.log('🔨 Rebuilding better-sqlite3 for Electron...');
  
  // Method 1: Using electron-rebuild
  const electronRebuildSuccess = runCommand(
    'npx electron-rebuild -f -w better-sqlite3',
    'Rebuilding better-sqlite3 with electron-rebuild'
  );
  
  if (!electronRebuildSuccess) {
    // Method 2: Manual rebuild
    console.log('🔄 Trying manual rebuild method...');
    runCommand(
      'npm rebuild better-sqlite3 --runtime=electron --target=$(npx electron --version) --disturl=https://electronjs.org/headers --abi=140',
      'Manually rebuilding better-sqlite3'
    );
  }
  
  // Alternative: Install prebuilt binaries
  console.log('📥 Installing prebuilt binaries...');
  runCommand(
    'npm install better-sqlite3 --build-from-source=false',
    'Installing prebuilt binaries'
  );
  
  // Verify installation
  console.log('🧪 Verifying installation...');
  const verifySuccess = runCommand(
    'node -e "require(\'better-sqlite3\'); console.log(\'✅ better-sqlite3 loaded successfully\')"',
    'Testing better-sqlite3 import'
  );
  
  if (verifySuccess) {
    console.log('🎉 Database fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev:electron');
    console.log('2. The application should now start with database support');
  } else {
    console.log('⚠️  Verification failed. Additional troubleshooting may be needed.');
    console.log('\n🛠️  Manual troubleshooting steps:');
    console.log('1. Delete node_modules folder completely');
    console.log('2. Run: npm install');
    console.log('3. Run: npx electron-rebuild');
    console.log('4. Try: npm run dev:electron again');
  }
}

// Run the fix
fixElectronDatabase().catch(error => {
  console.error('💥 Script failed with error:', error);
  process.exit(1);
});