import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Printer, Mail } from "lucide-react";
import type { Order, Product, Customer, Settings } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '@/contexts/currency-context';

interface ReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  products: Product[];
  customer?: Customer | null;
}

export function Receipt({ open, onOpenChange, order, products, customer }: ReceiptProps) {
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });
  const { formatPrice } = useCurrency();

  if (!order) return null;

  const orderItems = (JSON.parse(order.items) as any[]).map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      product,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // Mock email sending
    alert(`Receipt emailed to ${customer?.email || "customer"}`);
  };

  // Use settings or fallback to defaults
  const storeName = settings?.storeName || "OpenSauce P.O.S.";
  const storeAddress = settings?.storeAddress;
  const storePhone = settings?.storePhone;
  const storeLogo = settings?.storeLogo;
  const headerText = settings?.receiptHeaderText;
  const footerText = settings?.receiptFooterText;
  const showLogo = settings?.receiptShowLogo ?? true;
  const showOrderNumber = settings?.receiptShowOrderNumber ?? true;
  const showDate = settings?.receiptShowDate ?? true;
  const showCustomer = settings?.receiptShowCustomer ?? true;
  const showPaymentMethod = settings?.receiptShowPaymentMethod ?? true;
  const showBarcode = settings?.receiptShowBarcode ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-6" id="receipt-content">
          {showLogo && storeLogo && (
            <div className="text-center">
              <img src={storeLogo} alt="Store Logo" className="max-h-16 mx-auto" />
            </div>
          )}

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{storeName}</h2>
            {storeAddress && (
              <p className="text-sm text-muted-foreground">{storeAddress}</p>
            )}
            {storePhone && (
              <p className="text-sm text-muted-foreground">Tel: {storePhone}</p>
            )}
          </div>

          {headerText && (
            <div className="text-center text-sm border-y border-dashed py-2">
              {headerText}
            </div>
          )}

          <Separator />

          <div className="space-y-1 text-sm">
            {showOrderNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order #</span>
                <span className="font-medium">{order.id}</span>
              </div>
            )}
            {showDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{format(new Date(order.createdAt || new Date()), "PPpp")}</span>
              </div>
            )}
            {showCustomer && customer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span>{customer.name}</span>
              </div>
            )}
            {showPaymentMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <span className="font-medium">
                    {item.product?.name || "Unknown Item"}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} x {formatPrice(Number(item.price))}
                  </div>
                </div>
                <span>{formatPrice(item.quantity * Number(item.price))}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
          </div>

          {footerText && (
            <div className="text-center text-sm border-t border-dashed pt-2">
              {footerText}
            </div>
          )}

          {showBarcode && (
            <div className="text-center text-sm font-mono">
              *{order.id}*
            </div>
          )}

          {!footerText && !showBarcode && (
            <div className="text-center text-sm text-muted-foreground pt-4">
              Thank you for your business!
            </div>
          )}
        </div>

        <div className="flex gap-2 print:hidden">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleEmail} disabled={!customer?.email}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
