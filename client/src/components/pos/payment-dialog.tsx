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
}

export function PaymentDialog({ open, onOpenChange, total, onProcessPayment }: PaymentDialogProps) {
  const [method, setMethod] = React.useState('card');

  const handlePayment = () => {
    onProcessPayment(method);
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
              ${total.toFixed(2)}
            </span>
          </div>
          
          <RadioGroup
            value={method}
            onValueChange={setMethod}
            className="grid gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Card
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="qr" id="qr" />
              <Label htmlFor="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Payment
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePayment}>
            Process Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
