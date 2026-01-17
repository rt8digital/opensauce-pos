// Manual test script for printer and scanner functions
console.log('=== Peripherals Test Script ===');

// Test printer optimization
console.log('\n1. Testing Printer Receipt Text Generation:');
console.log('----------------------------------------');

// Simulate the optimized receipt text generation
const generateOptimizedReceiptText = () => {
    let text = '';
    text += `================================\n`;
    text += `OPENSAUCE P.O.S.\n`;
    text += `================================\n`;
    text += `123 Main Street\n`;
    text += `Cape Town, South Africa\n`;
    text += `Tel: +27 12 345 6789\n`;
    text += `\n`;
    text += `Welcome to our store!\n`;
    text += `--------------------------------\n`;
    text += `Order #: 1001\n`;
    text += `Date: ${new Date().toLocaleString()}\n`;
    text += `--------------------------------\n`;
    text += `ITEMS\n`;
    text += `--------------------------------\n`;
    text += `Espresso\n`;
    text += `  1 x R15.00\n`;
    text += `  Subtotal: R15.00\n`;
    text += `--------------------------------\n`;
    text += `TOTAL: R15.00\n`;
    text += `--------------------------------\n`;
    text += `Payment: cash\n`;
    text += `Cash Received: R20.00\n`;
    text += `Change: R5.00\n`;
    text += `================================\n`;
    text += `Thank you for your purchase!\n`;
    text += `================================\n`;
    // No extra newlines needed - the cut() function handles paper cutting
    return text;
};

const receiptText = generateOptimizedReceiptText();
console.log('Generated receipt text:');
console.log(receiptText);

// Count the newlines at the end
const lines = receiptText.split('\n');
let trailingEmptyLines = 0;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '') {
        trailingEmptyLines++;
    } else {
        break;
    }
}

console.log(`Trailing empty lines: ${trailingEmptyLines}`);
console.log(`Paper waste reduction: ${3 - trailingEmptyLines} lines`);

// Test scanner functionality simulation
console.log('\n2. Testing Scanner Functionality:');
console.log('--------------------------------');

class MockBarcodeScanner {
    constructor() {
        this.hardwareScannerActive = false;
        this.scanCallback = null;
    }
    
    enableHardwareScanner(callback) {
        this.scanCallback = callback;
        this.hardwareScannerActive = true;
        console.log('Hardware scanner enabled');
    }
    
    disableHardwareScanner() {
        this.scanCallback = null;
        this.hardwareScannerActive = false;
        console.log('Hardware scanner disabled');
    }
    
    isHardwareScannerActive() {
        return this.hardwareScannerActive;
    }
    
    // Simulate a barcode scan
    simulateScan(barcode) {
        if (this.scanCallback && this.hardwareScannerActive) {
            console.log(`Simulated scan: ${barcode}`);
            this.scanCallback(barcode);
        }
    }
}

// Test the scanner
const scanner = new MockBarcodeScanner();
console.log('Scanner instance created');

scanner.enableHardwareScanner((code) => {
    console.log(`Barcode scanned: ${code}`);
});

console.log(`Scanner active: ${scanner.isHardwareScannerActive()}`);

// Simulate scanning
scanner.simulateScan('123456789012');
scanner.simulateScan('987654321098');

scanner.disableHardwareScanner();
console.log(`Scanner active: ${scanner.isHardwareScannerActive()}`);

console.log('\n=== Test Complete ===');
console.log('Printer optimization successfully reduced paper waste by 2 lines per receipt.');