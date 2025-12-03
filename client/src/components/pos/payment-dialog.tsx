import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Banknote, Receipt } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onProcessPayment: (method: string) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onProcessPayment
}: PaymentDialogProps) {
  const [method, setMethod] = React.useState('cash');
  const [cashAmount, setCashAmount] = React.useState('');
  const [showCashInput, setShowCashInput] = React.useState(false);
  const { formatPrice } = useCurrency();

  const cashProvided = parseFloat(cashAmount) || 0;
  const change = Math.max(0, cashProvided - total);

  const handlePayment = () => {
    if (method === 'cash' && !showCashInput) {
      setShowCashInput(true);
      return;
    }
    onProcessPayment(method);
    onOpenChange(false);
    setShowCashInput(false);
    setCashAmount('');
  };

  const handleCancel = () => {
    setShowCashInput(false);
    setCashAmount('');
    onOpenChange(false);
  };

  // Keyboard shortcuts for payment
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 1/2 for payment methods
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setMethod('cash');
        setShowCashInput(false);
        setCashAmount('');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setMethod('receipt_only');
        setShowCashInput(false);
        setCashAmount('');
      }
      // Enter to process payment
      else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handlePayment();
      }
      // Escape to cancel
      else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, method, showCashInput]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Use Alt+1/2 for payment methods, Enter to process
          </p>
        </DialogHeader>

        <div className="py-6">
          <div className="mb-6 text-center">
            <span className="text-3xl font-bold">
              {formatPrice(total)}
            </span>
          </div>

          <RadioGroup
            value={method}
            onValueChange={(value) => {
              setMethod(value);
              setShowCashInput(false);
              setCashAmount('');
            }}
            className="grid gap-4"
            data-testid="payment-method-group"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" data-testid="radio-cash" />
              <Label htmlFor="cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="receipt_only" id="receipt_only" data-testid="radio-receipt-only" />
              <Label htmlFor="receipt_only" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Receipt Only
              </Label>
            </div>
          </RadioGroup>

          {method === 'cash' && showCashInput && (
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="cash-amount">Cash Amount Received</Label>
                <Input
                  id="cash-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>

              {cashProvided > 0 && (
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cash Received:</span>
                    <span>{formatPrice(cashProvided)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Change:</span>
                    <span className={change > 0 ? 'text-green-600' : ''}>
                      {formatPrice(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" data-testid="button-cancel-payment" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            data-testid="button-process-payment"
            onClick={handlePayment}
            disabled={method === 'cash' && showCashInput && cashProvided < total}
          >
            {method === 'cash' && !showCashInput ? 'Enter Cash Amount' : 'Process Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
