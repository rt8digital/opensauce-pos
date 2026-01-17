const fs = require('fs');

console.log('Testing Electron main.cjs loading...');

try {
  // Check if file exists and read basic info
  const stats = fs.statSync('./dist/main.cjs');
  console.log(`✓ main.cjs exists: ${stats.size} bytes`);
  
  // Try to require the module (this will catch syntax errors and dependency issues)
  console.log('Attempting to require main.cjs...');
  const mainModule = require('./dist/main.cjs');
  
  console.log('✓ main.cjs loaded successfully!');
  console.log('Exported properties:', Object.keys(mainModule || {}));
  
  // Test specific things that might fail
  if (mainModule && typeof mainModule === 'object') {
    console.log('Module exports object with properties:');
    Object.keys(mainModule).forEach(key => {
      console.log(`  - ${key}: ${typeof mainModule[key]}`);
    });
  }
  
} catch (error) {
  console.error('✗ Error loading main.cjs:');
  console.error('  Message:', error.message);
  console.error('  Stack:', error.stack);
  process.exit(1);
}

console.log('\nTest completed successfully!');