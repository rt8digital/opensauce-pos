import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import type { Order } from '@shared/schema';
import { ReceiptPrinter } from '@/lib/printer';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  currency?: string;
}

export function ReceiptDialog({ open, onOpenChange, order, currency = '$' }: ReceiptDialogProps) {
  const handlePrint = async () => {
    await ReceiptPrinter.print(order);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="text-center space-y-2">
            <h2 className="font-bold text-xl">STORE RECEIPT</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.productName}</span>
                  <span>
                    {currency}{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.quantity}x {currency}{Number(item.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{currency}{Number(order.total).toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Paid via {order.paymentMethod}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            <Download className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
