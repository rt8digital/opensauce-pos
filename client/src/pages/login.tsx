import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { AlertCircle } from "lucide-react";
import { PinKeypad } from "@/components/auth/pin-keypad";

export default function Login() {
    const [, navigate] = useLocation();
    const { login } = useAuth();
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDigitPress = (digit: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
            setError("");
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError("");
    };

    const handleEnter = async () => {
        if (pin.length === 6) {
            setError("");
            setLoading(true);

            try {
                const success = await login(pin);
                if (success) {
                    navigate("/");
                } else {
                    setError("Invalid PIN. Please try again.");
                    setPin(""); // Clear PIN on failed attempt
                }
            } catch (err) {
                setError("Login failed. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <img src="./Copilot_20260101_152954.png" alt="Logo" className="mb-4 w-32 h-32 object-contain dark:invert" />
                    <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
                    <p className="text-lg text-muted-foreground">Opensauce: POS v1.0</p>
                    <p className="text-lg text-muted-foreground">Crafted with ❤️ by RT8: Digital</p>
                    <p className="text-2x1 text-muted-foreground">📞 +27847990432 for support or assistance</p>
                </div>
                <div className="flex items-center justify-center">
                    <div className="bg-background shadow-xl rounded-lg p-8 w-full max-w-md">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-semibold">Hi, Hello, Good Day!!</h2>
                            <p className="text-muted-foreground mt-2">Please enter your 6-digit PIN to continue</p>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleEnter(); }} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-sm font-medium text-center block">
                                    6-Digit PIN
                                </Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    value={pin}
                                    readOnly
                                    placeholder="Enter your PIN"
                                    maxLength={6}
                                    hideKeyboardIcon
                                    className="text-center text-2xl font-mono tracking-widest h-14"
                                    data-testid="login-pin-input"
                                />
                                <div className="flex justify-center gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-6 h-6 rounded-full transition-all duration-300 border-2 ${i < pin.length
                                                ? "bg-primary border-primary scale-110"
                                                : "bg-transparent border-muted-foreground/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <PinKeypad
                                onDigitPress={handleDigitPress}
                                onDelete={handleDelete}
                                onEnter={handleEnter}
                                disabled={loading}
                            />

                            {error && (
                                <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="login-error-message">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="text-center text-xs text-muted-foreground mt-4">

                            </div>
                        </form>

                        <div className="text-center text-xs text-muted-foreground mt-6">

                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}