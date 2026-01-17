import { jsPDF } from 'jspdf';
import type { Order, OrderItemWithName } from '../../../shared/types';
import { apiRequest } from './queryClient';
import {
  getFontSizes,
  getSeparatorLength,
  getThermalDivider,
  generateThermalHeader,
  generateThermalFooter,
  getReceiptWidthMM,
  calculateReceiptHeight
} from './receipt-formatter';



const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

if (!isCapacitor) {
  // Only try to load Node modules if we're not using the enhanced API or Capacitor
  if (typeof window !== 'undefined' && (window as any).require) {
    try {
      (window as any).require('escpos');
      (window as any).require('escpos-usb');
      (window as any).require('escpos-network');
    } catch (error) {
      console.warn('ESC/POS libraries not available:', error);
    }
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
   * Print receipt using traditional PDF method with settings
   */
  static async print(order: Order, settings?: any) {
    // Fetch settings if not provided
    if (!settings) {
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (e) {
        console.warn('Could not fetch settings for PDF receipt');
      }
    }

    // Get settings values or defaults
    const storeName = settings?.storeName || "OpenSauce P.O.S.";
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;
    const headerText = settings?.receiptHeaderText;
    const footerText = settings?.receiptFooterText;
    const showOrderNumber = settings?.receiptShowOrderNumber ?? true;
    const showDate = settings?.receiptShowDate ?? true;
    const showPaymentMethod = settings?.receiptShowPaymentMethod ?? true;
    const currency = settings?.currency || 'R';


    // Use unified width calculation
    const widthMM = getReceiptWidthMM(settings);

    // Use unified font size mapping
    const fontSize = getFontSizes(settings);

    // Use unified height calculation
    const orderItemsRaw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const orderItems = Array.isArray(orderItemsRaw) ? orderItemsRaw : [];
    const itemCount = orderItems.length;
    const receiptHeight = calculateReceiptHeight(itemCount);

    // Create PDF - adjust height based on content and width based on settings
    const doc = new jsPDF({
      unit: 'mm',
      format: [widthMM, receiptHeight] // Configurable receipt width, dynamic height
    });

    // Add CSS to prevent scaling when printing
    doc.setProperties({
      title: `Receipt #${order.id}`,
      subject: 'POS Receipt',
      author: storeName,
    });

    let y = 10;
    const rightAlignX = widthMM - 10; // 10mm from the right edge

    // Header - Store Name
    doc.setFontSize(fontSize.header);
    doc.text(storeName.toUpperCase(), widthMM / 2, y, { align: 'center' });
    y += 6;

    // Store details
    doc.setFontSize(fontSize.storeDetails);
    if (storeAddress) {
      doc.text(storeAddress, widthMM / 2, y, { align: 'center' });
      y += 4;
    }
    if (storePhone) {
      doc.text(`Tel: ${storePhone}`, widthMM / 2, y, { align: 'center' });
      y += 4;
    }

    y += 2;

    // Header text
    if (headerText) {
      doc.text(headerText, widthMM / 2, y, { align: 'center' });
      y += 5;
    }

    // Use unified divider
    doc.text(getThermalDivider('thin', settings), widthMM / 2, y, { align: 'center' });
    y += 5;

    // Order info
    if (showOrderNumber && order.id) {
      doc.text(`Order #: ${order.id}`, 10, y);
      y += 4;
    }
    if (showDate) {
      doc.text(`Date: ${new Date(order.createdAt || new Date()).toLocaleString()}`, 10, y);
      y += 4;
    }

    // Separator
    doc.text(getThermalDivider('thin', settings), widthMM / 2, y, { align: 'center' });
    y += 5;

    // Items header
    doc.setFontSize(fontSize.itemsHeader);
    doc.text('ITEMS', 10, y);
    y += 4;
    // Add divider line after ITEMS header
    doc.text(getThermalDivider('thin', settings), widthMM / 2, y, { align: 'center' });
    y += 4; // Additional spacing after the divider
    doc.setFontSize(fontSize.items);

    // Items
    (orderItems as OrderItemWithName[]).forEach((item, index) => {
      if (item.voided) return; // Skip voided items
      const itemTotal = Number(item.price) * item.quantity;
      const productName = item.productName || 'Item';
      doc.text(productName, 10, y);
      y += 6; // Increased from 4 to 6 for better spacing
      doc.text(`  ${item.quantity} x ${currency}${Number(item.price).toFixed(2)}`, 10, y);
      const rightAlignX = widthMM - 10; // 10mm from the right edge
      doc.text(`${currency}${itemTotal.toFixed(2)}`, rightAlignX, y, { align: 'right' });
      y += 7; // Increased from 5 to 7 for better spacing

      // Add line divider between items (but not after the last item)
      if (index < (orderItems as OrderItemWithName[]).length - 1) {
        doc.text(getThermalDivider('thin', settings), widthMM / 2, y, { align: 'center' });
        y += 6; // Increased from 5 to 6 for better spacing
      }
    });

    // Separator
    doc.text('--------------------------------', widthMM / 2, y, { align: 'center' });
    y += 5;

    // Total
    doc.setFontSize(fontSize.total);
    doc.text('TOTAL:', 10, y);
    doc.text(`${currency}${Number(order.total).toFixed(2)}`, rightAlignX, y, { align: 'right' });
    y += 5;

    doc.setFontSize(fontSize.content);

    // Payment method
    if (showPaymentMethod) {
      doc.text(`Payment: ${order.paymentMethod}`, 10, y);
      y += 4;
    }

    // Cash received and change
    if (order.cashReceived) {
      doc.text(`Cash: ${currency}${Number(order.cashReceived).toFixed(2)}`, 10, y);
      y += 4;
      doc.text(`Change: ${currency}${Number(order.change || '0').toFixed(2)}`, 10, y);
      y += 4;
    }

    // Use unified divider
    doc.text(getThermalDivider('thick', settings), widthMM / 2, y, { align: 'center' });
    y += 5;

    // Footer
    if (footerText) {
      doc.text(footerText, widthMM / 2, y, { align: 'center' });
      y += 5;
    } else {
      doc.text('Thank you for your purchase!', widthMM / 2, y, { align: 'center' });
      y += 5;
    }

    // QR Code
    if (settings?.receiptShowQrCode && settings?.paymentQrCode) {
      try {
        // Center the QR code (assuming it's square)
        const baseQrSize = 30; // 30mm base size
        const qrScale = settings?.qrCodeScale ? settings.qrCodeScale / 100 : 1;
        const qrSize = baseQrSize * qrScale;
        doc.addImage(settings.paymentQrCode, 'PNG', (widthMM - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 5;
      } catch (qrError) {
        console.error('Error adding QR code to PDF:', qrError);
      }
    }

    // Open print dialog with CSS to prevent scaling
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);

    // If we're in Electron, we can use silent printing
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.printReceipt(order, true);
        if (result.success) {
          URL.revokeObjectURL(url);
          return;
        }
        console.warn('Silent printing failed, falling back to dialog:', result.error);
      } catch (e) {
        console.error('Error during silent print:', e);
      }
    }

    // Create a new window with CSS to prevent scaling
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${order.id}</title>
            <style>
              @page {
                margin: 0;
                size: ${widthMM}mm ${receiptHeight}mm;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              /* Prevent scaling */
              @media print {
                body {
                  -webkit-transform: scale(1);
                  -moz-transform: scale(1);
                  -ms-transform: scale(1);
                  -o-transform: scale(1);
                  transform: scale(1);
                  -webkit-transform-origin: 0 0;
                  -moz-transform-origin: 0 0;
                  -ms-transform-origin: 0 0;
                  -o-transform-origin: 0 0;
                  transform-origin: 0 0;
                }
              }
            </style>
          </head>
          <body>
            <iframe
              src="${url}"
              style="width:100%; height:100vh; border:none; overflow:hidden;"
              onload="this.contentWindow.print();"
            ></iframe>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  /**
   * Print receipt using server-side API to handle thermal printers
   * @param order - The order to print
   * @param printerType - Type of printer connection ('usb', 'network', 'bluetooth')
   * @param printerAddress - Address of the printer (IP for network, not used for USB, deviceId for Bluetooth)
   */
  async printEscPos(order: Order, printerType: 'usb' | 'network' | 'bluetooth' = 'usb', printerAddress?: string): Promise<boolean> {
    console.log('[DEBUG] === ESC/POS PRINT START ===');
    console.log('[DEBUG] Order ID:', order.id);
    console.log('[DEBUG] Printer Type:', printerType);
    console.log('[DEBUG] Printer Address:', printerAddress);

    try {
      // Fetch settings for receipt formatting
      let settings = null;
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
          console.log('[DEBUG] Settings fetched successfully');
        } else {
          console.log('[DEBUG] Settings fetch failed with status:', settingsResponse.status);
        }
      } catch (settingsError) {
        console.warn('[DEBUG] Could not fetch settings for receipt formatting:', settingsError);
      }

      // Handle Bluetooth printing separately (Capacitor mobile)
      if (printerType === 'bluetooth' && printerAddress) {
        const { bluetoothPrinterService } = await import('../services/bluetooth-printer-service');

        // Generate receipt text with settings
        const receiptText = this.generateReceiptText(order, settings);

        // Use printer codepage setting for encoding
        const codepage = settings?.printerCodepage || 'cp437';
        const data = bluetoothPrinterService.generateReceiptData(receiptText, { codepage });
        return await bluetoothPrinterService.print(printerAddress, data);
      }

      // For all other printer types, use the server-side API or Electron API
      // This works in browser, Electron, and any environment that can make HTTP requests
      const receiptText = this.generateReceiptText(order, settings);

      // If we're in Electron, use the direct IPC call
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.printEscPos({
          content: receiptText,
          type: printerType,
          address: printerAddress
        });

        if (result.success) {
          console.log('[DEBUG] ESC/POS printing successful');
          this.isConnected = true;
          return true;
        } else {
          console.error('[DEBUG] ESC/POS printing failed:', result.error);
          console.error('[DEBUG] Printer result details:', result);
          this.isConnected = false;
          // Fallback to API if Electron fails (might be running in web mode of Electron)
        }
      }

      // Call the server API
      console.log('[DEBUG] Attempting server API printing');
      const response = await apiRequest('POST', '/api/printer/print', {
        content: receiptText,
        printerType,
        printerAddress
      });

      if (!response.ok) {
        console.error('[DEBUG] Server API response not ok:', response.status, response.statusText);
        throw new Error(`Printer API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[DEBUG] Server API result:', result);

      if (result.success) {
        console.log('[DEBUG] Server API printing successful');
        this.isConnected = true;
        return true;
      } else {
        console.error('[DEBUG] Server API printing failed:', result.message);
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      console.error('[DEBUG] Error in ESC/POS printing:', error);
      console.error('[DEBUG] Error type:', error instanceof Error ? error.constructor?.name : typeof error);
      console.error('[DEBUG] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack available');

      // Fallback to PDF printing if server API fails and it's not Bluetooth
      if (printerType !== 'bluetooth') {
        console.log('[DEBUG] Attempting fallback to PDF printing');
        try {
          ReceiptPrinter.print(order);
          console.log('[DEBUG] PDF fallback printing initiated');
          return true; // Consider it successful since PDF was opened
        } catch (pdfError) {
          console.error('[DEBUG] PDF fallback also failed:', pdfError);
          return false;
        }
      }

      this.isConnected = false;
      return false;
    }
  }

  /**
   * Test printer connection via server API
   */
  async testPrinter(printerType: 'usb' | 'network' | 'bluetooth' = 'usb', printerAddress?: string): Promise<boolean> {
    try {
      // Bluetooth testing requires direct device access, so we handle it separately
      if (printerType === 'bluetooth') {
        // For Bluetooth, we would need to handle this via Capacitor
        // Return true to indicate that Bluetooth can be handled, but we can't test it via server
        return true;
      }

      // For USB and network, use the server API
      const response = await apiRequest('POST', '/api/printer/test', {
        printerType,
        printerAddress
      });

      if (!response.ok) {
        throw new Error(`Printer test API error: ${response.status}`);
      }

      const result = await response.json();
      this.isConnected = result.success;
      return result.success;
    } catch (error) {
      console.error('Error testing printer with server API:', error);
      return false;
    }
  }

  /**
   * Generate receipt text from order data using settings
   * Optimized for thermal printers with proper spacing
   */
  private generateReceiptText(order: Order, settings?: any): string {
    // Use settings or fallback to defaults
    const storeName = settings?.storeName || "OpenSauce P.O.S.";
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;
    const storeEmail = settings?.storeEmail;
    const headerText = settings?.receiptHeaderText;
    const footerText = settings?.receiptFooterText;

    const showOrderNumber = settings?.receiptShowOrderNumber ?? true;
    const showDate = settings?.receiptShowDate ?? true;
    const showCustomer = settings?.receiptShowCustomer ?? true;
    const showPaymentMethod = settings?.receiptShowPaymentMethod ?? true;
    const currency = settings?.currency || 'R';
    const continuousPrinting = settings?.receiptContinuousPrinting ?? false;

    const maxLinesPerPage = settings?.receiptMaxLinesPerPage || 50;

    // Use unified separator calculation
    const separator = getThermalDivider('thick', settings);
    const dashSeparator = getThermalDivider('thin', settings);

    // Build Receipt header using unified formatting
    let text = generateThermalHeader({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      email: storeEmail
    }, settings);

    if (headerText) {
      text += `${headerText}\n\n`;
    }

    text += `${dashSeparator}\n\n`;

    if (showOrderNumber && order.id) {
      text += `Order #: ${order.id}\n`;
      text += `\n`; // Extra line for thermal printer spacing
    }

    if (showDate) {
      text += `Date: ${new Date(order.createdAt || new Date()).toLocaleString()}\n`;
      text += `\n`; // Extra line for thermal printer spacing
    }

    // Add customer info if enabled and available
    if (showCustomer && (order as any).customerName) {
      text += `Customer: ${(order as any).customerName}\n`;
      text += `\n`; // Extra line for thermal printer spacing
    }

    text += `${dashSeparator}\n`;
    text += `\n`; // Extra line for thermal printer spacing
    text += `ITEMS\n`;  // Left-aligned, capitalized for emphasis
    text += `${dashSeparator}\n`;  // Divider directly after ITEMS header
    text += `\n`; // Extra line for thermal printer spacing

    const textItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    let currentLineCount = 15; // Estimate starting line count (header, order info, etc.)

    (textItems as OrderItemWithName[]).forEach((item, index) => {
      if (item.voided) return; // Skip voided items
      // Format item line with improved spacing and clarity
      const itemTotal = (Number(item.price) * item.quantity);
      let productName = item.productName || 'Item';

      // For thermal printers, ensure product names don't exceed printable width (truncate if necessary)
      const separatorLength = getSeparatorLength(settings);
      if (productName.length > separatorLength - 10) { // Leave 10 chars for other content
        productName = productName.substring(0, separatorLength - 13) + '...';
      }

      // Add item divider before each item (except the first)
      if (index > 0) {
        text += `${dashSeparator}\n`;
        text += `\n`; // Spacing before next item
        currentLineCount += 2;
      }

      // For longer receipts (15+ items), ensure consistent formatting to prevent font scaling
      text += `${productName}\n`;
      currentLineCount += 1;
      text += `QTY: ${item.quantity} @ ${currency}${Number(item.price).toFixed(2)} each\n`;
      currentLineCount += 1;
      text += `SUBTOTAL: ${currency}${itemTotal.toFixed(2)}\n`;
      currentLineCount += 1;

      // Add line divider after each item (except the last)
      if (index < (textItems as OrderItemWithName[]).length - 1) {
        text += `\n`; // Standard spacing after item details
        currentLineCount += 1;

        // If we're approaching the max lines per page and continuous printing is disabled,
        // add a form feed to start a new page section
        if (!continuousPrinting && currentLineCount > maxLinesPerPage) {
          text += '\x0C'; // Form feed character to advance to next page
          currentLineCount = 0; // Reset line counter for new page
        }
      }
    });

    text += `${dashSeparator}\n`;
    text += `\n`; // Extra line for thermal printer spacing
    currentLineCount += 2;
    text += `TOTAL: ${currency}${Number(order.total).toFixed(2)}\n`;  // Left-aligned
    text += `\n`; // Extra line for thermal printer spacing
    currentLineCount += 2;
    text += `${dashSeparator}\n`;
    text += `\n`; // Extra line for thermal printer spacing
    currentLineCount += 2;

    if (showPaymentMethod) {
      text += `Payment: ${order.paymentMethod}\n`;
      text += `\n`; // Extra line for thermal printer spacing
      currentLineCount += 2;
    }

    if (order.cashReceived) {
      text += `Cash Received: ${currency}${Number(order.cashReceived).toFixed(2)}\n`;
      text += `\n`; // Extra line for thermal printer spacing
      currentLineCount += 2;
      text += `Change: ${currency}${Number(order.change || '0').toFixed(2)}\n`;
      text += `\n`; // Extra line for thermal printer spacing
      currentLineCount += 2;
    }

    text += generateThermalFooter(settings, footerText);

    // QR Code Notice for thermal printers
    if (settings?.receiptShowQrCode && settings?.paymentQrCode) {
      text += `${dashSeparator}\n`;
      text += `PAYMENT QR CODE ENABLED\n`;
      text += `Please scan the QR code displayed\n`;
      text += `on the counter to complete payment.\n\n`;
    }

    text += `${separator}\n\n`;

    // Only add form feed if continuous printing is disabled
    if (!continuousPrinting) {
      text += '\x0C'; // Form feed to advance to next page before cutting
    }

    // No extra newlines needed - the cut() function handles paper cutting
    return text;
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<boolean> {
    return this.isConnected;
  }

  /**
   * Print raw report text via server API
   */
  async printReport(content: string, printerType: 'usb' | 'network' | 'bluetooth' = 'usb', printerAddress?: string): Promise<boolean> {
    console.log('[DEBUG] printReport called with:', { printerType, printerAddress, contentLength: content.length });
    try {
      // Bluetooth printing
      if (printerType === 'bluetooth' && printerAddress) {
        console.log('[DEBUG] Attempting Bluetooth printing with address:', printerAddress);
        const { bluetoothPrinterService } = await import('../services/bluetooth-printer-service');
        
        // Fetch settings for printer codepage
        let settings = null;
        try {
          const settingsResponse = await apiRequest('GET', '/api/settings');
          if (settingsResponse.ok) {
            settings = await settingsResponse.json();
          }
        } catch (e) {
          console.log('[DEBUG] Could not fetch settings for report printing');
        }
        
        const codepage = settings?.printerCodepage || 'cp437';
        const data = await bluetoothPrinterService.generateReceiptData(content, { codepage });
        return await bluetoothPrinterService.print(printerAddress, data);
      }

      // Electron IPC
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log('[DEBUG] Using Electron IPC for printing:', { type: printerType, address: printerAddress });
        const result = await (window as any).electronAPI.printEscPos({
          content,
          type: printerType,
          address: printerAddress
        });

        if (result.success) {
          console.log('[DEBUG] Electron printer success');
          this.isConnected = true;
          return true;
        } else {
          console.error('[DEBUG] Electron printer error:', result.error);
          this.isConnected = false;
          // Return false to let caller handle fallback (caller has HTML fallback for reports)
          return false;
        }
      } else {
        console.log('[DEBUG] Electron API not available, trying server API');
      }

      // Server API fallback (for web mode only)
      console.log('[DEBUG] Using server API for printing');
      try {
        const response = await apiRequest('POST', '/api/printer/print', {
          content,
          printerType,
          printerAddress
        });

        if (!response.ok) {
          console.error('[DEBUG] Server API response not ok:', response.status, response.statusText);
          // Return false to let caller handle fallback
          return false;
        }

        const result = await response.json();
        console.log('[DEBUG] Server API result:', result);

        if (result.success) {
          this.isConnected = true;
          return true;
        } else {
          console.error('Printer error:', result.message);
          this.isConnected = false;
          return false;
        }
      } catch (serverError) {
        console.error('[DEBUG] Server API failed:', serverError);
        // Return false to let caller handle fallback
        return false;
      }
    } catch (error) {
      console.error('[DEBUG] Error printing report:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Print Cash Out Report
   */
  async printCashOutReport(summary: any, actuals: any, printerType: 'usb' | 'network' | 'bluetooth' = 'usb', printerAddress?: string): Promise<boolean> {
    try {
      // Fetch settings
      let settings = null;
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (e) {
        console.warn('Could not fetch settings for cash out report');
      }

      const reportText = ReceiptPrinter.generateCashOutReport(summary, actuals, settings);
      return await this.printReport(reportText, printerType, printerAddress);
    } catch (error) {
      console.error('Error printing cash out report:', error);
      return false;
    }
  }

  /**
   * Generate Cash Out Report Text
   */
  static generateCashOutReport(summary: any, actuals: any, settings?: any): string {
    const storeName = settings?.storeName || "OpenSauce P.O.S.";
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;
    const currency = settings?.currency || 'R';
    const continuousPrinting = settings?.receiptContinuousPrinting ?? false;

    // Use unified separator calculation
    const separator = getThermalDivider('thick', settings);
    const dashSeparator = getThermalDivider('thin', settings);

    let text = generateThermalHeader({
      name: storeName,
      address: storeAddress,
      phone: storePhone
    }, settings);

    text += `DAILY CASH OUT REPORT\n`;
    text += `\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `Time: ${new Date().toLocaleTimeString()}\n`;
    text += `Report Date: ${new Date(summary.date).toLocaleDateString()}\n`;
    text += `\n`;

    text += `${separator}\n`;
    text += `SALES SUMMARY\n`;
    text += `${separator}\n`;
    text += `Total Sales:     ${currency}${Number(summary.totalSales).toFixed(2)}\n`;
    text += `Total Profit:    ${currency}${Number(summary.totalProfit).toFixed(2)}\n`;
    text += `Items Sold:      ${summary.totalItems}\n`;
    text += `Transactions:    ${summary.transactionCount}\n`;
    text += `\n`;

    text += `${dashSeparator}\n`;
    text += `CASH DRAWER\n`;
    text += `${dashSeparator}\n`;
    text += `Opening Float:   ${currency}${Number(summary.openingCash).toFixed(2)}\n`;
    text += `Cash Received:   ${currency}${Number(summary.cashReceived).toFixed(2)}\n`;
    text += `Change Given:    -${currency}${Number(summary.changeGiven).toFixed(2)}\n`;
    text += `Expected Cash:   ${currency}${Number(summary.expectedCash).toFixed(2)}\n`;
    text += `Actual Cash:     ${currency}${Number(actuals.actualCash).toFixed(2)}\n`;

    const discrepancy = Number(actuals.discrepancy);
    const discrepancySign = discrepancy >= 0 ? '+' : '';
    text += `Discrepancy:     ${discrepancySign}${currency}${discrepancy.toFixed(2)}\n`;
    text += `\n`;

    // Notes
    if (actuals.notes) {
      text += `${dashSeparator}\n`;
      text += `NOTES\n`;
      text += `${actuals.notes}\n`;
      text += `\n`;
    }

    text += `${separator}\n`;
    text += `Signature:\n\n\n`;
    text += `________________________________\n`;
    text += `\n\n`;

    // Only add form feed if continuous printing is disabled
    if (!continuousPrinting) {
      text += '\x0C';
    }

    return text;
  }

  /**
   * Generate daily sales report for thermal printing
   */
  static generateDailySalesReport(orders: Order[], settings?: any): string {
    // Use settings or fallback to defaults
    const storeName = settings?.storeName || "OpenSauce P.O.S.";
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;
    const currency = settings?.currency || 'R';

    // Use unified separator calculation
    const separator = getThermalDivider('thick', settings);
    const dashSeparator = getThermalDivider('thin', settings);

    // Calculate comprehensive sales metrics
    let totalSales = 0;
    let totalOrders = orders.length;
    let totalItems = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDiscounts = 0;
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    const staffPerformance: Record<string, { count: number; total: number; profit: number; name: string }> = {};

    orders.forEach(order => {
      const orderTotal = Number(order.total);
      totalSales += orderTotal;

      // Parse items and calculate additional metrics
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      items.forEach((item: any) => {
        if (item.voided) return; // Skip voided items
        totalItems += item.quantity;
        // Calculate cost based on product cost if available
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      // Calculate profit
      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        if (item.voided) return sum; // Skip voided items
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        return sum + (itemCost * item.quantity);
      }, 0));

      // Calculate discounts (if available in order data)
      if (order.discount) {
        totalDiscounts += Number(order.discount);
      }

      // Track staff performance
      const userId = order.userId || 0;
      const userName = (order as any).userName || (order as any).user?.name || `User #${userId}`;
      const userRole = (order as any).userRole ? ` (${(order as any).userRole})` : '';
      const staffKey = `${userName}${userRole}`;

      // Calculate order profit for staff stats
      const orderProfit = (orderTotal - items.reduce((sum: number, item: any) => {
        if (item.voided) return sum;
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        return sum + (itemCost * item.quantity);
      }, 0));

      if (!staffPerformance[staffKey]) {
        staffPerformance[staffKey] = { count: 0, total: 0, profit: 0, name: staffKey };
      }
      staffPerformance[staffKey].count++;
      staffPerformance[staffKey].total += orderTotal;
      staffPerformance[staffKey].profit += orderProfit;

      // Track payment methods
      const method = order.paymentMethod || 'Unknown';

      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += orderTotal;
    });

    // Build report
    let text = '';
    text += `${separator}\n`;
    text += `\n`;
    text += `${storeName.toUpperCase()}\n`;
    text += `DAILY SALES REPORT\n`;
    text += `\n`;
    text += `${separator}\n`;
    text += `\n`;

    if (storeAddress) {
      text += `${storeAddress}\n`;
      text += `\n`;
    }

    if (storePhone) {
      text += `Tel: ${storePhone}\n`;
      text += `\n`;
    }

    // Show the actual date range of the orders or current date if no orders
    if (orders.length > 0) {
      const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
      const minDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...orderDates.map(date => date.getTime())));

      if (minDate.toDateString() === maxDate.toDateString()) {
        // All orders on same day
        text += `Date: ${minDate.toLocaleDateString()}\n`;
      } else {
        // Orders span multiple days
        text += `Date Range: ${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}\n`;
      }
    } else {
      text += `Date: ${new Date().toLocaleDateString()}\n`;
    }
    text += `\n`;
    text += `${dashSeparator}\n`;
    text += `\n`;

    // Summary section
    text += `SUMMARY:\n`;
    text += `─────────────────────\n`;
    text += `Total Items:     ${totalItems}\n`;
    text += `Total Profit:    ${currency}${totalProfit.toFixed(2)}\n`;
    text += `Total Sales:    ${currency}${totalSales.toFixed(2)}\n`;
    text += `Total Orders:    ${totalOrders}\n`;
    text += `Total Cost:      ${currency}${totalCost.toFixed(2)}\n`;
    text += `Total Discounts: ${currency}${totalDiscounts.toFixed(2)}\n`;
    text += `─────────────────────\n`;
    text += `\n`;

    // Staff Performance breakdown
    text += `STAFF PERFORMANCE:\n`;
    text += `─────────────────────\n`;
    Object.values(staffPerformance).forEach((data) => {
      text += `${data.name}:\n`;
      text += `  Sales: ${data.count} | Total: ${currency}${data.total.toFixed(2)}\n`;
      text += `  Profit: ${currency}${data.profit.toFixed(2)}\n`;
      text += `\n`;
    });
    text += `─────────────────────\n`;
    text += `\n`;

    // Payment methods breakdown
    text += `PAYMENT METHODS:\n`;
    text += `─────────────────────\n`;
    Object.entries(paymentMethods).forEach(([method, data]) => {
      text += `${method}:\n`;
      text += `  Count: ${data.count}\n`;
      text += `  Amount: ${currency}${data.amount.toFixed(2)}\n`;
      text += `\n`;
    });
    text += `─────────────────────\n`;
    text += `\n`;

    // Summary of transactions (detailed list removed for thermal print summary)
    // Detailed transaction history is available in the PDF export


    // Add summary of top selling products
    text += `\n`;
    text += `TOP SELLING PRODUCTS:\n`;
    text += `─────────────────────\n`;

    // Aggregate all items sold across all orders
    const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
    orders.forEach(order => {
      const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
      orderItems.forEach((item: any) => {
        const key = `${item.productId}-${item.productName}`;
        if (!allItemsSold[key]) {
          allItemsSold[key] = {
            name: item.productName || 'Item',
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0
          };
        }
        allItemsSold[key].totalQuantity += item.quantity;
        allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

        // Calculate profit for this item
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        const itemProfit = (Number(item.price) - itemCost) * item.quantity;
        allItemsSold[key].totalProfit += itemProfit;
      });
    });

    // Sort items by quantity sold (descending) and take top 10
    const sortedItems = Object.entries(allItemsSold)
      .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
      .slice(0, 10); // Limit to top 10 to fit on thermal paper

    if (sortedItems.length > 0) {
      sortedItems.forEach(([_key, item]) => {
        text += `${item.name.substring(0, 15)}...\n`; // Truncate name to fit thermal paper
        text += `  Qty: ${item.totalQuantity}, Rev: ${currency}${item.totalRevenue.toFixed(2)}, Prof: ${currency}${item.totalProfit.toFixed(2)}\n`;
      });
    } else {
      text += `No items sold\n`;
    }

    text += `─────────────────────\n`;
    text += `\n`;
    text += `${separator}\n`;
    text += `\n`;
    text += `End of Daily Report\n`;
    text += `\n`;
    text += `${separator}\n`;

    return text;
  }

  /**
   * Generate weekly sales report for thermal printing
   */
  static generateWeeklySalesReport(orders: Order[], settings?: any): string {
    // Calculate date range for the report from the provided orders
    let reportStartDate, reportEndDate;
    if (orders.length > 0) {
      const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
      reportStartDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
      reportEndDate = new Date(Math.max(...orderDates.map(date => date.getTime())));
    } else {
      // Fallback to current week if no orders
      const now = new Date();
      const dayOfWeek = now.getDay();
      reportStartDate = new Date(now);
      reportStartDate.setDate(now.getDate() - dayOfWeek);
      reportEndDate = new Date(reportStartDate);
      reportEndDate.setDate(reportStartDate.getDate() + 6);
    }

    // Use settings or fallback to defaults
    const storeName = settings?.storeName || "OpenSauce P.O.S.";
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;
    const currency = settings?.currency || 'R';

    // Use unified separator calculation
    const separator = getThermalDivider('thick', settings);
    const dashSeparator = getThermalDivider('thin', settings);

    // Calculate comprehensive sales metrics
    let totalSales = 0;
    let totalOrders = orders.length;
    let totalItems = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDiscounts = 0;
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    const staffPerformance: Record<string, { count: number; total: number; profit: number; name: string }> = {};

    orders.forEach(order => {
      const orderTotal = Number(order.total);
      totalSales += orderTotal;

      // Parse items and calculate additional metrics
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      items.forEach((item: any) => {
        totalItems += item.quantity;
        // Calculate cost based on product cost if available
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      // Calculate profit
      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        return sum + (itemCost * item.quantity);
      }, 0));

      // Calculate discounts (if available in order data)
      if (order.discount) {
        totalDiscounts += Number(order.discount);
      }

      // Track staff performance
      const userId = order.userId || 0;
      const userName = (order as any).userName || (order as any).user?.name || `User #${userId}`;
      const userRole = (order as any).userRole ? ` (${(order as any).userRole})` : '';
      const staffKey = `${userName}${userRole}`;

      // Calculate order profit for staff stats
      const orderProfit = (orderTotal - items.reduce((sum: number, item: any) => {
        if (item.voided) return sum;
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        return sum + (itemCost * item.quantity);
      }, 0));

      if (!staffPerformance[staffKey]) {
        staffPerformance[staffKey] = { count: 0, total: 0, profit: 0, name: staffKey };
      }
      staffPerformance[staffKey].count++;
      staffPerformance[staffKey].total += orderTotal;
      staffPerformance[staffKey].profit += orderProfit;

      // Track payment methods
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += orderTotal;
    });

    // Build report
    let text = '';
    text += `${separator}\n`;
    text += `\n`;
    text += `${storeName.toUpperCase()}\n`;
    text += `WEEKLY SALES REPORT\n`;
    text += `\n`;
    text += `${separator}\n`;
    text += `\n`;

    if (storeAddress) {
      text += `${storeAddress}\n`;
      text += `\n`;
    }

    if (storePhone) {
      text += `Tel: ${storePhone}\n`;
      text += `\n`;
    }

    text += `Date Range: ${reportStartDate.toLocaleDateString()} - ${reportEndDate.toLocaleDateString()}\n`;
    text += `\n`;
    text += `${dashSeparator}\n`;
    text += `\n`;

    text += `TOTAL ITEMS: ${totalItems}\n`;
    text += `TOTAL PROFIT: ${currency}${totalProfit.toFixed(2)}\n`;
    text += `TOTAL SALES: ${currency}${totalSales.toFixed(2)}\n`;
    text += `TOTAL ORDERS: ${totalOrders}\n`;
    text += `TOTAL COST: ${currency}${totalCost.toFixed(2)}\n`;
    text += `TOTAL DISCOUNTS: ${currency}${totalDiscounts.toFixed(2)}\n`;
    text += `\n`;
    text += `${dashSeparator}\n`;
    text += `\n`;

    // Payment methods breakdown
    text += `PAYMENT METHODS:\n`;
    text += `─────────────────────\n`;
    Object.entries(paymentMethods).forEach(([method, data]) => {
      text += `${method}:\n`;
      text += `  Count: ${data.count}\n`;
      text += `  Amount: ${currency}${data.amount.toFixed(2)}\n`;
      text += `\n`;
    });
    text += `─────────────────────\n`;
    text += `\n`;

    // Summary of transactions (detailed list removed for thermal print summary)
    // Detailed transaction history is available in the PDF export


    // Add summary of top selling products
    text += `\n`;
    text += `TOP SELLING PRODUCTS:\n`;
    text += `─────────────────────\n`;

    // Aggregate all items sold across all orders
    const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
    orders.forEach(order => {
      const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
      orderItems.forEach((item: any) => {
        const key = `${item.productId}-${item.productName}`;
        if (!allItemsSold[key]) {
          allItemsSold[key] = {
            name: item.productName || 'Item',
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0
          };
        }
        allItemsSold[key].totalQuantity += item.quantity;
        allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

        // Calculate profit for this item
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        const itemProfit = (Number(item.price) - itemCost) * item.quantity;
        allItemsSold[key].totalProfit += itemProfit;
      });
    });

    // Sort items by quantity sold (descending) and take top 10
    const sortedItems = Object.entries(allItemsSold)
      .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
      .slice(0, 10); // Limit to top 10 to fit on thermal paper

    if (sortedItems.length > 0) {
      sortedItems.forEach(([_key, item]) => {
        text += `${item.name.substring(0, 15)}...\n`; // Truncate name to fit thermal paper
        text += `  Qty: ${item.totalQuantity}, Rev: ${currency}${item.totalRevenue.toFixed(2)}, Prof: ${currency}${item.totalProfit.toFixed(2)}\n`;
      });
    } else {
      text += `No items sold\n`;
    }

    text += `─────────────────────\n`;
    text += `\n`;
    text += `${separator}\n`;
    text += `\n`;
    text += `End of Weekly Report\n`;
    text += `\n`;
    text += `${separator}\n`;

    return text;
  }

  /**
   * Generate monthly sales report for thermal printing
   */
  static generateMonthlySalesReport(orders: Order[], settings?: any): string {
    // Calculate date range for the report from the provided orders
    let reportStartMonth;
    if (orders.length > 0) {
      const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
      const minDate = new Date(Math.min(...orderDates.map(date => date.getTime())));

      // Set to beginning of month for start, end of month for end
      reportStartMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

    } else {
      // Fallback to current month if no orders
      const now = new Date();
      reportStartMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    }

    // Use settings or fallback to defaults
    const storeName = settings?.storeName || "OpenSauce P.O.S.";
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;
    const currency = settings?.currency || 'R';

    // Use unified separator calculation
    const separator = getThermalDivider('thick', settings);
    const dashSeparator = getThermalDivider('thin', settings);

    // Calculate comprehensive sales metrics
    let totalSales = 0;
    let totalOrders = orders.length;
    let totalItems = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDiscounts = 0;
    const paymentMethods: Record<string, { count: number; amount: number }> = {};

    orders.forEach(order => {
      const orderTotal = Number(order.total);
      totalSales += orderTotal;

      // Parse items and calculate additional metrics
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      items.forEach((item: any) => {
        totalItems += item.quantity;
        // Calculate cost based on product cost if available
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      // Calculate profit
      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        return sum + (itemCost * item.quantity);
      }, 0));

      // Calculate discounts (if available in order data)
      if (order.discount) {
        totalDiscounts += Number(order.discount);
      }

      // Track payment methods
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += orderTotal;
    });

    // Build report
    let text = '';
    text += `${separator}\n`;
    text += `\n`;
    text += `${storeName.toUpperCase()}\n`;
    text += `MONTHLY SALES REPORT\n`;
    text += `\n`;
    text += `${separator}\n`;
    text += `\n`;

    if (storeAddress) {
      text += `${storeAddress}\n`;
      text += `\n`;
    }

    if (storePhone) {
      text += `Tel: ${storePhone}\n`;
      text += `\n`;
    }

    if (orders.length > 0) {
      const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
      const minDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...orderDates.map(date => date.getTime())));

      if (minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear()) {
        // All orders in same month
        text += `Month: ${minDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}\n`;
      } else {
        // Orders span multiple months
        text += `Date Range: ${minDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} - ${maxDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}\n`;
      }
    } else {
      text += `Month: ${reportStartMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}\n`;
    }
    text += `\n`;
    text += `${dashSeparator}\n`;
    text += `\n`;

    text += `TOTAL ITEMS: ${totalItems}\n`;
    text += `TOTAL PROFIT: ${currency}${totalProfit.toFixed(2)}\n`;
    text += `TOTAL SALES: ${currency}${totalSales.toFixed(2)}\n`;
    text += `TOTAL ORDERS: ${totalOrders}\n`;
    text += `TOTAL COST: ${currency}${totalCost.toFixed(2)}\n`;
    text += `TOTAL DISCOUNTS: ${currency}${totalDiscounts.toFixed(2)}\n`;
    text += `\n`;
    text += `${dashSeparator}\n`;
    text += `\n`;

    // Payment methods breakdown
    text += `PAYMENT METHODS:\n`;
    text += `─────────────────────\n`;
    Object.entries(paymentMethods).forEach(([method, data]) => {
      text += `${method}:\n`;
      text += `  Count: ${data.count}\n`;
      text += `  Amount: ${currency}${data.amount.toFixed(2)}\n`;
      text += `\n`;
    });
    text += `─────────────────────\n`;
    text += `\n`;

    text += `TRANSACTION SUMMARY:\n`;
    text += `─────────────────────\n`;

    // Show all transactions without detailed items
    orders.forEach((order, index) => {
      text += `Order #${order.id}\n`;
      text += `Time: ${new Date(order.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
      text += `Payment: ${order.paymentMethod}\n`;
      text += `Total: ${currency}${Number(order.total).toFixed(2)}\n`;

      if (order.cashReceived) {
        text += `Cash Paid: ${currency}${Number(order.cashReceived).toFixed(2)}\n`;
        text += `Change: ${currency}${Number(order.change || '0').toFixed(2)}\n`;
      }

      text += `─────────────────────\n`;

      if (index < orders.length - 1) {
        text += `\n`;
      }
    });

    // Add summary of top selling products
    text += `\n`;
    text += `TOP SELLING PRODUCTS:\n`;
    text += `─────────────────────\n`;

    // Aggregate all items sold across all orders
    const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
    orders.forEach(order => {
      const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
      orderItems.forEach((item: any) => {
        const key = `${item.productId}-${item.productName}`;
        if (!allItemsSold[key]) {
          allItemsSold[key] = {
            name: item.productName || 'Item',
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0
          };
        }
        allItemsSold[key].totalQuantity += item.quantity;
        allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

        // Calculate profit for this item
        const product = (window as any).electronAPI ?
          (window as any).electronAPI.getProductsSync ?
            (window as any).electronAPI.getProductsSync().find((p: any) => p.id === item.productId) :
            null :
          null;
        const itemCost = Number(product?.cost || item.cost || 0);
        const itemProfit = (Number(item.price) - itemCost) * item.quantity;
        allItemsSold[key].totalProfit += itemProfit;
      });
    });

    // Sort items by quantity sold (descending) and take top 10
    const sortedItems = Object.entries(allItemsSold)
      .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
      .slice(0, 10); // Limit to top 10 to fit on thermal paper

    if (sortedItems.length > 0) {
      sortedItems.forEach(([_key, item]) => {
        text += `${item.name.substring(0, 15)}...\n`; // Truncate name to fit thermal paper
        text += `  Qty: ${item.totalQuantity}, Rev: ${currency}${item.totalRevenue.toFixed(2)}, Prof: ${currency}${item.totalProfit.toFixed(2)}\n`;
      });
    } else {
      text += `No items sold\n`;
    }

    text += `─────────────────────\n`;
    text += `\n`;
    text += `${separator}\n`;
    text += `\n`;
    text += `End of Report\n`;
    text += `\n`;
    text += `${separator}\n`;

    return text;
  }
}