import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ChevronUp, ChevronDown } from 'lucide-react';

interface NumericKeypadProps {
  onPLUSubmit: (plu: string) => void;
  onAddAmount: (amount: string) => void;
  onDisplayChange?: (display: string) => void;
  disableKeyboard?: boolean;
  onNumber?: (num: string) => void;
  onEnter?: () => void;
  isMultiplicationMode?: boolean;
  multiplicationDisplay?: string;
  onReprint?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  onVoid?: () => void;
}

export const NumericKeypad = React.memo(function NumericKeypad({
  onPLUSubmit,
  onAddAmount,
  onDisplayChange,
  disableKeyboard = false,
  onNumber,
  onEnter,
  isMultiplicationMode = false,
  multiplicationDisplay = '',
  onReprint,
  onPageUp,
  onPageDown,
  onVoid
}: NumericKeypadProps) {
  // ... (rest of the component stays the same)
  const [display, setDisplay] = React.useState('');
  const [operator, setOperator] = React.useState<string | null>(null);
  const [firstNumber, setFirstNumber] = React.useState<number | null>(null);
  const [newNumber, setNewNumber] = React.useState(true);

  const handleNumberClick = React.useCallback((num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(prev => prev + num);
    }
  }, [newNumber]);

  const handleOperator = React.useCallback((op: string) => {
    const currentNumber = parseFloat(display);

    if (firstNumber === null) {
      setFirstNumber(currentNumber);
    } else if (operator) {
      const result = calculate(firstNumber, currentNumber, operator);
      setFirstNumber(result);
      setDisplay(result.toString());
    }

    setOperator(op);
    setNewNumber(true);
  }, [display, firstNumber, operator]);

  const calculate = React.useCallback((a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  }, []);

  const handleClear = React.useCallback(() => {
    setDisplay('');
    setOperator(null);
    setFirstNumber(null);
    setNewNumber(true);
  }, []);

  // Notify parent of display changes
  React.useEffect(() => {
    onDisplayChange?.(display);
  }, [display, onDisplayChange]);

  // Handle physical keyboard input
  React.useEffect(() => {
    if (disableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow normal behavior in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Prevent default behavior for numeric keys to avoid conflicts
      if (/[0-9]|\.|\+|\-|\*|\/|\=|Enter|Escape|Backspace/.test(e.key)) {
        e.preventDefault();

        // Handle number keys
        if (/[0-9]/.test(e.key)) {
          handleNumberClick(e.key);
        }
        // Handle decimal point
        else if (e.key === '.') {
          handleNumberClick('.');
        }
        // Handle + key (PLU entry)
        else if (e.key === '+') {
          if (display && !operator) {
            // Submit PLU code when + is pressed
            const trimmedDisplay = display.trim();
            onPLUSubmit(trimmedDisplay);
            handleClear();
          }
        }
        // Handle * key (quantity multiplier)
        else if (e.key === '*') {
          // For physical keyboard, we'll use * for quantity adjustments
          handleOperator('*');
        }
        // Handle other operators
        else if (['-', '/'].includes(e.key)) {
          handleOperator(e.key);
        }
        // Handle Enter key - reserved for other functions, not PLU submission
        else if (e.key === 'Enter') {
          // Enter button - adds amount as custom value only (not PLU submission)
          // PLU submission should use the + key
          if (display && !operator) {
            const trimmedDisplay = display.trim();
            // Check if the display is a valid number (for custom amount)
            if (!isNaN(parseFloat(trimmedDisplay))) {
              // If it's a valid number, add it as a custom amount
              onAddAmount(trimmedDisplay);
              handleClear();
            }
            // Note: PLU codes should be submitted using the + key, not Enter
          }
        }
        // Handle Escape key (Clear)
        else if (e.key === 'Escape') {
          handleClear();
        }
        // Handle Backspace key
        else if (e.key === 'Backspace') {
          if (display.length > 0) {
            setDisplay(prev => prev.slice(0, -1));
          }
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disableKeyboard, display, operator, onPLUSubmit, onAddAmount, handleNumberClick, handleOperator, handleClear]);

  // Define the new 4-column layout buttons (including Enter button in the same row)
  const buttons = React.useMemo(() => [
    '7', '8', '9', 'C',
    '4', '5', '6', 'REPRINT',
    '1', '2', '3', 'PAGE_DOWN',
    '0', '00', '.', 'PAGE_UP',
    'PLU', 'VOID', 'ITEM', 'Enter'
  ], []);

  return (
    <div className="h-full flex flex-col p-1.5 bg-card rounded-lg border shadow-sm">
      {/* Multiplication Mode Display */}
      {isMultiplicationMode && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="text-xs text-green-800 font-medium">MULTIPLY MODE</div>
          <div className="text-sm font-mono text-green-900">
            × {multiplicationDisplay || '0'}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-1">
        {/* All rows in 4-column grid */}
        <div className="grid grid-cols-4 gap-1 flex-1">
          {buttons.map((key) => (
            <Button
              key={key}
              variant={
                key === 'C' ? "destructive" :
                  key === 'REPRINT' || key === 'PAGE_UP' || key === 'PAGE_DOWN' || key === '=' || key === 'VOID' || key === 'PLU' || key === 'Enter' ? "secondary" :
                    "outline"
              }
              className="flex-1 h-auto min-h-[44px] overflow-hidden px-1 py-3 text-base font-bold"
              onClick={() => {
                if (key === 'C') {
                  handleClear();
                } else if (key === 'ITEM') {
                  // ITEM button - add custom amount as item with sequential naming
                  if (display && !operator) {
                    const trimmedDisplay = display.trim();
                    // Check if the display is a valid number (for custom amount)
                    if (!isNaN(parseFloat(trimmedDisplay))) {
                      // If it's a valid number, add it as a custom amount
                      onAddAmount(trimmedDisplay);
                    }
                    handleClear();
                  }
                } else if (key === 'REPRINT') {
                  onReprint?.();
                } else if (key === 'PAGE_UP') {
                  onPageUp?.();
                } else if (key === 'PAGE_DOWN') {
                  onPageDown?.();
                } else if (key === 'VOID') {
                  // VOID button - open void item dialog
                  onVoid?.();
                } else if (key === 'PLU') {
                  // PLU button - submit PLU code to add item to cart
                  if (display && !operator) {
                    const trimmedDisplay = display.trim();
                    onPLUSubmit(trimmedDisplay);
                    handleClear();
                  }
                } else if (key === 'Enter') {
                  // Enter button - handle multiplication mode or add custom amount only (not PLU submission)
                  if (isMultiplicationMode && onEnter) {
                    onEnter();
                  } else if (display && !operator) {
                    const trimmedDisplay = display.trim();
                    // Check if the display is a valid number (for custom amount)
                    if (!isNaN(parseFloat(trimmedDisplay))) {
                      // If it's a valid number, add it as a custom amount
                      onAddAmount(trimmedDisplay);
                      handleClear();
                    }
                  }
                } else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '.'].includes(key)) {
                  if (isMultiplicationMode && onNumber) {
                    onNumber(key);
                  } else {
                    handleNumberClick(key);
                  }
                }
              }}
            >
              {key === 'REPRINT' ? <Printer className="h-5 w-5" /> :
                key === 'PAGE_UP' ? <ChevronUp className="h-5 w-5" /> :
                  key === 'PAGE_DOWN' ? <ChevronDown className="h-5 w-5" /> :
                    key}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});