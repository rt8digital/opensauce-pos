import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Mail } from "lucide-react";
import type { Order, Product, Customer, Settings } from "../../../../shared/types";
import { format } from "date-fns";
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '@/contexts/currency-context';
import { usePeripherals } from '@/hooks/use-peripherals';
import {
  getPreviewClasses,
  formatStoreInfo
} from '@/lib/receipt-formatter';

interface ReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  products: Product[];
  customer?: Customer | null;
}

export const Receipt = React.memo(function Receipt({ open, onOpenChange, order, products, customer }: ReceiptProps) {
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });
  const { formatPrice } = useCurrency();
  const { printReceipt } = usePeripherals();

  const orderItems = React.useMemo(() => {
    if (!order) return [];
    const orderItemsRaw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    return (Array.isArray(orderItemsRaw) ? orderItemsRaw : []).map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        product,
      };
    });
  }, [order, products]);

  if (!order) return null;

  const handlePrint = async () => {
    if (order) {
      await printReceipt(order);
    }
  };

  const handleEmail = () => {
    alert(`Receipt emailed to ${customer?.email || "customer"}`);
  };

  const classes = React.useMemo(() => (settings ? getPreviewClasses(settings) : {}) as any, [settings]);

  const storeInfo = React.useMemo(() => settings ? formatStoreInfo({
    name: settings.storeName || "OpenSauce P.O.S.",
    address: settings.storeAddress,
    phone: settings.storePhone,
    email: settings.storeEmail
  }, settings) : null, [settings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
        </DialogHeader>

        <div className={`space-y-6 bg-white text-black p-4 rounded-lg shadow-inner ${settings?.receiptCompactMode ? 'space-y-2' : ''}`} id="receipt-content">
          {settings?.receiptShowLogo && settings?.storeLogo && (
            <div className="text-center">
              <img src={settings.storeLogo} alt="Store Logo" className="mx-auto object-contain" style={{ maxHeight: `${60 * (classes.logoScale)}px` }} />
            </div>
          )}

          {storeInfo && (
            <div className="text-center" style={{ fontSize: classes.headerSize, fontFamily: classes.headerFamily }}>
              <div className="font-bold text-xl">{storeInfo.name}</div>
              {storeInfo.address && <div className="opacity-80">{storeInfo.address}</div>}
              {storeInfo.phone && <div className="opacity-80">{storeInfo.phone}</div>}
              {storeInfo.email && <div className="opacity-80">{storeInfo.email}</div>}
            </div>
          )}

          {settings?.receiptHeaderText && (
            <div className={`text-center text-xs italic opacity-70 border-y border-black/5 py-2`}>
              {settings.receiptHeaderText}
            </div>
          )}

          <div className="h-px bg-black/10 w-full" />

          <div className="space-y-1" style={{ fontSize: classes.metadataSize, fontFamily: classes.metadataFamily }}>
            {settings?.receiptShowOrderNumber && (
              <div className="flex justify-between">
                <span className="opacity-60 uppercase font-bold text-[0.9em]">Order Reference</span>
                <span>#{order.id}</span>
              </div>
            )}
            {settings?.receiptShowDate && (
              <div className="flex justify-between">
                <span className="opacity-60 uppercase font-bold text-[0.9em]">Transaction Date</span>
                <span>{format(new Date(order.createdAt || new Date()), "PPpp")}</span>
              </div>
            )}
            {customer && settings?.receiptShowCustomer && (
              <div className="flex justify-between">
                <span className="opacity-60 uppercase font-bold text-[0.9em]">Customer</span>
                <span>{customer.name}</span>
              </div>
            )}
            {settings?.receiptShowPaymentMethod && (
              <div className="flex justify-between">
                <span className="opacity-60 uppercase font-bold text-[0.9em]">Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-black/10 w-full" />

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black opacity-40">
              <span>DESCRIPTION</span>
              <span>TOTAL</span>
            </div>

            <div className={settings?.receiptCompactMode ? 'space-y-0.5' : 'space-y-3'}>
              {orderItems.filter((item: any) => !item.voided).map((item: any, index: number) => {
                const actualPrice = Number(item.discountedPrice || item.price);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-start" style={{ fontSize: classes.itemsSize, fontFamily: classes.itemsFamily }}>
                      <div className="flex-1 pr-2">
                        <div className="font-bold leading-none">{item.product?.name || "Custom"}</div>
                        <div style={{ fontSize: classes.detailsSize, fontFamily: classes.detailsFamily }}>{item.quantity} x {formatPrice(actualPrice)}</div>
                      </div>
                      <span className="font-bold whitespace-nowrap" style={{ fontFamily: classes.numbersFamily }}>{formatPrice(item.quantity * actualPrice)}</span>
                    </div>
                    {settings?.receiptShowItemDivider && index < orderItems.length - 1 && (
                      <div
                        className="w-full border-t mt-2"
                        style={{
                          borderStyle: settings.receiptItemDividerStyle || 'dashed',
                          borderColor: 'black',
                          opacity: classes.dividerOpacity
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-0.5 bg-black/20 w-full" />

          <div className="space-y-1" style={{ fontFamily: classes.numbersFamily }}>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">SUBTOTAL</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>

            {settings?.receiptShowTotalDivider && (
              <div className="w-full border-t-2 border-black/20 my-1" />
            )}

            <div className="flex justify-between font-black border-t border-black/10 pt-2" style={{ fontSize: classes.numbersSize }}>
              <span className="text-sm">TOTAL</span>
              <span className="text-base">{formatPrice(Number(order.total))}</span>
            </div>

            {order.cashReceived && (
              <div className="space-y-1 mt-2 pt-2 border-t border-dashed border-black/10">
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">CASH RECEIVED</span>
                  <span>{formatPrice(Number(order.cashReceived))}</span>
                </div>
                <div className="flex justify-between font-bold text-green-700">
                  <span>CHANGE DUE</span>
                  <span>{formatPrice(Number(order.change || '0'))}</span>
                </div>
              </div>
            )}
          </div>

          {settings?.receiptFooterText && (
            <div className="text-[10px] mt-6 opacity-60 leading-relaxed text-center px-2">
              {settings.receiptFooterText}
            </div>
          )}

          {settings?.receiptShowQrCode && settings?.paymentQrCode && (
            <div className="mt-8 text-center flex flex-col items-center">
              <img
                src={settings.paymentQrCode}
                alt="Payment QR Code"
                className="mx-auto border border-black/5 p-1 rounded-sm shadow-sm"
                style={{
                  width: `${120 * (classes.qrCodeScale || 1)}px`,
                  height: `${120 * (classes.qrCodeScale || 1)}px`
                }}
              />
              <div className="mt-1.5 opacity-40 font-black text-[9px] uppercase tracking-widest">
                Scan to Pay
              </div>
            </div>
          )}

          {settings?.receiptShowBarcode && (
            <div className="mt-6 opacity-80 text-center">
              <div className="h-8 w-full bg-black/10 flex items-center justify-center font-mono text-[10px] tracking-[0.2em]">*{order.id}*</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 print:hidden">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleEmail} disabled={!customer?.email}>
            <Mail className="mr-2 h-4 w-4" />
            Email Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});