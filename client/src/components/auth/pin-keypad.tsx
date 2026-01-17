import React from 'react';
import { Button } from '@/components/ui/button';

interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  disabled?: boolean;
}

export function PinKeypad({ onDigitPress, onDelete, onEnter, disabled = false }: PinKeypadProps) {
  // Handle physical keyboard input
  React.useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for relevant keys
      if (/[0-9]|Backspace|Enter|Delete/.test(e.key)) {
        e.preventDefault();

        // Handle number keys
        if (/[0-9]/.test(e.key)) {
          onDigitPress(e.key);
        }
        // Handle Backspace/Delete keys
        else if (e.key === 'Backspace' || e.key === 'Delete') {
          onDelete();
        }
        // Handle Enter key
        else if (e.key === 'Enter') {
          onEnter();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, onDigitPress, onDelete, onEnter]);
  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '0'
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mt-8">
      {buttons.map((digit) => (
        <Button
          key={digit}
          type="button"
          variant="outline"
          className="h-20 text-3xl font-bold rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-md border-2"
          onClick={() => onDigitPress(digit)}
          disabled={disabled}
        >
          {digit}
        </Button>
      ))}

      <Button
        type="button"
        variant="destructive"
        className="h-20 text-xl font-bold rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-md"
        onClick={onDelete}
        disabled={disabled}
      >
        DEL
      </Button>

      <Button
        type="button"
        variant="default"
        className="h-20 text-xl font-bold rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-md bg-primary hover:bg-primary/90"
        onClick={onEnter}
        disabled={disabled}
      >
        GO
      </Button>
    </div>
  );
}