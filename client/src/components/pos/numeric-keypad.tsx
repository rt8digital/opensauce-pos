import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NumericKeypadProps {
  onPLUSubmit: (plu: string) => void;
  onAddAmount: (amount: string) => void;
  onDisplayChange?: (display: string) => void;
}

export function NumericKeypad({ onPLUSubmit, onAddAmount, onDisplayChange }: NumericKeypadProps) {
  const [display, setDisplay] = React.useState('');
  const [operator, setOperator] = React.useState<string | null>(null);
  const [firstNumber, setFirstNumber] = React.useState<number | null>(null);
  const [newNumber, setNewNumber] = React.useState(true);

  const handleNumberClick = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(prev => prev + num);
    }
  };

  const handleOperator = (op: string) => {
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
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (operator && firstNumber !== null) {
      const currentNumber = parseFloat(display);
      const result = calculate(firstNumber, currentNumber, operator);
      setDisplay(result.toString());
      setFirstNumber(null);
      setOperator(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('');
    setOperator(null);
    setFirstNumber(null);
    setNewNumber(true);
  };

  // Notify parent of display changes
  React.useEffect(() => {
    onDisplayChange?.(display);
  }, [display, onDisplayChange]);

  // Handle physical keyboard input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        // Handle Enter key
        else if (e.key === 'Enter') {
          // Enter button - adds amount as custom value or adds PLU entry as item
          if (display && !operator) {
            const trimmedDisplay = display.trim();
            // Check if the display is a valid number (for custom amount)
            if (!isNaN(parseFloat(trimmedDisplay))) {
              // If it's a valid number, add it as a custom amount
              onAddAmount(trimmedDisplay);
            } else {
              // Otherwise, treat it as a PLU code
              onPLUSubmit(trimmedDisplay);
            }
            handleClear();
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
  }, [display, operator, firstNumber, newNumber, onPLUSubmit, onAddAmount, handleNumberClick, handleOperator, handleClear]);

  // Define the new 3-column layout buttons
  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '00', '.',
    '*', 'C', 'PLU',
    'x/time', '=', 'Enter'
  ];

  return (
    <div className="h-[calc(50vh-65px)] flex flex-col p-1.5 bg-card rounded-lg border shadow-sm">
      <div className="flex-1 grid grid-cols-3 gap-1">
        {buttons.map((key) => (
          <Button
            key={key}
            variant={
              key === 'C' ? "destructive" :
                key === '*' || key === '=' || key === 'x/time' || key === 'PLU' || key === 'Enter' ? "secondary" :
                  "outline"
            }
            className="h-12"
            onClick={() => {
              if (key === 'C') {
                handleClear();
              } else if (key === 'Enter') {
                // Enter button - adds amount as custom value or PLU entry
                if (display && !operator) {
                  const trimmedDisplay = display.trim();
                  // Check if the display is a valid number (for custom amount)
                  if (!isNaN(parseFloat(trimmedDisplay))) {
                    // If it's a valid number, add it as a custom amount
                    onAddAmount(trimmedDisplay);
                  } else {
                    // Otherwise, treat it as a PLU code
                    onPLUSubmit(trimmedDisplay);
                  }
                  handleClear();
                }
              } else if (key === '=') {
                handleEquals();
              } else if (key === '*') {
                handleOperator('*');
              } else if (key === 'x/time') {
                // x/time button acts as multiplication
                handleOperator('*');
              } else if (key === 'PLU') {
                // PLU button - submit PLU code to add item to cart
                if (display && !operator) {
                  const trimmedDisplay = display.trim();
                  onPLUSubmit(trimmedDisplay);
                  handleClear();
                }
              } else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '.'].includes(key)) {
                handleNumberClick(key);
              }
            }}
          >
            {key}
          </Button>
        ))}
      </div>
    </div>
  );
}
