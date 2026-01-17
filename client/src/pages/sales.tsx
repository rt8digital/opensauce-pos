import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MainLayout } from '@/components/layout/main-layout';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { apiRequest } from '@/lib/queryClient';
import { offlineDataManager } from '@/lib/offline-data-manager';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '../components/sales/action-buttons';
import { DateRangeControls } from '../components/sales/date-range-controls';
import type { Order, Product, OrderItemWithName } from '../../../shared/types';
import { Download, Calendar } from 'lucide-react';
import { SalesMetricsCards } from '../components/sales/sales-metrics-cards';
import { AnalyticsCharts } from '../components/sales/analytics-charts';
import { OrdersTable } from '../components/sales/orders-table';
import { CashOutDialog } from '../components/sales/cash-out-dialog';
import { OrderSelectionDialog } from '../components/sales/order-selection-dialog';
import { PinConfirmationDialog } from '../components/sales/pin-confirmation-dialog';
import { useSalesPrinting } from '../hooks/use-sales-printing';
import { exportOrdersToCSV, parseAndValidateCSV, downloadCSV } from '../lib/csv-export-import';
import { wrapReportContent } from '../lib/pdf-report-template';

export default function Sales() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [dateRangeStart, setDateRangeStart] = useState(dateRange.start);
  const [dateRangeEnd, setDateRangeEnd] = useState(dateRange.end);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [cashOutDialogOpen, setCashOutDialogOpen] = useState(false);
  const [orderSelectionDialogOpen, setOrderSelectionDialogOpen] = useState(false);
  const [pinConfirmationDialogOpen, setPinConfirmationDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [voidOperationType, setVoidOperationType] = useState<'order' | 'items' | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const debouncedDateRangeStart = useDebounce(dateRangeStart, 500);
  const debouncedDateRangeEnd = useDebounce(dateRangeEnd, 500);

  // Sync debounced date range values with the original dateRange state
  useEffect(() => {
    setDateRange(prev => ({
      ...prev,
      start: debouncedDateRangeStart,
      end: debouncedDateRangeEnd
    }));
  }, [debouncedDateRangeStart, debouncedDateRangeEnd]);

  // Handle cash out dialog from sidebar
  useEffect(() => {
    const handleOpenCashOut = () => setCashOutDialogOpen(true);
    window.addEventListener('openCashOutDialog', handleOpenCashOut);
    return () => window.removeEventListener('openCashOutDialog', handleOpenCashOut);
  }, []);

  // Reset void operation state when dialogs close
  useEffect(() => {
    if (!pinConfirmationDialogOpen && !orderSelectionDialogOpen) {
      setVoidOperationType(null);
      setSelectedOrderId(null);
      setSelectedItemIds([]);
    }
  }, [pinConfirmationDialogOpen, orderSelectionDialogOpen]);

  // Update date range when report type changes
  useEffect(() => {
    const now = new Date();
    let newStart = new Date();
    let newEnd = new Date();

    switch (reportType) {
      case 'daily':
        // Today
        newStart = new Date(now);
        newStart.setHours(0, 0, 0, 0);
        newEnd = new Date(now);
        newEnd.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        // This week (Sunday to Saturday)
        const dayOfWeek = now.getDay();
        newStart = new Date(now);
        newStart.setDate(now.getDate() - dayOfWeek);
        newStart.setHours(0, 0, 0, 0);
        newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 6);
        newEnd.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        // This month
        newStart = new Date(now.getFullYear(), now.getMonth(), 1);
        newEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
        newEnd.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        // This year
        newStart = new Date(now.getFullYear(), 0, 1); // January 1st
        newEnd = new Date(now.getFullYear(), 11, 31); // December 31st
        newEnd.setHours(23, 59, 59, 999);
        break;
    }

    const startStr = newStart.toISOString().split('T')[0];
    const endStr = newEnd.toISOString().split('T')[0];

    setDateRange({ start: startStr, end: endStr });
    setDateRangeStart(startStr);
    setDateRangeEnd(endStr);
  }, [reportType]);

  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { user, isAdmin, isOwner } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders', dateRange.start, dateRange.end],
    queryFn: async ({ queryKey }) => {
      const [, startDate, endDate] = queryKey as [string, string, string];
      const response = await apiRequest('GET', `/api/orders?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => offlineDataManager.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter out voided orders for analytics calculations
  const analyticsOrders = orders.filter(order => order.status !== 'voided');

  const { handlePrintThermal, handlePrintOrder } = useSalesPrinting({ filteredOrders: analyticsOrders, formatPrice, reportType });

  const handleShowPrintPreview = async () => {
    try {
      // Get settings
      let settings = null;
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (e) {
        console.warn('Could not fetch settings for preview');
      }

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

      // Calculate total sales
      let totalSalesCount = 0;
      analyticsOrders.forEach(order => {
        totalSalesCount += Number(order.total);
      });

      // Build report content
      let reportContent = `
        <div class="header">
          <div class="store-name" style="text-align: center; font-size: 18px; font-weight: bold;">${storeName}</div>
          <div class="report-title" style="text-align: center; font-size: 14px; margin: 5px 0;">${reportTitle}</div>
          <div class="date-range" style="text-align: center; font-size: 12px; margin: 5px 0; color: #666;">${dateRangeSummary}</div>
          ${storeAddress ? `<div style="text-align: center; font-size: 12px;">${storeAddress}</div>` : ''}
          ${storePhone ? `<div style="text-align: center; font-size: 12px;">Tel: ${storePhone}</div>` : ''}
        </div>

        <div style="margin: 15px 0; padding: 10px 0; border-top: 1px solid #333; border-bottom: 1px solid #333; font-weight: bold;">
          <div style="display: flex; justify-content: space-between;">
            <span>Total Orders: ${analyticsOrders.length}</span>
            <span>Total Sales: ${formatPrice(totalSalesCount)}</span>
          </div>
        </div>
      `;

      // Calculate aggregations
      const paymentMethods: Record<string, { count: number; amount: number }> = {};
      const staffPerformance: Record<string, { count: number; total: number; profit: number; name: string }> = {};
      let globalTotalProfit = 0;
      let globalTotalItems = 0;

      analyticsOrders.forEach(order => {
        const orderTotal = Number(order.total);
        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

        // Calculate order items count
        const orderItemsCount = orderItems.reduce((sum: number, item: any) => sum + (item.voided ? 0 : item.quantity), 0);
        globalTotalItems += orderItemsCount;

        // Calculate order profit
        const orderProfit = (orderTotal - orderItems.reduce((sum: number, item: any) => {
          if (item.voided) return sum;
          const product = products.find(p => p.id === item.productId);
          const itemCost = Number(product?.cost || item.cost || 0);
          return sum + (itemCost * item.quantity);
        }, 0));
        globalTotalProfit += orderProfit;

        // Track payment methods
        const method = order.paymentMethod || 'Unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, amount: 0 };
        }
        paymentMethods[method].count++;
        paymentMethods[method].amount += orderTotal;

        // Track staff performance
        const userId = order.userId || 0;
        const userName = (order as any).userName || (order as any).user?.name || `User #${userId}`;
        const userRole = (order as any).userRole ? ` (${(order as any).userRole})` : '';
        const staffKey = `${userName}${userRole}`;

        if (!staffPerformance[staffKey]) {
          staffPerformance[staffKey] = { count: 0, total: 0, profit: 0, name: staffKey };
        }
        staffPerformance[staffKey].count++;
        staffPerformance[staffKey].total += orderTotal;
        staffPerformance[staffKey].profit += orderProfit;
      });

      // Staff Performance Section
      reportContent += `
        <div class="section-title">STAFF PERFORMANCE</div>
        <div style="border-bottom: 1px solid #ccc; margin-bottom: 5px;"></div>
      `;

      Object.values(staffPerformance).forEach(data => {
        reportContent += `
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold;">${data.name}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #555;">
              <span>Sales: ${data.count} | Total: ${formatPrice(data.total)}</span>
              <span>Profit: ${formatPrice(data.profit)}</span>
            </div>
          </div>
        `;
      });
      console.log(staffPerformance)

      // Payment Methods Section
      reportContent += `
        <div class="section-title" style="margin-top: 20px;">PAYMENT METHODS</div>
        <div style="border-bottom: 1px solid #ccc; margin-bottom: 5px;"></div>
      `;

      Object.entries(paymentMethods).forEach(([method, data]) => {
        reportContent += `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="text-transform: capitalize;">${method.replace(/_/g, ' ')}</span>
            <span>${data.count} | ${formatPrice(data.amount)}</span>
          </div>
        `;
      });

      // Grand total
      reportContent += `
        <div style="margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; font-weight: bold; font-size: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
             <span>Total Items:</span>
             <span>${globalTotalItems}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px;">
             <span>Total Profit:</span>
             <span>${formatPrice(globalTotalProfit)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>GRAND TOTAL:</span>
            <span>${formatPrice(totalSalesCount)}</span>
          </div>
        </div>
      `;

      // Set the full HTML
      const fullContent = `
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
            .section-title {
              font-weight: bold;
              margin: 15px 0 5px 0;
            }
            @media print {
              body { margin: 5px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
        </html>
      `;

      setPreviewContent(fullContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Preview Failed',
        description: 'Failed to generate report preview.',
        variant: 'destructive',
      });
    }
  };

  const totalSales = analyticsOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrders = analyticsOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const totalCost = useMemo(() => {
    return analyticsOrders.reduce((sum, order) => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
      return sum + items.reduce((itemSum, item: any) => {
        if (item.voided) return itemSum; // Skip voided items
        // Use historical cost if available, otherwise find current product cost
        const historicalCost = item.cost !== undefined ? Number(item.cost) : (item.costPrice !== undefined ? Number(item.costPrice) : undefined);
        const currentProduct = products.find(p => p.id === item.productId);
        const costToUse = historicalCost ?? Number(currentProduct?.cost || 0);
        return itemSum + costToUse * item.quantity;
      }, 0);
    }, 0);
  }, [analyticsOrders, products]);

  const totalProfit = totalSales - totalCost;

  const handleVoidOrderFromTable = async (order: Order) => {
    // Check permissions
    if (!isAdmin && !isOwner) {
      toast({
        title: 'Permission Denied',
        description: 'Only administrators or owners can void sales.',
        variant: 'destructive',
      });
      return;
    }

    // Check if order can be voided
    if (order.status === 'voided' || order.status === 'cancelled') {
      toast({
        title: 'Cannot Void',
        description: 'This order is already voided or cancelled.',
        variant: 'destructive',
      });
      return;
    }

    // Confirm void action
    if (!confirm(`Are you sure you want to void order #${order.id}? This action cannot be undone.`)) {
      return;
    }

    try {
      // TODO: Implement actual void API call
      // For now, show success message
      toast({
        title: 'Order Voided',
        description: `Order #${order.id} has been voided successfully.`,
      });

      // Invalidate queries to refresh data
      // queryClient.invalidateQueries(['orders']);
    } catch (error) {
      console.error('Error voiding order:', error);
      toast({
        title: 'Void Failed',
        description: 'Failed to void the order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleVoidOrderConfirmed = async (orderId: number) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to void orders.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call the backend void order API
      await window.electronAPI.voidOrder(orderId, user.id, 'Voided from sales interface');

      // Show success message
      toast({
        title: 'Order Voided',
        description: `Order #${orderId} has been voided successfully.`,
      });

      // Close the PIN dialog
      setPinConfirmationDialogOpen(false);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error: any) {
      console.error('Error voiding order:', error);

      // Handle different error types with specific messages
      let errorMessage = 'Failed to void the order. Please try again.';

      if (error.message) {
        if (error.message.includes('Order not found')) {
          errorMessage = 'Order not found. It may have been already voided or deleted.';
        } else if (error.message.includes('already voided')) {
          errorMessage = 'This order has already been voided.';
        } else if (error.message.includes('Permission denied') || error.message.includes('Admin privileges required')) {
          errorMessage = 'You do not have permission to void this order.';
        } else if (error.message.includes('No active session')) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Void Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleVoidItemsConfirmed = async () => {
    if (!user || !selectedOrderId || selectedItemIds.length === 0) {
      toast({
        title: 'Invalid Request',
        description: 'Missing required information for item voiding.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call the backend void items API
      await window.electronAPI.voidItems(selectedItemIds, user.id, 'Voided from sales interface');

      // Show success message
      toast({
        title: 'Items Voided',
        description: `Successfully voided ${selectedItemIds.length} item(s) from order #${selectedOrderId}.`,
      });

      // Close the PIN dialog
      setPinConfirmationDialogOpen(false);

      // Reset void operation state
      setVoidOperationType(null);
      setSelectedItemIds([]);
      setSelectedOrderId(null);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error: any) {
      console.error('Error voiding items:', error);

      // Handle different error types with specific messages
      let errorMessage = 'Failed to void the selected items. Please try again.';

      if (error.message) {
        if (error.message.includes('Order not found')) {
          errorMessage = 'Order not found. It may have been already voided or deleted.';
        } else if (error.message.includes('already voided')) {
          errorMessage = 'These items have already been voided.';
        } else if (error.message.includes('Permission denied') || error.message.includes('Admin privileges required')) {
          errorMessage = 'You do not have permission to void these items.';
        } else if (error.message.includes('No active session')) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Void Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleOrderSelected = (orderId: number) => {
    setVoidOperationType('order');
    setSelectedOrderId(orderId);
    setOrderSelectionDialogOpen(false);
    if (!isAdmin) {
      setPinConfirmationDialogOpen(true);
    } else {
      handleVoidOrderConfirmed(orderId);
    }
  };

  const handlePinConfirmed = () => {
    if (voidOperationType === 'order' && selectedOrderId) {
      handleVoidOrderConfirmed(selectedOrderId);
    } else if (voidOperationType === 'items') {
      handleVoidItemsConfirmed();
    }
  };

  const salesByCategory = useMemo(() => {
    const categoryMap = new Map<string, { revenue: number; cost: number; profit: number }>();
    analyticsOrders.forEach(order => {
      (typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[]).forEach((item: any) => {
        const currentProduct = products.find(p => p.id === item.productId);
        const historicalCost = item.cost !== undefined ? Number(item.cost) : undefined;
        const category = currentProduct?.category || 'Unknown';

        const revenue = Number(item.price) * item.quantity;
        const cost = (historicalCost ?? Number(currentProduct?.cost || 0)) * item.quantity;
        const profit = revenue - cost;

        const current = categoryMap.get(category) || { revenue: 0, cost: 0, profit: 0 };
        categoryMap.set(category, {
          revenue: current.revenue + revenue,
          cost: current.cost + cost,
          profit: current.profit + profit,
        });
      });
    });
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
    }));
  }, [analyticsOrders, products]);

  const salesByPaymentMethod = useMemo(() => {
    const methodMap = new Map<string, number>();
    analyticsOrders.forEach(order => {
      methodMap.set(order.paymentMethod, (methodMap.get(order.paymentMethod) || 0) + Number(order.total));
    });
    return Array.from(methodMap.entries()).map(([name, value]) => ({ name, value }));
  }, [analyticsOrders]);

  const topProducts = useMemo(() => {
    const productMap = new Map<string, number>();
    analyticsOrders.forEach(order => {
      (typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[]).forEach((item: OrderItemWithName) => {
        productMap.set(item.productName, (productMap.get(item.productName) || 0) + item.quantity);
      });
    });
    return Array.from(productMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [analyticsOrders]);

  const handleExportPDF = async () => {
    try {
      // Get settings for formatting
      let settings = null;
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings');
        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch (e) {
        console.warn('Could not fetch settings for PDF export');
      }

      // Determine report title and date range
      const reportTitles = {
        daily: 'Daily Sales Report',
        weekly: 'Weekly Sales Report',
        monthly: 'Monthly Sales Report',
        yearly: 'Yearly Sales Report'
      };

      const reportTitle = reportTitles[reportType];
      const dateRangeText = `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;

      // Generate report content based on selected report type
      const innerContent = reportType === 'daily' ? generateDailyReportContent(analyticsOrders, settings, products, formatPrice) :
        reportType === 'weekly' ? generateWeeklyReportContent(analyticsOrders, settings, products, formatPrice) :
          reportType === 'monthly' ? generateMonthlyReportContent(analyticsOrders, settings, products, formatPrice) :
            generateYearlyReportContent(analyticsOrders, settings, products, formatPrice);

      // Wrap content with professional template
      const fullHTML = wrapReportContent(innerContent, reportTitle, dateRangeText);

      // Create a print-friendly window with the sales report
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup blocker settings.');
      }

      printWindow.document.write(fullHTML);
      printWindow.document.close();

      toast({
        title: 'Report Generated',
        description: `${reportTitle} is ready. Click the print button in the new window to print.`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate sales report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = exportOrdersToCSV(orders);
      const filename = `sales-export-${dateRange.start}-to-${dateRange.end}.csv`;
      downloadCSV(csvContent, filename);
      toast({
        title: 'Export Successful',
        description: `Exported ${orders.length} orders to CSV file.`,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export sales data to CSV.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      setIsImporting(true);
      const csvContent = await file.text();
      const { validOrders, errors } = parseAndValidateCSV(csvContent);

      if (errors.length > 0) {
        toast({
          title: 'Import Validation Failed',
          description: `Found ${errors.length} validation errors. Please check the CSV format.`,
          variant: 'destructive',
        });
        return;
      }

      if (validOrders.length === 0) {
        toast({
          title: 'No Valid Orders',
          description: 'No valid orders found in the CSV file.',
          variant: 'destructive',
        });
        return;
      }

      // Import orders via IPC
      const result = await window.electronAPI.bulkImportOrders(validOrders);

      if (result.errors && result.errors.length > 0) {
        toast({
          title: 'Import Partially Failed',
          description: `Imported ${result.imported} orders, but ${result.errors.length} failed.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${result.imported} orders.`,
        });
      }

      // Refresh the orders data
      // This would trigger a re-fetch if using TanStack Query
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import orders from CSV file.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };



  // Helper function to generate daily report content for A4 print
  const generateDailyReportContent = (orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string) => {
    const storeName = settings?.storeName || 'OpenSauce P.O.S.';
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;

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
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        return sum + (itemCost * item.quantity);
      }, 0));

      if (order.discount) {
        totalDiscounts += Number(order.discount);
      }

      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += orderTotal;
    });

    let content = `
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="report-title">Daily Sales Report</div>
        <div class="date-range">${new Date().toLocaleDateString()}</div>
        <div class="store-info">
          ${storeAddress ? `<div>${storeAddress}</div>` : ''}
          ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
        </div>
      </div>

      <div class="summary">
        <div class="summary-item highlight">
          <div class="summary-label">Total Sales</div>
          <div class="summary-value">${formatPrice(totalSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Orders</div>
          <div class="summary-value">${totalOrders}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Avg Order</div>
          <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Items Sold</div>
          <div class="summary-value">${totalItems}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Cost</div>
          <div class="summary-value">${formatPrice(totalCost)}</div>
        </div>
        <div class="summary-item success">
          <div class="summary-label">Net Profit</div>
          <div class="summary-value">${formatPrice(totalProfit)}</div>
        </div>
        ${totalDiscounts > 0 ? `
        <div class="summary-item">
          <div class="summary-label">Discounts</div>
          <div class="summary-value">${formatPrice(totalDiscounts)}</div>
        </div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">💳 Payment Methods Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th class="amount">Transactions</th>
              <th class="amount">Total Amount</th>
              <th class="amount">% of Sales</th>
            </tr>
          </thead>
          <tbody>
    `;

    Object.entries(paymentMethods).forEach(([method, data]) => {
      const percentage = totalSales > 0 ? ((data.amount / totalSales) * 100).toFixed(1) : '0.0';
      content += `
        <tr>
          <td><strong>${method}</strong></td>
          <td class="amount">${data.count}</td>
          <td class="amount">${formatPrice(data.amount)}</td>
          <td class="amount">${percentage}%</td>
        </tr>
      `;
    });

    content += `
          </tbody>
          <tfoot>
            <tr>
              <td><strong>TOTAL</strong></td>
              <td class="amount"><strong>${totalOrders}</strong></td>
              <td class="amount"><strong>${formatPrice(totalSales)}</strong></td>
              <td class="amount"><strong>100%</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="section">
        <div class="section-title">🏆 Top Selling Products</div>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th class="amount">Qty Sold</th>
              <th class="amount">Revenue</th>
              <th class="amount">Profit</th>
              <th class="amount">Margin</th>
            </tr>
          </thead>
          <tbody>
    `;

    const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
    orders.forEach(order => {
      const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
      orderItems.forEach((item: any) => {
        const key = `${item.productId}-${item.productName}`;
        if (!allItemsSold[key]) {
          allItemsSold[key] = { name: item.productName || 'Item', totalQuantity: 0, totalRevenue: 0, totalProfit: 0 };
        }
        allItemsSold[key].totalQuantity += item.quantity;
        allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        allItemsSold[key].totalProfit += (Number(item.price) - itemCost) * item.quantity;
      });
    });

    const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue).slice(0, 10);

    sortedItems.forEach(([, item]) => {
      const margin = item.totalRevenue > 0 ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1) : '0.0';
      content += `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td class="amount">${item.totalQuantity}</td>
          <td class="amount">${formatPrice(item.totalRevenue)}</td>
          <td class="amount">${formatPrice(item.totalProfit)}</td>
          <td class="amount">${margin}%</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">📋 Transaction History</div>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Time</th>
              <th>Payment</th>
              <th class="amount">Items</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    orders.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      content += `
        <tr>
          <td><strong>#${order.id}</strong></td>
          <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
          <td>${order.paymentMethod}</td>
          <td class="amount">${itemCount}</td>
          <td class="amount">${formatPrice(Number(order.total))}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    return content;
  };

  // Helper function to generate weekly report content for A4 print
  const generateWeeklyReportContent = (orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string) => {
    const storeName = settings?.storeName || 'OpenSauce P.O.S.';
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;

    // Calculate appropriate date range for the report
    // If we have orders, use the min and max dates from the orders
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
        if (item.voided) return; // Skip voided items
        totalItems += item.quantity;
        // Calculate cost based on product cost if available
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      // Calculate profit
      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        if (item.voided) return sum; // Skip voided items
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
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

    let content = `
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="report-title">Weekly Sales Report</div>
        <div class="date-range">
          ${reportStartDate.toLocaleDateString()} - ${reportEndDate.toLocaleDateString()}
        </div>
        ${storeAddress ? `<div>${storeAddress}</div>` : ''}
        ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
      </div>
    `;

    content += `
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Total Sales</div>
          <div class="summary-value">${formatPrice(totalSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Orders</div>
          <div class="summary-value">${totalOrders}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Average Order Value</div>
          <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Items Sold</div>
          <div class="summary-value">${totalItems}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Cost</div>
          <div class="summary-value">${formatPrice(totalCost)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Profit</div>
          <div class="summary-value">${formatPrice(totalProfit)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Discounts</div>
          <div class="summary-value">${formatPrice(totalDiscounts)}</div>
        </div>
      </div>
    `;

    // Add sales by payment method
    content += `
      <div class="section">
        <div class="section-title">Sales by Payment Method</div>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th class="amount">Count</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
    `;

    Object.entries(paymentMethods).forEach(([method, data]) => {
      content += `
        <tr>
          <td>${method}</td>
          <td class="amount">${data.count}</td>
          <td class="amount">${formatPrice(data.amount)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add daily breakdown
    content += `
      <div class="section">
        <div class="section-title">Daily Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th class="amount">Orders</th>
              <th class="amount">Sales Amount</th>
              <th class="amount">Profit</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Create a map of daily sales
    const dailySales: Record<string, { orders: number; amount: number; profit: number }> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || new Date());
      const dateStr = orderDate.toISOString().split('T')[0];
      if (!dailySales[dateStr]) {
        dailySales[dateStr] = { orders: 0, amount: 0, profit: 0 };
      }
      dailySales[dateStr].orders++;
      dailySales[dateStr].amount += Number(order.total);

      // Calculate profit for this order
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const orderProfit = items.reduce((sum: number, item: any) => {
        if (item.voided) return sum; // Skip voided items
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
        return sum + (Number(item.price) - itemCost) * item.quantity;
      }, 0);
      dailySales[dateStr].profit += orderProfit;
    });

    // Sort the dates for the report
    const sortedDates = Object.keys(dailySales).sort();

    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      content += `
        <tr>
          <td>${daysOfWeek[date.getDay()]} (${date.toLocaleDateString()})</td>
          <td class="amount">${dailySales[dateStr].orders}</td>
          <td class="amount">${formatPrice(dailySales[dateStr].amount)}</td>
          <td class="amount">${formatPrice(dailySales[dateStr].profit)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add summary of orders (without detailed items)
    content += `
      <div class="section">
        <div class="section-title">Order Summary</div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Time</th>
              <th>Payment Method</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    orders.forEach(order => {
      content += `
        <tr>
          <td>#${order.id}</td>
          <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
          <td>${order.paymentMethod}</td>
          <td class="amount">${formatPrice(Number(order.total))}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add summary of top selling products
    content += `
      <div class="section">
        <div class="section-title">Top Selling Products</div>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th class="amount">Quantity Sold</th>
              <th class="amount">Revenue</th>
              <th class="amount">Profit</th>
            </tr>
          </thead>
          <tbody>
    `;

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
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        const itemProfit = (Number(item.price) - itemCost) * item.quantity;
        allItemsSold[key].totalProfit += itemProfit;
      });
    });

    // Sort items by quantity sold (descending)
    const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

    sortedItems.forEach(([, item]) => {
      content += `
        <tr>
          <td>${item.name}</td>
          <td class="amount">${item.totalQuantity}</td>
          <td class="amount">${formatPrice(item.totalRevenue)}</td>
          <td class="amount">${formatPrice(item.totalProfit)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    return content;
  };

  // Helper function to generate monthly report content for A4 print
  const generateMonthlyReportContent = (orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string) => {
    const storeName = settings?.storeName || 'OpenSauce P.O.S.';
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;

    // Calculate appropriate date range for the report
    // If we have orders, use the min and max dates from the orders
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
        if (item.voided) return; // Skip voided items
        totalItems += item.quantity;
        // Calculate cost based on product cost if available
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      // Calculate profit
      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        if (item.voided) return sum; // Skip voided items
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
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

    let content = `
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="report-title">Monthly Sales Report</div>
        <div class="date-range">
          ${reportStartMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </div>
        ${storeAddress ? `<div>${storeAddress}</div>` : ''}
        ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
      </div>
    `;

    content += `
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Total Sales</div>
          <div class="summary-value">${formatPrice(totalSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Orders</div>
          <div class="summary-value">${totalOrders}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Average Order Value</div>
          <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Items Sold</div>
          <div class="summary-value">${totalItems}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Cost</div>
          <div class="summary-value">${formatPrice(totalCost)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Profit</div>
          <div class="summary-value">${formatPrice(totalProfit)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Discounts</div>
          <div class="summary-value">${formatPrice(totalDiscounts)}</div>
        </div>
      </div>
    `;

    // Add sales by payment method
    content += `
      <div class="section">
        <div class="section-title">Sales by Payment Method</div>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th class="amount">Count</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
    `;

    Object.entries(paymentMethods).forEach(([method, data]) => {
      content += `
        <tr>
          <td>${method}</td>
          <td class="amount">${data.count}</td>
          <td class="amount">${formatPrice(data.amount)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add weekly breakdown
    content += `
      <div class="section">
        <div class="section-title">Weekly Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th class="amount">Orders</th>
              <th class="amount">Sales Amount</th>
              <th class="amount">Profit</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Create a map of weekly sales
    const weeklySales: Record<string, { orders: number; amount: number; profit: number }> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || new Date());
      // Find which week this order belongs to
      const weekStart = new Date(orderDate);
      weekStart.setDate(orderDate.getDate() - orderDate.getDay()); // Start on Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End on Saturday

      const weekKey = `${weekStart.toISOString().split('T')[0]}_to_${weekEnd.toISOString().split('T')[0]}`;
      if (!weeklySales[weekKey]) {
        weeklySales[weekKey] = { orders: 0, amount: 0, profit: 0 };
      }
      weeklySales[weekKey].orders++;
      weeklySales[weekKey].amount += Number(order.total);

      // Calculate profit for this order
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const orderProfit = items.reduce((sum: number, item: any) => {
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        return sum + (Number(item.price) - itemCost) * item.quantity;
      }, 0);
      weeklySales[weekKey].profit += orderProfit;
    });

    // Sort the weeks for the report
    const sortedWeeks = Object.keys(weeklySales).sort();

    sortedWeeks.forEach(weekKey => {
      const [startStr, endStr] = weekKey.split('_to_');
      const start = new Date(startStr);
      const end = new Date(endStr);

      content += `
        <tr>
          <td>${start.toLocaleDateString()} - ${end.toLocaleDateString()}</td>
          <td class="amount">${weeklySales[weekKey].orders}</td>
          <td class="amount">${formatPrice(weeklySales[weekKey].amount)}</td>
          <td class="amount">${formatPrice(weeklySales[weekKey].profit)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add summary of orders (without detailed items)
    content += `
      <div class="section">
        <div class="section-title">Order Summary</div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Time</th>
              <th>Payment Method</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    orders.forEach(order => {
      content += `
        <tr>
          <td>#${order.id}</td>
          <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
          <td>${order.paymentMethod}</td>
          <td class="amount">${formatPrice(Number(order.total))}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add summary of top selling products
    content += `
      <div class="section">
        <div class="section-title">Top Selling Products</div>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th class="amount">Quantity Sold</th>
              <th class="amount">Revenue</th>
              <th class="amount">Profit</th>
            </tr>
          </thead>
          <tbody>
    `;

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
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        const itemProfit = (Number(item.price) - itemCost) * item.quantity;
        allItemsSold[key].totalProfit += itemProfit;
      });
    });

    // Sort items by quantity sold (descending)
    const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

    sortedItems.forEach(([, item]) => {
      content += `
        <tr>
          <td>${item.name}</td>
          <td class="amount">${item.totalQuantity}</td>
          <td class="amount">${formatPrice(item.totalRevenue)}</td>
          <td class="amount">${formatPrice(item.totalProfit)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    return content;
  };

  // Helper function to generate yearly sales report for thermal printing
  const generateYearlyReportContent = (orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string) => {
    const storeName = settings?.storeName || 'OpenSauce P.O.S.';
    const storeAddress = settings?.storeAddress;
    const storePhone = settings?.storePhone;

    // Calculate appropriate date range for the report
    // If we have orders, use the min and max dates from the orders
    let reportStartYear, reportEndYear;
    if (orders.length > 0) {
      const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
      const minDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...orderDates.map(date => date.getTime())));

      // Set to beginning of year for start, end of year for end
      reportStartYear = new Date(minDate.getFullYear(), 0, 1); // January 1st
      reportEndYear = new Date(maxDate.getFullYear(), 11, 31); // December 31st
    } else {
      // Fallback to current year if no orders
      const now = new Date();
      reportStartYear = new Date(now.getFullYear(), 0, 1); // January 1st
      reportEndYear = new Date(now.getFullYear(), 11, 31); // December 31st
    }

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
        if (item.voided) return; // Skip voided items
        totalItems += item.quantity;
        // Calculate cost based on product cost if available
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
        totalCost += itemCost * item.quantity;
      });

      // Calculate profit
      totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
        if (item.voided) return sum; // Skip voided items
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(item.cost || item.costPrice || product?.cost || 0);
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

    let content = `
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="report-title">Yearly Sales Report</div>
        <div class="date-range">
          ${reportStartYear.getFullYear()} - ${reportEndYear.getFullYear()}
        </div>
        ${storeAddress ? `<div>${storeAddress}</div>` : ''}
        ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
      </div>
    `;

    content += `
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Total Sales</div>
          <div class="summary-value">${formatPrice(totalSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Orders</div>
          <div class="summary-value">${totalOrders}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Average Order Value</div>
          <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Items Sold</div>
          <div class="summary-value">${totalItems}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Cost</div>
          <div class="summary-value">${formatPrice(totalCost)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Profit</div>
          <div class="summary-value">${formatPrice(totalProfit)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Discounts</div>
          <div class="summary-value">${formatPrice(totalDiscounts)}</div>
        </div>
      </div>
    `;

    // Add sales by payment method
    content += `
      <div class="section">
        <div class="section-title">Sales by Payment Method</div>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th class="amount">Count</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
    `;

    Object.entries(paymentMethods).forEach(([method, data]) => {
      content += `
        <tr>
          <td>${method}</td>
          <td class="amount">${data.count}</td>
          <td class="amount">${formatPrice(data.amount)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add monthly breakdown
    content += `
      <div class="section">
        <div class="section-title">Monthly Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="amount">Orders</th>
              <th class="amount">Sales Amount</th>
              <th class="amount">Profit</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Create a map of monthly sales
    const monthlySales: Record<string, { orders: number; amount: number; profit: number }> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || new Date());
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = { orders: 0, amount: 0, profit: 0 };
      }
      monthlySales[monthKey].orders++;
      monthlySales[monthKey].amount += Number(order.total);

      // Calculate profit for this order
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const orderProfit = items.reduce((sum: number, item: any) => {
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        return sum + (Number(item.price) - itemCost) * item.quantity;
      }, 0);
      monthlySales[monthKey].profit += orderProfit;
    });

    // Sort the months for the report
    const sortedMonths = Object.keys(monthlySales).sort();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    sortedMonths.forEach(monthKey => {
      const [year, monthIndex] = monthKey.split('-').map(Number);
      content += `
        <tr>
          <td>${monthNames[monthIndex]} ${year}</td>
          <td class="amount">${monthlySales[monthKey].orders}</td>
          <td class="amount">${formatPrice(monthlySales[monthKey].amount)}</td>
          <td class="amount">${formatPrice(monthlySales[monthKey].profit)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add summary of orders (without detailed items)
    content += `
      <div class="section">
        <div class="section-title">Order Summary</div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Time</th>
              <th>Payment Method</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    orders.forEach(order => {
      content += `
        <tr>
          <td>#${order.id}</td>
          <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
          <td>${order.paymentMethod}</td>
          <td class="amount">${formatPrice(Number(order.total))}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    // Add summary of top selling products
    content += `
      <div class="section">
        <div class="section-title">Top Selling Products</div>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th class="amount">Quantity Sold</th>
              <th class="amount">Revenue</th>
              <th class="amount">Profit</th>
            </tr>
          </thead>
          <tbody>
    `;

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
        const product = products.find(p => p.id === item.productId);
        const itemCost = Number(product?.cost || 0);
        const itemProfit = (Number(item.price) - itemCost) * item.quantity;
        allItemsSold[key].totalProfit += itemProfit;
      });
    });

    // Sort items by quantity sold (descending)
    const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

    sortedItems.forEach(([, item]) => {
      content += `
        <tr>
          <td>${item.name}</td>
          <td class="amount">${item.totalQuantity}</td>
          <td class="amount">${formatPrice(item.totalRevenue)}</td>
          <td class="amount">${formatPrice(item.totalProfit)}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </div>
    `;

    return content;
  };






  if (isLoadingOrders || isLoadingProducts) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <AlertCircle className="mr-2 h-6 w-6 animate-spin" />
          Loading...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 py-8 lg:px-8 print:p-0 max-w-7xl relative z-10">
          {/* Header Section */}
          <div className="flex flex-col space-y-2 mb-6 print:hidden">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2 w-fit">
              <TrendingUp className="h-3 w-3" />
              <span>Real-time Analytics</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter sm:text-4xl lg:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Reports & <span className="text-primary">Analytics</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-md">
              Monitor business performance, track sales trends, and manage transaction history with precision.
            </p>
          </div>

          {/* Controls & Actions Section - Sticky */}
          <div className="sticky top-0 z-50 bg-background/98 backdrop-blur-xl border-y border-border/50 -mx-4 px-4 lg:-mx-8 lg:px-8 shadow-md mb-10 print:hidden">
            <div className="flex flex-col space-y-6 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Time Period</span>
                    <span className="text-xs font-bold">Filter By Date</span>
                  </div>
                </div>
                <DateRangeControls
                  dateRangeStart={dateRangeStart}
                  dateRangeEnd={dateRangeEnd}
                  reportType={reportType}
                  onDateRangeStartChange={setDateRangeStart}
                  onDateRangeEndChange={setDateRangeEnd}
                  onReportTypeChange={setReportType}
                />
              </div>

              <div className="h-px w-full bg-border/50" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operations</span>
                    <span className="text-xs font-bold">Reports & Management</span>
                  </div>
                </div>
                <ActionButtons
                  onExportPDF={handleExportPDF}
                  onPrintThermal={handleShowPrintPreview}
                  onExportCSV={handleExportCSV}
                  onImportCSV={handleImportCSV}
                  onCashOut={() => setCashOutDialogOpen(true)}
                  onVoidSale={() => setOrderSelectionDialogOpen(true)}
                  reportType={reportType}
                  isExporting={isExporting}
                  isImporting={isImporting}
                />
              </div>
            </div>
          </div>

          {/* Print Header */}
          <div className="hidden print:block mb-8 text-center border-b pb-6">
            <h1 className="text-4xl font-bold uppercase tracking-widest">Business Performance Report</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Period: {new Date(dateRange.start).toLocaleDateString()} — {new Date(dateRange.end).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-10">
            {/* Quick Stats Section */}
            <section>
              <SalesMetricsCards
                totalSales={totalSales}
                totalOrders={totalOrders}
                averageOrderValue={averageOrderValue}
                totalProfit={totalProfit}
                formatPrice={formatPrice}
              />
            </section>

            {/* Visual Analytics Section */}
            <section>
              <AnalyticsCharts
                filteredOrders={analyticsOrders}
                salesByCategory={salesByCategory}
                salesByPaymentMethod={salesByPaymentMethod}
                topProducts={topProducts}
                formatPrice={formatPrice}
              />
            </section>

            {/* Detailed History Section */}
            <section className="print:mt-12">
              <OrdersTable
                orders={orders}
                onPrintOrder={handlePrintOrder}
                onVoidOrder={handleVoidOrderFromTable}
                formatPrice={formatPrice}
                canVoidOrders={isAdmin || isOwner}
              />
            </section>
          </div>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>Preview of the report that will be printed.</DialogDescription>
          </DialogHeader>
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: previewContent }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button onClick={() => { handlePrintThermal(); setShowPreview(false); }}>Print Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CashOutDialog
        open={cashOutDialogOpen}
        onOpenChange={setCashOutDialogOpen}
      />

      <OrderSelectionDialog
        open={orderSelectionDialogOpen}
        onOpenChange={setOrderSelectionDialogOpen}
        onOrderSelected={handleOrderSelected}
        onItemsSelected={(orderId, itemIds) => {
          setVoidOperationType('items');
          setSelectedOrderId(orderId);
          setSelectedItemIds(itemIds);
          setOrderSelectionDialogOpen(false);
          if (!isAdmin) {
            setPinConfirmationDialogOpen(true);
          } else {
            handleVoidItemsConfirmed();
          }
        }}
      />

      <PinConfirmationDialog
        open={pinConfirmationDialogOpen}
        onOpenChange={setPinConfirmationDialogOpen}
        onPinConfirmed={handlePinConfirmed}
      />
    </MainLayout>
  );
}
