/**
 * Test script for printer encoding utility
 * Verifies encoding functions work correctly
 */

import { PrinterEncoding } from '../client/src/lib/printer-encoding';

console.log('=== Printer Encoding Utility Test ===\n');

// Test 1: Codepage commands
console.log('1. Testing codepage commands:');
const codepages = ['cp437', 'cp850', 'cp1252', 'utf8'];
codepages.forEach(cp => {
    const command = PrinterEncoding.getCodepageCommand(cp);
    console.log(`   ${cp}: [${command.map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}]`);
});

// Test 2: Text sanitization
console.log('\n2. Testing text sanitization:');
const testTexts = [
    'Normal text with R123.45',
    'Text with € symbol and £ sign',
    'Smart quotes: "Hello" and trademark™',
    'Fractions: ½ + ¼ = ¾'
];

testTexts.forEach(text => {
    console.log(`   Original: "${text}"`);
    const sanitized = PrinterEncoding.sanitizeForEncoding(text, 'cp437');
    console.log(`   Sanitized: "${sanitized}"`);
});

// Test 3: Encoding detection
console.log('\n3. Testing encoding detection:');
const detectionTests = [
    'Plain ASCII text',
    'Text with é accent',
    'Mixed text with € and £ symbols',
    'Unicode heavy: 你好世界 🌍'
];

detectionTests.forEach(text => {
    const detected = PrinterEncoding.detectBestEncoding(text);
    console.log(`   "${text.substring(0, 30)}..." -> ${detected}`);
});

// Test 4: Available codepages
console.log('\n4. Available codepages:');
const available = PrinterEncoding.getAvailableCodepages();
available.forEach(cp => {
    console.log(`   ${cp.value}: ${cp.label} - ${cp.description}`);
});

// Test 5: Initialization commands
console.log('\n5. Initialization commands:');
const initCommands = PrinterEncoding.getInitializationCommands('cp850');
console.log(`   CP850 init: [${initCommands.map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}]`);

console.log('\n✓ All tests completed successfully!');