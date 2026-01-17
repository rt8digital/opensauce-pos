/**
 * Enhanced Test Receipt Generator
 * Demonstrates printer encoding capabilities with various character sets
 */

export interface TestReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  dateTime: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  subtotal: string;
  tax?: string;
  total: string;
  paymentMethod: string;
  footer?: string;
}

export class TestReceiptGenerator {
  static generateTestReceipt(data: TestReceiptData): string {
    const lines: string[] = [];
    
    // Header
    lines.push(this.centerText(data.storeName, 42));
    if (data.storeAddress) {
      lines.push(this.centerText(data.storeAddress, 42));
    }
    if (data.storePhone) {
      lines.push(this.centerText(`Tel: ${data.storePhone}`, 42));
    }
    lines.push('');
    lines.push(this.centerText('TEST RECEIPT - ENCODING DEMO', 42));
    lines.push(this.drawLine(42));
    
    // Order info
    lines.push(`Order #: ${data.orderId}`);
    lines.push(`Date: ${data.dateTime}`);
    lines.push(this.drawLine(42));
    
    // Items header
    lines.push('ITEM                    QTY    PRICE    TOTAL');
    lines.push(this.drawLine(42));
    
    // Items
    data.items.forEach(item => {
      const itemLine = this.formatItemLine(item.name, item.quantity, item.price, item.total);
      lines.push(itemLine);
    });
    
    lines.push(this.drawLine(42));
    
    // Totals
    lines.push(this.formatTotalLine('Subtotal:', data.subtotal));
    if (data.tax) {
      lines.push(this.formatTotalLine('Tax:', data.tax));
    }
    lines.push(this.formatTotalLine('TOTAL:', data.total, true));
    lines.push(this.drawLine(42));
    
    // Payment
    lines.push(`Payment Method: ${data.paymentMethod}`);
    lines.push('');
    
    // Footer with special characters to test encoding
    lines.push(this.centerText('Encoding Test Characters:', 42));
    lines.push(this.centerText('Currency: R EUR GBP JPY', 42));
    lines.push(this.centerText('Symbols: (TM) (R) (C)', 42));
    lines.push(this.centerText('Fractions: 1/2 1/4 3/4', 42));
    lines.push('');
    lines.push(this.centerText('Thank you for your business!', 42));
    if (data.footer) {
      lines.push(this.centerText(data.footer, 42));
    }
    
    lines.push('');
    lines.push('');
    lines.push('');
    
    return lines.join('\n');
  }

  private static centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private static drawLine(width: number): string {
    return '-'.repeat(width);
  }

  private static formatItemLine(name: string, qty: number, price: string, total: string): string {
    // Truncate name if too long
    const maxNameLength = 20;
    const displayName = name.length > maxNameLength 
      ? name.substring(0, maxNameLength - 3) + '...'
      : name.padEnd(maxNameLength);
    
    const qtyStr = qty.toString().padStart(3);
    const priceStr = price.padStart(8);
    const totalStr = total.padStart(9);
    
    return `${displayName} ${qtyStr} ${priceStr} ${totalStr}`;
  }

  private static formatTotalLine(label: string, amount: string, highlight = false): string {
    const labelWidth = 30;
    const amountWidth = 12;
    
    const formattedLabel = label.padEnd(labelWidth);
    const formattedAmount = amount.padStart(amountWidth);
    
    const line = `${formattedLabel}${formattedAmount}`;
    return highlight ? `*${line}*` : line;
  }

  static getDefaultTestData(): TestReceiptData {
    return {
      storeName: 'OpenSauce P.O.S.',
      storeAddress: '123 Main Street, City Center',
      storePhone: '(555) 123-4567',
      dateTime: new Date().toLocaleString(),
      orderId: 'TEST-' + Date.now().toString().slice(-6),
      items: [
        { name: 'Beef Burger', quantity: 2, price: 'R85.00', total: 'R170.00' },
        { name: 'Cheese Burger', quantity: 1, price: 'R95.00', total: 'R95.00' },
        { name: 'French Fries', quantity: 1, price: 'R45.00', total: 'R45.00' },
        { name: 'Soft Drink', quantity: 3, price: 'R25.00', total: 'R75.00' }
      ],
      subtotal: 'R385.00',
      tax: 'R54.00',
      total: 'R439.00',
      paymentMethod: 'Cash',
      footer: 'Visit us online!'
    };
  }
}