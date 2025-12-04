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

// Simple numeric keypad component for payment dialog
function SimpleNumericKeypad({ onNumberClick, onEnter }: { onNumberClick: (num: string) => void; onEnter: () => void }) {
  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '.', '⌫',
    'Enter'
  ];

  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-card rounded-lg border shadow-sm">
      {buttons.map((key) => (
        <Button
          key={key}
          variant={key === 'Enter' ? "default" : key === '⌫' ? "destructive" : "outline"}
          className="h-12 text-lg font-semibold"
          onClick={() => {
            if (key === 'Enter') {
              onEnter();
            } else if (key === '⌫') {
              onNumberClick('backspace');
            } else {
              onNumberClick(key);
            }
          }}
        >
          {key}
        </Button>
      ))}
    </div>
  );
}

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
      // Handle number input for cash amount when input is shown
      if (method === 'cash' && showCashInput) {
        if (/[0-9\.]/.test(e.key)) {
          e.preventDefault();
          setCashAmount(prev => prev + e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setCashAmount(prev => prev.slice(0, -1));
        }
      }

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

  const handleNumpadClick = (key: string) => {
    if (method === 'cash' && showCashInput) {
      if (key === 'backspace') {
        setCashAmount(prev => prev.slice(0, -1));
      } else {
        setCashAmount(prev => prev + key);
      }
    }
  };

  const handleNumpadEnter = () => {
    if (method === 'cash' && showCashInput && cashProvided >= total) {
      handlePayment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full max-h-full p-0 gap-0 bg-background">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="text-2xl font-bold">Process Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose payment method and complete the transaction
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Payment Form Section */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="max-w-md mx-auto lg:mx-0">
                {/* Total Amount Display */}
                <div className="text-center mb-8">
                  <div className="text-sm text-muted-foreground mb-2">Total Amount</div>
                  <div className="text-4xl lg:text-5xl font-bold text-primary">
                    {formatPrice(total)}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <RadioGroup
                    value={method}
                    onValueChange={(value) => {
                      setMethod(value);
                      setShowCashInput(false);
                      setCashAmount('');
                    }}
                    className="grid gap-3"
                    data-testid="payment-method-group"
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <RadioGroupItem value="cash" id="cash" data-testid="radio-cash" />
                      <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                          <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium">Cash Payment</div>
                          <div className="text-sm text-muted-foreground">Accept cash and calculate change</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <RadioGroupItem value="receipt_only" id="receipt_only" data-testid="radio-receipt-only" />
                      <Label htmlFor="receipt_only" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">Receipt Only</div>
                          <div className="text-sm text-muted-foreground">No payment required</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Cash Input Section */}
                {method === 'cash' && showCashInput && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="cash-amount" className="text-base font-medium">Cash Amount Received</Label>
                      <Input
                        id="cash-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="mt-2 h-12 text-lg"
                        autoFocus
                      />
                    </div>

                    {cashProvided > 0 && (
                      <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                        <h4 className="font-medium">Payment Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-medium">{formatPrice(total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cash Received:</span>
                            <span className="font-medium">{formatPrice(cashProvided)}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between text-lg font-bold">
                            <span>Change Due:</span>
                            <span className={change > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                              {formatPrice(change)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 h-12"
                    data-testid="button-cancel-payment"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    className="flex-1 h-12 text-base"
                    disabled={method === 'cash' && showCashInput && cashProvided < total}
                    data-testid="button-process-payment"
                  >
                    {method === 'cash' && !showCashInput ? 'Enter Cash Amount' : 'Complete Payment'}
                  </Button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <div>Keyboard: Alt+1 (Cash) • Alt+2 (Receipt) • Enter (Process) • Esc (Cancel)</div>
                </div>
              </div>
            </div>

            {/* Touchscreen Numpad Section */}
            {method === 'cash' && showCashInput && (
              <div className="lg:w-96 border-l bg-muted/20 p-6 lg:p-8">
                <div className="max-w-sm mx-auto">
                  <h3 className="text-lg font-semibold mb-4 text-center">Numeric Keypad</h3>
                  <SimpleNumericKeypad
                    onNumberClick={handleNumpadClick}
                    onEnter={handleNumpadEnter}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Touch the buttons or use your keyboard
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
