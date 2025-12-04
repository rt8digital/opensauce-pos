import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePin } from "@/lib/auth-utils";

// Simple numeric keypad component for PIN entry
function PinNumericKeypad({ onNumberClick, onBackspace }: { onNumberClick: (num: string) => void; onBackspace: () => void }) {
    const buttons = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '', '0', '⌫'
    ];

    return (
        <div className="grid grid-cols-3 gap-3 p-4 bg-card rounded-lg border shadow-sm">
            {buttons.map((key, index) => (
                <Button
                    key={index}
                    variant={key === '⌫' ? "destructive" : key === '' ? "ghost" : "outline"}
                    className={`h-14 text-xl font-semibold ${key === '' ? 'invisible' : ''}`}
                    onClick={() => {
                        if (key === '⌫') {
                            onBackspace();
                        } else if (key) {
                            onNumberClick(key);
                        }
                    }}
                    disabled={key === ''}
                >
                    {key}
                </Button>
            ))}
        </div>
    );
}

interface PinDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onSubmit: (pin: string) => Promise<void>;
    submitLabel?: string;
    loading?: boolean;
}

export function PinDialog({
    open,
    onOpenChange,
    title = "Enter PIN",
    description = "Please enter your 6-digit PIN",
    onSubmit,
    submitLabel = "Submit",
    loading = false,
}: PinDialogProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isConfirmMode, setIsConfirmMode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isConfirmMode) {
            if (pin !== confirmPin) {
                setError("PINs do not match");
                return;
            }
        } else if (title.toLowerCase().includes("confirm") || title.toLowerCase().includes("change")) {
            // If this is a PIN change/creation, require confirmation
            setIsConfirmMode(true);
            return;
        }

        const validation = validatePin(pin);
        if (!validation.isValid) {
            setError(validation.error!);
            return;
        }

        try {
            await onSubmit(pin);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const handleClose = () => {
        setPin("");
        setConfirmPin("");
        setError("");
        setIsConfirmMode(false);
        onOpenChange(false);
    };

    const handleBack = () => {
        if (isConfirmMode) {
            setIsConfirmMode(false);
            setConfirmPin("");
        } else {
            handleClose();
        }
    };

    const displayPin = isConfirmMode ? confirmPin : pin;
    const currentTitle = isConfirmMode ? "Confirm PIN" : title;
    const currentDescription = isConfirmMode
        ? "Please re-enter your PIN to confirm"
        : description;

    const handleNumpadClick = (key: string) => {
        const value = displayPin + key;
        const limitedValue = value.slice(0, 6);
        if (isConfirmMode) {
            setConfirmPin(limitedValue);
        } else {
            setPin(limitedValue);
        }
    };

    const handleNumpadBackspace = () => {
        const value = displayPin.slice(0, -1);
        if (isConfirmMode) {
            setConfirmPin(value);
        } else {
            setPin(value);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-full h-full max-h-full p-0 gap-0 bg-background">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <DialogTitle className="text-2xl font-bold">{currentTitle}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{currentDescription}</p>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col lg:flex-row">
                        {/* PIN Input Section */}
                        <div className="flex-1 p-6 lg:p-8">
                            <div className="max-w-md mx-auto lg:mx-0">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* PIN Display */}
                                    <div className="text-center space-y-6">
                                        <div className="space-y-4">
                                            <Label htmlFor="pin" className="text-lg font-medium">Enter PIN</Label>
                                            <div className="text-6xl font-mono tracking-widest text-primary select-none">
                                                {displayPin.padEnd(6, '•')}
                                            </div>
                                            <div className="flex justify-center space-x-2">
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-4 h-4 rounded-full transition-colors ${i < displayPin.length ? "bg-primary" : "bg-muted"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hidden input for form submission */}
                                        <Input
                                            id="pin"
                                            type="password"
                                            value={displayPin}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                if (isConfirmMode) {
                                                    setConfirmPin(value);
                                                } else {
                                                    setPin(value);
                                                }
                                            }}
                                            className="sr-only"
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-center">
                                            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                                {error}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                            disabled={loading}
                                            className="flex-1 h-12"
                                        >
                                            {isConfirmMode ? "Back" : "Cancel"}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading || displayPin.length !== 6}
                                            className="flex-1 h-12 text-base"
                                        >
                                            {loading ? "..." : submitLabel}
                                        </Button>
                                    </div>

                                    {/* Keyboard Shortcuts Hint */}
                                    <div className="text-center text-xs text-muted-foreground">
                                        <div>Use the numeric keypad or type numbers directly</div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Touchscreen Numpad Section */}
                        <div className="lg:w-96 border-l bg-muted/20 p-6 lg:p-8">
                            <div className="max-w-sm mx-auto">
                                <h3 className="text-lg font-semibold mb-6 text-center">Numeric Keypad</h3>
                                <PinNumericKeypad
                                    onNumberClick={handleNumpadClick}
                                    onBackspace={handleNumpadBackspace}
                                />
                                <p className="text-xs text-muted-foreground text-center mt-4">
                                    Touch the buttons to enter your PIN
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
