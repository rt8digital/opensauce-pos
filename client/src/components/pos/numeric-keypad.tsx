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
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Input
          value={display}
          onChange={(e) => setDisplay(e.target.value.replace(/[^0-9]/g, ''))}
          className="text-xl font-mono"
          placeholder="Enter PLU"
        />
        <Button variant="outline" size="icon" onClick={onSettingsClick}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <Button
            key={i + 1}
            variant="outline"
            onClick={() => handleNumberClick((i + 1).toString())}
          >
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" onClick={handleClear}>C</Button>
        <Button variant="outline" onClick={() => handleNumberClick('0')}>0</Button>
        <Button variant="outline" onClick={handleBackspace}>←</Button>
        <Button 
          className="col-span-3" 
          variant="default"
          onClick={handleEnter}
        >
          Enter
        </Button>
      </div>
    </div>
  );
}
