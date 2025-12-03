import { jsPDF } from 'jspdf';
import type { Order, OrderItemWithName } from '@shared/schema';

// Conditional import for ESC/POS - only available in Electron environment
let escpos: any;
let USB: any;
let Network: any;

if (typeof window !== 'undefined' && (window as any).require) {
  try {
    escpos = (window as any).require('escpos');
    USB = (window as any).require('escpos-usb');
    Network = (window as any).require('escpos-network');
  } catch (error) {
    console.warn('ESC/POS libraries not available:', error);
  }
}

export class ReceiptPrinter {
  private static instance: ReceiptPrinter;
  private isConnected: boolean = false;

  private constructor() { }

  static getInstance(): ReceiptPrinter {
    if (!ReceiptPrinter.instance) {
      ReceiptPrinter.instance = new ReceiptPrinter();
    }
    return ReceiptPrinter.instance;
  }

  /**
   * Print receipt using traditional PDF method
   */
  static async print(order: Order) {
    // Create PDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200] // Standard receipt width
    });

    // Header
    doc.setFontSize(12);
    doc.text('STORE RECEIPT', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(new Date(order.createdAt || new Date()).toLocaleString(), 40, 15, { align: 'center' });

    // Items
    let y = 25;
    doc.setFontSize(8);
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    (items as OrderItemWithName[]).forEach(item => {
      doc.text(`${item.quantity}x ${item.productName}`, 10, y);
      doc.text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 70, y, { align: 'right' });
      y += 5;
    });

    // Total
    doc.setFontSize(10);
    doc.text('Total:', 10, y + 10);
    doc.text(`$${Number(order.total).toFixed(2)}`, 70, y + 10, { align: 'right' });

    // Open print dialog
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url);

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      };
    }
  }

  /**
   * Print receipt using ESC/POS commands to thermal printer
   * @param order - The order to print
   * @param printerType - Type of printer connection ('usb', 'network', 'bluetooth')
   * @param printerAddress - Address of the printer (IP for network, path for USB)
   */
  /**
   * Print receipt using ESC/POS commands to thermal printer
   * @param order - The order to print
   * @param printerType - Type of printer connection ('usb', 'network', 'bluetooth')
   * @param printerAddress - Address of the printer (IP for network, path for USB, deviceId for Bluetooth)
   */
  async printEscPos(order: Order, printerType: 'usb' | 'network' | 'bluetooth' = 'usb', printerAddress?: string): Promise<boolean> {
    try {
      // Handle Capacitor Bluetooth printing
      if (printerType === 'bluetooth' && printerAddress) {
        const { bluetoothPrinterService } = await import('../services/bluetooth-printer-service');

        // Generate receipt text
        let text = `STORE RECEIPT\n`;
        text += `${new Date(order.createdAt || new Date()).toLocaleString()}\n`;
        text += `--------------------------------\n`;

        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        (items as OrderItemWithName[]).forEach(item => {
          text += `${item.quantity}x ${item.productName} $${(Number(item.price) * item.quantity).toFixed(2)}\n`;
        });

        text += `--------------------------------\n`;
        text += `Total: $${Number(order.total).toFixed(2)}\n`;
        text += `Thank you for your purchase!\n\n\n`;

        const data = bluetoothPrinterService.generateReceiptData(text);
        return await bluetoothPrinterService.print(printerAddress, data);
      }

      if (!escpos) {
        console.warn('ESC/POS not available in this environment');
        // Fallback to PDF printing if not bluetooth
        if (printerType !== 'bluetooth') {
          ReceiptPrinter.print(order);
        }
        return false;
      }

      let device;
      let printer;

      switch (printerType) {
        case 'usb':
          // Find and use USB printer
          const devices = await USB.getDevices();
          if (devices.length > 0) {
            device = await USB.findById(devices[0].vendorId, devices[0].productId);
          } else {
            device = new USB();
          }
          break;

        case 'network':
          if (!printerAddress) {
            throw new Error('Network printer requires IP address');
          }
          device = new Network(printerAddress.split(':')[0], parseInt(printerAddress.split(':')[1]) || 9100);
          break;

        default:
          throw new Error(`Unsupported printer type: ${printerType}`);
      }

      printer = new escpos.Printer(device);

      // Connect to device
      await new Promise((resolve, reject) => {
        device.open((err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });

      // Print receipt
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('STORE RECEIPT')
        .style('normal')
        .size(0, 0)
        .text(new Date(order.createdAt || new Date()).toLocaleString())
        .text('--------------------------------')
        .align('lt');

      // Print items
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      (items as OrderItemWithName[]).forEach(item => {
        printer
          .text(`${item.quantity}x ${item.productName}`)
          .align('rt')
          .text(`$${(Number(item.price) * item.quantity).toFixed(2)}`)
          .align('lt');
      });

      printer
        .text('--------------------------------')
        .align('rt')
        .size(1, 1)
        .text(`Total: $${Number(order.total).toFixed(2)}`)
        .size(0, 0)
        .align('ct')
        .text('Thank you for your purchase!')
        .cut()
        .close();

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error printing with ESC/POS:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Test printer connection
   */
  async testPrinter(printerType: 'usb' | 'network' | 'bluetooth' = 'usb', printerAddress?: string): Promise<boolean> {
    try {
      if (!escpos) {
        console.warn('ESC/POS not available in this environment');
        return false;
      }

      let device;

      switch (printerType) {
        case 'usb':
          const devices = await USB.getDevices();
          return devices.length > 0;

        case 'network':
          if (!printerAddress) {
            return false;
          }
          // Simple connectivity test would go here
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error testing printer:', error);
      return false;
    }
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<boolean> {
    return this.isConnected;
  }
}