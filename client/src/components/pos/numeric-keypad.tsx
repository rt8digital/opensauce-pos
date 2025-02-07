import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NumericKeypadProps {
  onPLUSubmit: (plu: string) => void;
  onAddAmount: (amount: string) => void;
}

export function NumericKeypad({ onPLUSubmit, onAddAmount }: NumericKeypadProps) {
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

  const handleAddAmount = () => {
    if (display && !operator) {
      onAddAmount(display);
      handleClear();
    }
  };

  const handleEnter = () => {
    if (display && !operator) {
      onPLUSubmit(display);
      handleClear();
    }
  };

  return (
    <div className="h-[calc(50vh-65px)] flex flex-col p-1.5 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Input
          value={display}
          readOnly
          className="text-lg font-mono h-8"
          placeholder="Enter PLU or calculate"
        />
      </div>

      <div className="flex-1 grid grid-cols-4 gap-1">
        {[7, 8, 9, '+', 4, 5, 6, '-', 1, 2, 3, '*', 'C', 0, '=', '/'].map((key) => (
          <Button
            key={key}
            variant={typeof key === 'string' && key !== 'C' ? "secondary" : "outline"}
            className="h-9"
            onClick={() => {
              if (typeof key === 'number') {
                handleNumberClick(key.toString());
              } else if (key === 'C') {
                handleClear();
              } else if (key === '=') {
                handleEquals();
              } else {
                handleOperator(key);
              }
            }}
          >
            {key}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 mt-1">
        <Button 
          className="h-9" 
          variant="default"
          onClick={handleEnter}
        >
          Enter
        </Button>
        <Button 
          className="h-9" 
          variant="secondary"
          onClick={handleAddAmount}
        >
          Add Amount
        </Button>
      </div>
    </div>
  );
}