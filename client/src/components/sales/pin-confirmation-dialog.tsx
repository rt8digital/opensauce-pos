import { useState, useEffect } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface PinConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinConfirmed: () => void;
}

export function PinConfirmationDialog({ open, onOpenChange, onPinConfirmed }: PinConfirmationDialogProps) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const { login } = useAuth();
  const { toast } = useToast();

  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 30; // seconds

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPin('');
      setAttempts(0);
      setIsLocked(false);
      setLockTimer(0);
    }
  }, [open]);

  // Handle lock timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleSubmit = async () => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast({
        title: 'Invalid PIN',
        description: 'PIN must be exactly 6 digits.',
        variant: 'destructive',
      });
      return;
    }

    if (isLocked) {
      return;
    }

    try {
      const success = await login(pin);
      if (success) {
        onPinConfirmed();
        onOpenChange(false);
      } else {
        handleFailedAttempt();
      }
    } catch (error) {
      handleFailedAttempt();
    }
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      setLockTimer(LOCK_DURATION);
      toast({
        title: 'Too Many Failed Attempts',
        description: `Access locked for ${LOCK_DURATION} seconds.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Incorrect PIN',
        description: `${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
        variant: 'destructive',
      });
    }
    setPin('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLocked) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Lock className="h-5 w-5" />
            PIN Confirmation Required
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your 6-digit PIN to confirm the void operation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-center block">Enter PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setPin(value);
              }}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-widest"
              disabled={isLocked}
            />
          </div>

          {/* Lock status */}
          {isLocked && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Access locked for {lockTimer} seconds due to too many failed attempts.
              </AlertDescription>
            </Alert>
          )}

          {/* Attempts remaining */}
          {!isLocked && attempts > 0 && attempts < MAX_ATTEMPTS && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {MAX_ATTEMPTS - attempts} attempts remaining.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLocked}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pin.length !== 6 || isLocked}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}