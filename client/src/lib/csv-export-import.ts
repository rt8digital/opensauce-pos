import Papa from 'papaparse';
import type { Order, NewOrder } from '../../../shared/types';

export interface ImportResult {
  successCount: number;
  errors: string[];
}

// Define the CSV columns for orders
const ORDER_CSV_HEADERS = [
  'id',
  'customerId',
  'userId',
  'items',
  'total',
  'paymentMethod',
  'source',
  'status',
  'notes',
  'createdAt',
  'cashReceived',
  'change',
  'discount'
];

// Validation rules for import
export function validateOrderRow(row: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!row.createdAt) {
    errors.push('Date (createdAt) is required');
  } else {
    // Check if date is valid
    const date = new Date(row.createdAt);
    if (isNaN(date.getTime())) {
      errors.push('Date (createdAt) must be a valid date');
    }
  }

  if (!row.total || isNaN(Number(row.total))) {
    errors.push('Amount (total) is required and must be a number');
  } else if (Number(row.total) <= 0) {
    errors.push('Amount (total) must be greater than 0');
  }

  if (row.items) {
    try {
      const items = JSON.parse(row.items);
      if (!Array.isArray(items)) {
        errors.push('Items must be a valid JSON array');
      } else if (items.length === 0) {
        errors.push('Items array cannot be empty');
      } else {
        // Check each item has productId
        for (const item of items) {
          if (!item.productId) {
            errors.push('Each item must have a productId');
            break;
          }
          if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
            errors.push('Each item must have a valid quantity > 0');
            break;
          }
          if (!item.price || isNaN(Number(item.price))) {
            errors.push('Each item must have a valid price');
            break;
          }
        }
      }
    } catch (e) {
      errors.push('Items must be valid JSON');
    }
  } else {
    errors.push('Items is required');
  }

  // Optional validations
  if (row.paymentMethod && typeof row.paymentMethod !== 'string') {
    errors.push('Payment method must be a string');
  }

  if (row.status && !['pending', 'confirmed', 'completed', 'cancelled'].includes(row.status)) {
    errors.push('Status must be one of: pending, confirmed, completed, cancelled');
  }

  return { isValid: errors.length === 0, errors };
}

// Export orders to CSV string
export function exportOrdersToCSV(orders: Order[]): string {
  const data = orders.map(order => ({
    id: order.id,
    customerId: order.customerId || '',
    userId: order.userId || '',
    items: JSON.stringify(order.items), // Ensure it's stringified
    total: order.total,
    paymentMethod: order.paymentMethod,
    source: order.source || 'pos',
    status: order.status || 'pending',
    notes: order.notes || '',
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
    cashReceived: order.cashReceived || '',
    change: order.change || '',
    discount: order.discount || '0'
  }));

  return Papa.unparse({
    fields: ORDER_CSV_HEADERS,
    data
  });
}

// Parse and validate CSV content for import
export function parseAndValidateCSV(csvContent: string): { validOrders: NewOrder[]; errors: string[] } {
  const results = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim()
  });

  const validOrders: NewOrder[] = [];
  const errors: string[] = [];

  if (results.errors.length > 0) {
    errors.push(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
    return { validOrders, errors };
  }

  results.data.forEach((row: any, index: number) => {
    const validation = validateOrderRow(row);
    if (validation.isValid) {
      // Convert to NewOrder format
      const newOrder: NewOrder = {
        customerId: row.customerId ? Number(row.customerId) : undefined,
        userId: row.userId ? Number(row.userId) : undefined,
        items: JSON.parse(row.items),
        total: row.total,
        paymentMethod: row.paymentMethod,
        source: row.source || 'pos',
        status: row.status || 'pending',
        notes: row.notes || undefined,
        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
        cashReceived: row.cashReceived || undefined,
        change: row.change || undefined,
        discount: row.discount || '0'
      };
      validOrders.push(newOrder);
    } else {
      errors.push(`Row ${index + 2}: ${validation.errors.join(', ')}`);
    }
  });

  return { validOrders, errors };
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string = 'sales-export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}