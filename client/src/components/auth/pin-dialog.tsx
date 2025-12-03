import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePin } from "@/lib/auth-utils";

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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{currentTitle}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{currentDescription}</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="pin">PIN</Label>
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
                            placeholder="Enter 6-digit PIN"
                            maxLength={6}
                            className="text-center text-lg font-mono tracking-widest"
                            autoFocus
                        />
                        <div className="flex justify-center space-x-1">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${i < displayPin.length ? "bg-primary" : "bg-muted"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={loading}
                        >
                            {isConfirmMode ? "Back" : "Cancel"}
                        </Button>
                        <Button type="submit" disabled={loading || displayPin.length !== 6}>
                            {loading ? "..." : submitLabel}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
