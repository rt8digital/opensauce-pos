import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Settings } from '@shared/schema';

interface ReceiptPreviewProps {
  settings: Settings;
  logoPreview: string | null;
}

export function ReceiptPreview({ settings, logoPreview }: ReceiptPreviewProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Receipt Preview</CardTitle>
        <CardDescription>Live preview of your receipt</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`bg-white text-black p-4 font-mono ${settings.receiptFontSize === 'small' ? 'text-xs' :
              settings.receiptFontSize === 'large' ? 'text-base' : 'text-sm'
            }`}
          style={{
            width: settings.receiptWidth === 'custom'
              ? `${settings.receiptCustomWidth}mm`
              : settings.receiptWidth === '58mm' ? '58mm' : '80mm'
          }}
        >
          {settings.receiptShowLogo && logoPreview && (
            <div className="text-center mb-2">
              <img src={logoPreview} alt="Logo" className="max-h-12 mx-auto" />
            </div>
          )}

          <div className="text-center mb-2">
            <div className="font-bold">{settings.storeName}</div>
            {settings.storeAddress && <div className="text-xs">{settings.storeAddress}</div>}
            {settings.storePhone && <div className="text-xs">{settings.storePhone}</div>}
          </div>

          {settings.receiptHeaderText && (
            <div className="text-center text-xs mb-2 border-t border-b border-dashed py-1">
              {settings.receiptHeaderText}
            </div>
          )}

          <div className="border-t border-black my-2"></div>

          {settings.receiptShowOrderNumber && (
            <div className="flex justify-between text-xs">
              <span>Order #</span>
              <span>12345</span>
            </div>
          )}
          {settings.receiptShowDate && (
            <div className="flex justify-between text-xs">
              <span>Date</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          )}
          {settings.receiptShowCustomer && (
            <div className="flex justify-between text-xs">
              <span>Customer</span>
              <span>John Doe</span>
            </div>
          )}
          {settings.receiptShowPaymentMethod && (
            <div className="flex justify-between text-xs">
              <span>Payment</span>
              <span>Cash</span>
            </div>
          )}

          <div className="border-t border-black my-2"></div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Sample Item</span>
              <span>{settings.currency}10.00</span>
            </div>
            <div className="text-xs ml-2">2 x {settings.currency}5.00</div>
          </div>

          <div className="border-t border-black my-2"></div>

          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{settings.currency}10.00</span>
          </div>

          {settings.receiptFooterText && (
            <div className="text-center text-xs mt-2 border-t border-dashed pt-2">
              {settings.receiptFooterText}
            </div>
          )}

          {settings.receiptShowBarcode && (
            <div className="text-center mt-2">
              <div className="text-xs">*12345*</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}