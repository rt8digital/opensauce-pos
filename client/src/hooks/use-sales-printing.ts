import { useToast } from '@/hooks/use-toast';
import { usePeripherals } from '@/hooks/use-peripherals';
import { apiRequest } from '@/lib/queryClient';
import { ReceiptPrinter } from '@/lib/printer';
import type { Order } from '../../../shared/types';

interface UseSalesPrintingProps {
  filteredOrders: Order[];
  formatPrice: (price: number) => string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export function useSalesPrinting({
  filteredOrders,
  formatPrice,
  reportType,
}: UseSalesPrintingProps) {
  const { printReceipt } = usePeripherals();
  const { toast } = useToast();

  const handlePrintThermal = async () => {
    try {
      // Get settings for formatting
      let settings = null;
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (e) {
        console.warn('[DEBUG] Could not fetch settings for PDF printing:', e);
      }

      console.log('[DEBUG] Retrieved settings:', settings);

      // Get orders based on the selected date range
      // Note: filteredOrders is already filtered by date range in the parent component

      // Use the ReceiptPrinter instance for thermal printing
      const printer = ReceiptPrinter.getInstance();
      let success = false;

      // Handle different printer types
      const printerType = settings?.printerType || 'usb';
      const printerAddress = printerType === 'bluetooth'
        ? settings?.printerDeviceId
        : settings?.printerIp;

      console.log('[DEBUG] Printer config:', { printerType, printerAddress });

      if (printerType === 'bluetooth' && !printerAddress) {
        toast({
          title: 'Bluetooth Printer Not Configured',
          description: 'Please configure a Bluetooth printer device ID in settings.',
          variant: 'destructive',
        });
        return;
      }

      // Generate report content based on type
      let reportContent = '';
      switch (reportType) {
        case 'daily':
          reportContent = ReceiptPrinter.generateDailySalesReport(filteredOrders, settings);
          break;
        case 'weekly':
          reportContent = ReceiptPrinter.generateWeeklySalesReport(filteredOrders, settings);
          break;
        case 'monthly':
          // Fallback to weekly generator for now or implement monthly if needed
          reportContent = ReceiptPrinter.generateWeeklySalesReport(filteredOrders, settings);
          break;
        case 'yearly':
          // Fallback to weekly generator for now or implement yearly if needed
          reportContent = ReceiptPrinter.generateWeeklySalesReport(filteredOrders, settings);
          break;
        default:
          reportContent = ReceiptPrinter.generateDailySalesReport(filteredOrders, settings);
      }

      try {
        // Use printReport for reports, not printEscPos which expects an order
        success = await printer.printReport(
          reportContent,
          printerType,
          printerAddress
        );
      } catch (error) {
        console.error('Error printing sales report:', error);
        success = false;
      }

      if (success) {
        toast({
          title: 'Report Printed',
          description: `Sales ${reportType} report has been sent to the thermal printer.`,
        });
        return;
      }

      // Fallback to browser print if not in Electron or if ESC/POS failed
      // Generate a focused sales report with essential data in receipt format
      const storeName = settings?.storeName || 'OpenSauce P.O.S.';
      const storeAddress = settings?.storeAddress;
      const storePhone = settings?.storePhone;

      const now = new Date();
      let reportTitle = '';
      let dateRangeSummary = '';

      switch (reportType) {
        case 'daily':
          reportTitle = 'Daily Sales Report';
          dateRangeSummary = new Date().toLocaleDateString();
          break;
        case 'weekly':
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          reportTitle = 'Weekly Sales Report';
          dateRangeSummary = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
          break;
        case 'monthly':
          reportTitle = 'Monthly Sales Report';
          dateRangeSummary = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          break;
        case 'yearly':
          reportTitle = 'Yearly Sales Report';
          dateRangeSummary = new Date().toLocaleDateString('en-US', { year: 'numeric' });
          break;
        default:
          reportTitle = 'Daily Sales Report';
          dateRangeSummary = new Date().toLocaleDateString();
      }

      // Calculate total sales for the report
      let totalSalesCount = 0;
      let totalOrdersCount = filteredOrders.length;
      filteredOrders.forEach(order => {
        totalSalesCount += Number(order.total);
      });

      // Build focused report content in receipt format (SUMMARY ONLY)
      let htmlContent = `
        <div class="header">
          <div class="store-name" style="text-align: center; font-size: 18px; font-weight: bold;">${storeName}</div>
          <div class="report-title" style="text-align: center; font-size: 14px; margin: 5px 0;">${reportTitle}</div>
          <div class="date-range" style="text-align: center; font-size: 12px; margin: 5px 0; color: #666;">${dateRangeSummary}</div>
          ${storeAddress ? `<div style="text-align: center; font-size: 12px;">${storeAddress}</div>` : ''}
          ${storePhone ? `<div style="text-align: center; font-size: 12px;">Tel: ${storePhone}</div>` : ''}
        </div>

        <div style="margin: 15px 0; padding: 10px 0; border-top: 1px solid #333; border-bottom: 1px solid #333; font-weight: bold;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Total Orders:</span>
            <span>${totalOrdersCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Total Sales:</span>
            <span>${formatPrice(totalSalesCount)}</span>
          </div>
        </div>

        <div style="margin-top: 20px; font-size: 11px; text-align: center; color: #666;">
          End of Report
        </div>
      `;

      // If we're in Electron, use silent printing
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        try {
          const result = await (window as any).electronAPI.printReport(htmlContent, true);
          if (result.success) {
            toast({
              title: 'Report Printed',
              description: `Sales ${reportType} report has been sent to the printer.`,
            });
            return;
          } else {
            console.error('Silent printing failed:', result.error);
            // Fall through to browser printing
          }
        } catch (e) {
          console.error('Error during silent print:', e);
          // Fall through to browser printing
        }
      }

      // Create a print-friendly window with the focused sales report
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup blocker settings.');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle} - ${dateRangeSummary}</title>
          <style>
            body {
              font-family: monospace;
              margin: 10px;
              color: #333;
              font-size: 12px;
              line-height: 1.4;
              max-width: 300px; /* Limit width to simulate receipt */
              margin: 0 auto;
            }
            .header {
              margin-bottom: 15px;
            }
            .store-name {
              text-align: center;
              font-weight: bold;
            }
            .report-title {
              text-align: center;
              margin: 5px 0;
            }
            .date-range {
              text-align: center;
              color: #666;
            }
            @media print {
              body { margin: 5px; max-width: 100%; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Report</button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      // Automatically trigger printing after the content loads
      printWindow.onload = () => {
        printWindow.print();
      };

      toast({
        title: 'Print Started',
        description: `Sales ${reportType} report is being printed via browser.`,
      });
    } catch (error) {
      console.error('Error printing sales report:', error);
      toast({
        title: 'Print Failed',
        description: `Printing failed: ${error instanceof Error ? error.message : 'Unknown error'}.`,
        variant: 'destructive',
      });
    }
  };

  // Function to print an individual order with detailed items
  const handlePrintOrder = async (order: Order) => {
    try {
      // Get settings for formatting
      let settings = null;
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (e) {
        console.warn('Could not fetch settings for thermal printing');
      }

      // Use the same printReceipt method as the POS page for consistency
      const success = await printReceipt(order);

      if (success) {
        toast({
          title: 'Print Successful',
          description: `Order #${order.id} receipt has been printed successfully.`,
        });
      } else {
        toast({
          title: 'Print Failed',
          description: 'Printing failed. Please make sure your thermal printer is connected and configured properly.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error printing order receipt:', error);
      toast({
        title: 'Print Failed',
        description: 'Printing failed. Please make sure your thermal printer is connected and configured properly.',
        variant: 'destructive',
      });
    }
  };

  return { handlePrintThermal, handlePrintOrder };
}