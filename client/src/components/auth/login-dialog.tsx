import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { AlertCircle } from "lucide-react";

interface LoginDialogProps {
    open: boolean;
    onClose: () => void;
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
    const { login } = useAuth();
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const success = await login(pin);
            if (success) {
                onClose();
                setPin("");
            } else {
                setError("Invalid PIN. Please try again.");
            }
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (value: string) => {
        // Only allow numeric input and limit to 6 digits
        const numericValue = value.replace(/\D/g, "").slice(0, 6);
        setPin(numericValue);
        setError("");
    };

    return (
        <Dialog open={open} modal>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Enter PIN</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="pin" className="text-sm font-medium text-center block">
                            6-Digit PIN
                        </Label>
                        <Input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => handlePinChange(e.target.value)}
                            placeholder="Enter your PIN"
                            maxLength={6}
                            className="text-center text-2xl font-mono tracking-widest h-14"
                            autoFocus
                        />
                        <div className="flex justify-center space-x-2 mt-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? "bg-blue-600" : "bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Button
                            type="submit"
                            disabled={loading || pin.length !== 6}
                            className="w-full h-12 text-base"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        Enter your 6-digit PIN to access the POS system
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
