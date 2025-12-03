import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { AlertCircle } from "lucide-react";

export default function Login() {
    const [, navigate] = useLocation();
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
                navigate("/");
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">OpenSauce P.O.S.</h1>
                    <p className="text-lg text-gray-600">Welcome Back</p>
                </div>

                <div className="bg-white shadow-xl rounded-lg p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">Enter Your PIN</h2>
                        <p className="text-gray-600 mt-2">Please enter your 6-digit PIN to continue</p>
                    </div>

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
                                data-testid="login-pin-input"
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
                            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg" data-testid="login-error-message">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex justify-center">
                            <Button
                                type="submit"
                                disabled={loading || pin.length !== 6}
                                className="w-full h-12 text-base"
                                data-testid="login-submit-button"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-xs text-muted-foreground mt-6">
                        Enter your 6-digit PIN to access the POS system
                    </div>
                </div>
            </div>
        </div>
    );
}