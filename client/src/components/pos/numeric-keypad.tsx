import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings } from 'lucide-react';

interface NumericKeypadProps {
  onPLUSubmit: (plu: string) => void;
  onSettingsClick: () => void;
}

export function NumericKeypad({ onPLUSubmit, onSettingsClick }: NumericKeypadProps) {
  const [display, setDisplay] = React.useState('');

  const handleNumberClick = (num: string) => {
    setDisplay(prev => prev + num);
  };

  const handleClear = () => {
    setDisplay('');
  };

  const handleEnter = () => {
    if (display) {
      onPLUSubmit(display);
      setDisplay('');
    }
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.slice(0, -1));
  };

  return (
    <div className="p-1.5 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Input
          value={display}
          onChange={(e) => setDisplay(e.target.value.replace(/[^0-9]/g, ''))}
          className="text-lg font-mono h-8"
          placeholder="Enter PLU"
        />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onSettingsClick}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-0.5">
        {[...Array(9)].map((_, i) => (
          <Button
            key={i + 1}
            variant="outline"
            className="h-8"
            onClick={() => handleNumberClick((i + 1).toString())}
          >
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" className="h-8" onClick={handleClear}>C</Button>
        <Button variant="outline" className="h-8" onClick={() => handleNumberClick('0')}>0</Button>
        <Button variant="outline" className="h-8" onClick={handleBackspace}>←</Button>
        <Button 
          className="col-span-3 h-8" 
          variant="default"
          onClick={handleEnter}
        >
          Enter
        </Button>
      </div>
    </div>
  );
}