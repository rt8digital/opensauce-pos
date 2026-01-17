import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, Receipt } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import type { Product } from '../../../../shared/types';

// Simple numeric keypad component for payment dialog
function SimpleNumericKeypad({ onNumberClick, onEnter }: { onNumberClick: (num: string) => void; onEnter: () => void }) {
  // Define the layout as a 4x4 grid
  const rows = [
    ['7', '8', '9', '⌫'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '×'], // Using multiplication symbol as "x-time"
    ['0', '.', 'Enter', 'Enter'] // Last two positions for Enter button
  ];

  return (
    <div className="grid grid-cols-4 gap-2 p-2 bg-card rounded-lg border shadow-sm w-full">
      {rows.map((row, rowIndex) =>
        row.map((key, colIndex) => {
          // Special handling for the Enter button in the last row
          if (rowIndex === 3 && colIndex === 2) {
            // This is the first position for Enter (spanning 2 columns)
            return (
              <Button
                key={`enter-${rowIndex}`}
                variant="default"
                className="h-12 sm:h-14 lg:h-16 text-sm sm:text-base lg:text-lg font-semibold col-span-2"
                onClick={onEnter}
              >
                Enter
              </Button>
            );
          }
          // Skip the next position since Enter spans 2 columns
          else if (rowIndex === 3 && colIndex === 3) {
            return null; // Skip this cell
          }

          // Regular buttons
          return (
            <Button
              key={`${key}-${rowIndex}-${colIndex}`}
              variant={key === '⌫' ? "destructive" : "outline"}
              className="h-14 sm:h-16 text-base sm:text-lg font-semibold aspect-square"
              onClick={() => {
                if (key === '⌫') {
                  onNumberClick('backspace');
                } else {
                  onNumberClick(key);
                }
              }}
            >
              {key}
            </Button>
          );
        })
      ).flat().filter(Boolean)}
    </div>
  );
}

interface CartItem {
  product: Product | { id: number; name: string; price: string };
  quantity: number;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cart: CartItem[];
  onProcessPayment: (method: string, cashReceived?: string, change?: string, updatedCart?: CartItem[]) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  cart,
  onProcessPayment
}: PaymentDialogProps) {
  const [method, setMethod] = React.useState('cash');
  const [priceInputs, setPriceInputs] = React.useState<Record<number, string>>({});
  const [cashAmount, setCashAmount] = React.useState('');
  const [showCashInput, setShowCashInput] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  // Initialize price inputs from cart
  React.useEffect(() => {
    if (open) {
      const initialInputs: Record<number, string> = {};
      cart.forEach(item => {
        initialInputs[item.product.id] = item.product.price.toString();
      });
      setPriceInputs(initialInputs);
    }
  }, [open, cart]);

  const cashProvided = parseFloat(cashAmount) || 0;

  // Calculate total based on whether discounts are applied
  const calculatedTotal = React.useMemo(() => {
    if (method === 'cash_with_discount') {
      // Calculate total with discounted prices from inputs
      return cart.reduce((sum, item) => {
        const inputPrice = priceInputs[item.product.id];
        const price = inputPrice !== undefined ? parseFloat(inputPrice) || 0 : Number(item.product.price);
        return sum + (price * item.quantity);
      }, 0);
    }
    return total; // Use original total for non-discounted methods
  }, [cart, priceInputs, method, total]);

  const change = Math.max(0, cashProvided - calculatedTotal);

  const handlePayment = () => {
    if ((method === 'cash' || method === 'cash_with_discount') && !showCashInput) {
      setShowCashInput(true);
      return;
    }

    const cashReceivedValue = (method === 'cash' || method === 'cash_with_discount') ? cashAmount : undefined;
    const changeValue = (method === 'cash' || method === 'cash_with_discount') ? change.toString() : undefined;

    // Prepare cart items with discount information if applicable
    const updatedCart = cart.map(item => {
      const inputPrice = priceInputs[item.product.id];
      const originalPrice = item.product.price.toString();

      if (method === 'cash_with_discount' && inputPrice !== undefined && inputPrice !== originalPrice) {
        return {
          ...item,
          originalPrice,
          discountedPrice: inputPrice
        };
      }
      return item;
    });

    onProcessPayment(method, cashReceivedValue, changeValue, updatedCart);
    onOpenChange(false);
    setShowCashInput(false);
    setCashAmount('');
  };

  const handleCancel = () => {
    setShowCashInput(false);
    setCashAmount('');
    onOpenChange(false);
  };

  // Focus trap and keyboard shortcuts for payment
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the target is an input element to allow normal typing
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      if (isInputElement) {
        const isCtrlEnter = e.key === 'Enter' && e.ctrlKey && !e.shiftKey && !e.altKey;
        const isPlainEnter = e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey;

        // Allow Ctrl+Enter to fall through to the global handler even if in an input
        if (isCtrlEnter) {
          // let it fall through
        }
        // Special case: Allow plain Enter in the cash amount input to process payment
        else if (isPlainEnter && target.id === 'cash-amount') {
          if (cashProvided >= calculatedTotal) {
            e.preventDefault();
            handleNumpadEnter();
          }
          return; // Stop here for other enters in the cash input
        } else {
          // For all other keys or inputs, return early to allow native browser behavior
          return;
        }
      }

      // Stop immediate propagation to prevent parent components from receiving the event
      e.stopImmediatePropagation();



      // Alt + 1/2/3 for payment methods
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setMethod('cash');
        setShowCashInput(false);
        setCashAmount('');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setMethod('cash_with_discount');
        setShowCashInput(false);
        setCashAmount('');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setMethod('receipt_only');
        setShowCashInput(false);
        setCashAmount('');
      }
      // Ctrl+Enter to process payment (checkout shortcut)
      else if (e.key === 'Enter' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Only process payment if there's enough cash (for cash methods)
        if (((method === 'cash' || method === 'cash_with_discount') && showCashInput && cashProvided >= calculatedTotal) ||
          (method !== 'cash' && method !== 'cash_with_discount')) {
          handlePayment();
        }
      }
      // Enter to process payment (but allow Enter in input fields, except for the process payment button)
      else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        // Allow Enter when focused on the process payment button
        const processButton = document.querySelector('[data-testid="button-process-payment"]') as HTMLButtonElement;
        if (processButton && document.activeElement === processButton) {
          e.preventDefault();
          // Only process payment if there's enough cash (for cash methods)
          if (((method === 'cash' || method === 'cash_with_discount') && showCashInput && cashProvided >= calculatedTotal) ||
            (method !== 'cash' && method !== 'cash_with_discount')) {
            handlePayment();
          }
        }
        // For other non-input elements, process payment
        else if (!isInputElement) {
          e.preventDefault();
          // Only process payment if there's enough cash (for cash methods)
          if (((method === 'cash' || method === 'cash_with_discount') && showCashInput && cashProvided >= calculatedTotal) ||
            (method !== 'cash' && method !== 'cash_with_discount')) {
            handlePayment();
          }
        }
      }
      // Escape to cancel
      else if (e.key === 'Escape' && !isInputElement) {
        e.preventDefault();
        handleCancel();
      }
    };

    // Add the event listener to the container to ensure events are captured within the dialog
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown, { capture: true });
    } else {
      // Fallback to window if container is not available
      window.addEventListener('keydown', handleKeyDown);
    }

    // Focus management when dialog opens
    const focusableElements = container?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as NodeListOf<HTMLElement>;
    if (focusableElements && focusableElements.length > 0) {
      // Small delay to ensure the dialog is fully rendered before focusing
      const timer = setTimeout(() => {
        const firstElement = focusableElements[0];
        if (firstElement && !showCashInput) {
          firstElement.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // Prevent background scrolling when dialog is open
    document.body.style.overflow = 'hidden';

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown, { capture: true });
      } else {
        window.removeEventListener('keydown', handleKeyDown);
      }
      // Restore scrolling when dialog closes
      document.body.style.overflow = '';
    };
  }, [open, method, showCashInput]); // Removed calculatedTotal and cashProvided dependencies to prevent focus jumping

  // Specific effect to focus the cash input when it's shown
  React.useEffect(() => {
    if (open && showCashInput) {
      const timer = setTimeout(() => {
        const cashInput = document.getElementById('cash-amount');
        if (cashInput) {
          cashInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, showCashInput]);

  // Additional effect for focus trapping to keep focus within the dialog
  React.useEffect(() => {
    if (!open) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as NodeListOf<HTMLElement>;
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Stop immediate propagation to prevent parent components from receiving the event
        e.stopImmediatePropagation();
        // If shift + tab and first element is focused, focus last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If tab and last element is focused, focus first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [open]);

  const handleNumpadClick = (key: string) => {
    if ((method === 'cash' || method === 'cash_with_discount') && showCashInput) {
      if (key === 'backspace') {
        setCashAmount(prev => prev.slice(0, -1));
      } else {
        setCashAmount(prev => prev + key);
      }
    }
  };

  const handleNumpadEnter = () => {
    if ((method === 'cash' || method === 'cash_with_discount') && showCashInput && cashProvided >= calculatedTotal) {
      handlePayment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-full h-full max-h-full p-0 gap-0 bg-background"
        ref={containerRef}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="text-2xl font-bold">Process Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose payment method and complete the transaction
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Total Amount Display - moved to the top of the content area */}
          <div className="px-6 py-4 bg-primary/5 border-b">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                  {formatPrice(calculatedTotal)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Payment Form Section */}
            <div className="lg:w-1/4 p-6 lg:p-8 flex flex-col">
              <div className="max-w-md mx-auto lg:mx-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto pb-4">
                  {/* Payment Methods */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        variant={method === 'cash' ? 'default' : 'outline'}
                        className={`h-14 sm:h-16 lg:h-18 flex items-center justify-start px-2 gap-2 sm:px-3 sm:gap-3 border-2 transition-all ${method === 'cash' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                        onClick={() => {
                          setMethod('cash');
                          setShowCashInput(false);
                          setCashAmount('');
                        }}
                      >
                        <div className={`p-2 sm:p-3 rounded-full ${method === 'cash' ? 'bg-primary-foreground/20' : 'bg-green-100 dark:bg-green-900/40'}`}>
                          <Banknote className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${method === 'cash' ? 'text-primary-foreground' : 'text-green-600 dark:text-green-400'}`} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm lg:text-base font-bold">CASH</div>
                          <div className="text-xs opacity-80 font-medium">Standard Payment</div>
                        </div>
                      </Button>

                      <Button
                        type="button"
                        variant={method === 'cash_with_discount' ? 'default' : 'outline'}
                        className={`h-14 sm:h-16 lg:h-18 flex items-center justify-start px-2 gap-2 sm:px-3 sm:gap-3 border-2 transition-all ${method === 'cash_with_discount' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                        onClick={() => {
                          setMethod('cash_with_discount');
                          setShowCashInput(false);
                          setCashAmount('');
                        }}
                      >
                        <div className={`p-2 sm:p-3 rounded-full ${method === 'cash_with_discount' ? 'bg-primary-foreground/20' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
                          <Banknote className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${method === 'cash_with_discount' ? 'text-primary-foreground' : 'text-yellow-600 dark:text-yellow-400'}`} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm lg:text-base font-bold">DISCOUNT</div>
                          <div className="text-xs opacity-80 font-medium">Cash + Edit Prices</div>
                        </div>
                      </Button>

                      <Button
                        type="button"
                        variant={method === 'receipt_only' ? 'default' : 'outline'}
                        className={`h-14 sm:h-16 lg:h-18 flex items-center justify-start px-2 gap-2 sm:px-3 sm:gap-3 border-2 transition-all ${method === 'receipt_only' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                        onClick={() => {
                          setMethod('receipt_only');
                          setShowCashInput(false);
                          setCashAmount('');
                        }}
                      >
                        <div className={`p-2 sm:p-3 rounded-full ${method === 'receipt_only' ? 'bg-primary-foreground/20' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                          <Receipt className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${method === 'receipt_only' ? 'text-primary-foreground' : 'text-blue-600 dark:text-blue-400'}`} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm lg:text-base font-bold">RECEIPT</div>
                          <div className="text-xs opacity-80 font-medium">Print Only</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Cash Input Section */}
                  {(method === 'cash' || method === 'cash_with_discount') && showCashInput && (
                    <div className="space-y-6 mb-6">
                      <div>
                        <Label htmlFor="cash-amount" className="text-base font-medium">Cash Amount Received</Label>
                        <Input
                          id="cash-amount"
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={cashAmount}
                          hideKeyboardIcon
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty input or valid decimal numbers
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setCashAmount(value);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Prevent non-numeric characters except decimal point
                            if (!/[0-9.]/.test(e.key) &&
                              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                              e.preventDefault();
                            }
                            // Prevent multiple decimal points
                            if (e.key === '.' && e.currentTarget.value.includes('.')) {
                              e.preventDefault();
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="mt-2 h-16 w-48 text-3xl font-black bg-white dark:bg-black border-2 border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl text-center shadow-inner [-webkit-appearance:none] [appearance:none] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />

                      </div>
                    </div>
                  )}

                  {/* Action Buttons and Keyboard Shortcuts - Fixed at bottom */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1 h-14 text-base"
                        data-testid="button-cancel-payment"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePayment}
                        className="flex-1 h-14 text-base"
                        disabled={((method === 'cash' || method === 'cash_with_discount') && showCashInput && cashProvided < calculatedTotal)}
                        data-testid="button-process-payment"
                      >
                        {((method === 'cash' || method === 'cash_with_discount') && !showCashInput) ? 'Enter Cash Amount' : 'Complete Payment'}
                      </Button>
                    </div>

                    {/* Keyboard Shortcuts Hint */}
                    <div className="text-center text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <div>Keyboard: Alt+1 (Cash) • Alt+2 (Discount) • Alt+3 (Receipt) • Ctrl+Enter (Process) • Enter (Process) • Esc (Cancel)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Payment Summary Section - Always show cart now */}
            <div className="lg:w-2/4 bg-background border-x p-6">
              <div className="h-full flex flex-col space-y-4">
                {/* Cart Display */}
                <div className="bg-muted/30 p-4 rounded-xl border flex-1 flex flex-col min-h-0">
                  <h4 className="font-medium mb-3 text-center uppercase tracking-widest text-xs text-muted-foreground/70">Order Items</h4>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {cart.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Cart is empty
                      </div>
                    ) : (
                      cart.map((item) => {
                        const originalPrice = Number(item.product.price);
                        const currentPrice = priceInputs[item.product.id] || originalPrice.toString();
                        const isDiscounted = currentPrice !== originalPrice.toString();

                        return (
                          <div key={item.product.id} className="flex justify-between items-center text-sm p-3 bg-background border border-border/50 rounded-xl transition-all hover:border-primary/30 shadow-sm group">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base truncate group-hover:text-primary transition-colors">{item.product.name}</div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {item.quantity} × {formatPrice(originalPrice)}
                              </div>
                              {method === 'cash_with_discount' && (
                                <div className="flex flex-col mt-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Edit Price</span>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={currentPrice}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          setPriceInputs(prev => ({
                                            ...prev,
                                            [item.product.id]: value
                                          }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                        if (!/[0-9.]/.test(e.key) &&
                                          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                                          e.preventDefault();
                                        }
                                        if (e.key === '.' && e.currentTarget.value.includes('.')) {
                                          e.preventDefault();
                                        }
                                      }}
                                      className="h-10 w-28 text-sm font-black bg-muted/30 border-primary/20 focus:border-primary focus:bg-background transition-all rounded-lg px-3"
                                      disabled={method !== 'cash_with_discount'}
                                    />
                                  </div>
                                  {isDiscounted && (
                                    <div className="text-[10px] text-primary font-black uppercase tracking-tighter mt-1 flex items-center gap-1">
                                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                                      Price Modified
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-black tracking-tighter ml-2">
                              {formatPrice((parseFloat(currentPrice) || 0) * item.quantity)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Payment Summary & Touchscreen Numpad */}
            {(method === 'cash' || method === 'cash_with_discount') && (
              <div className="lg:w-1/4 border-l bg-muted/20 p-6">
                <div className="max-w-sm mx-auto h-full flex flex-col">
                  {/* Payment Summary */}
                  <div className="bg-muted/50 p-5 rounded-xl border mb-4">
                    <h4 className="font-medium text-center mb-3">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium">{formatPrice(calculatedTotal)}</span>
                      </div>
                      {((method === 'cash' || method === 'cash_with_discount') && showCashInput) && (
                        <>
                          <div className="flex justify-between py-1">
                            <span>Cash Received:</span>
                            <span className="font-bold">{formatPrice(cashProvided)}</span>
                          </div>
                          <div className="border-t-2 border-primary/20 mt-2 pt-3 flex justify-between text-xl font-black tracking-tighter">
                            <span>Change Due:</span>
                            <span className={change > 0 ? 'text-green-500' : 'text-primary'}>
                              {formatPrice(change)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Numeric Keypad - only when entering cash */}
                  {showCashInput && (
                    <>
                      <div className="flex-1 flex items-center justify-center p-4">
                        <div className="w-full max-w-xs">
                          <SimpleNumericKeypad
                            onNumberClick={handleNumpadClick}
                            onEnter={handleNumpadEnter}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Touch the buttons or use your keyboard
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
}