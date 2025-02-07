import { jsPDF } from 'jspdf';
import type { Order } from '@shared/schema';

export class ReceiptPrinter {
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
    doc.text(new Date(order.createdAt).toLocaleString(), 40, 15, { align: 'center' });

    // Items
    let y = 25;
    doc.setFontSize(8);
    order.items.forEach(item => {
      doc.text(`${item.quantity}x ${item.price}`, 10, y);
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
}
