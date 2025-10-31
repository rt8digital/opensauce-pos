import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Banknote, QrCode } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onProcessPayment: (method: string) => void;
  currency?: string;
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  total, 
  onProcessPayment,
  currency = '$'
}: PaymentDialogProps) {
  const [method, setMethod] = React.useState('card');
  const [qrStatus, setQrStatus] = React.useState<'waiting' | 'received' | null>(null);
  const [savedQRImage, setSavedQRImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const qrImage = localStorage.getItem('qrCodeImage');
    setSavedQRImage(qrImage);
  }, [open]);

  const handlePayment = () => {
    if (method === 'qr' && qrStatus !== 'received') {
      setQrStatus('waiting');
      return;
    }
    onProcessPayment(method);
    onOpenChange(false);
    setQrStatus(null);
  };

  const handleQRPaymentReceived = () => {
    setQrStatus('received');
  };

  const handleCancel = () => {
    setQrStatus(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="mb-6 text-center">
            <span className="text-3xl font-bold">
              {currency}{total.toFixed(2)}
            </span>
          </div>

          <RadioGroup
            value={method}
            onValueChange={setMethod}
            className="grid gap-4"
            data-testid="payment-method-group"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" data-testid="radio-card" />
              <Label htmlFor="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Card
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" data-testid="radio-cash" />
              <Label htmlFor="cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="qr" id="qr" data-testid="radio-qr" />
              <Label htmlFor="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Payment
              </Label>
            </div>
          </RadioGroup>

          {method === 'qr' && qrStatus === 'waiting' && (
            <div className="mt-4 text-center">
              <div className="bg-muted p-4 rounded-lg mb-4">
                {savedQRImage ? (
                  <img src={savedQRImage} alt="Payment QR Code" className="h-48 w-48 mx-auto mb-2" />
                ) : (
                  <QrCode className="h-32 w-32 mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  Scan QR code to make payment
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-cancel-qr"
                  onClick={() => setQrStatus(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  data-testid="button-payment-received"
                  onClick={handleQRPaymentReceived}
                >
                  Payment Received
                </Button>
              </div>
            </div>
          )}
        </div>

        {(!method || method !== 'qr' || qrStatus === 'received') && (
          <div className="flex justify-end gap-4">
            <Button variant="outline" data-testid="button-cancel-payment" onClick={handleCancel}>
              Cancel
            </Button>
            <Button data-testid="button-process-payment" onClick={handlePayment}>
              {method === 'qr' ? 'Complete Payment' : 'Process Payment'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}