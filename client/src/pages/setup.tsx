import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setupFirstUser, validatePin } from "@/lib/auth-utils";
import type { User } from "@shared/schema";

export default function Setup() {
    const [, navigate] = useLocation();
    const [step, setStep] = useState<'welcome' | 'setup'>('welcome');
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        if (pin !== confirmPin) {
            setError("PINs do not match");
            return;
        }

        const validation = validatePin(pin);
        if (!validation.isValid) {
            setError(validation.error!);
            return;
        }

        setLoading(true);
        try {
            const user = await setupFirstUser(name.trim(), pin);
            // Setup complete, redirect to main app
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Setup failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">OpenSauce P.O.S.</h1>
                        <p className="text-lg text-gray-600">Point of Sale Solution</p>
                    </div>

                    <Card className="shadow-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Welcome</CardTitle>
                            <CardDescription className="text-base">
                                This appears to be your first time using OpenSauce P.O.S..
                                Let's set up your admin account to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800 mb-2">
                                    <strong>What you'll need:</strong>
                                </p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Admin name for your account</li>
                                    <li>• 6-digit PIN for secure access</li>
                                    <li>• 2-3 minutes to complete setup</li>
                                </ul>
                            </div>

                            <Button onClick={() => setStep('setup')} className="w-full text-lg py-6" size="lg">
                                Get Started
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">OpenSauce P.O.S.</h1>
                    <p className="text-lg text-gray-600">Admin Account Setup</p>
                </div>

                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Create Admin Account</CardTitle>
                        <CardDescription>
                            Set up your admin account with a secure 6-digit PIN
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Admin Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="h-12 text-base"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-sm font-medium">PIN (6 digits)</Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="Enter 6-digit PIN"
                                    maxLength={6}
                                    className="h-12 text-center text-xl font-mono tracking-widest"
                                />
                                <div className="flex justify-center space-x-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? "bg-blue-600" : "bg-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPin" className="text-sm font-medium">Confirm PIN</Label>
                                <Input
                                    id="confirmPin"
                                    type="password"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="Re-enter PIN"
                                    maxLength={6}
                                    className="h-12 text-center text-xl font-mono tracking-widest"
                                />
                                <div className="flex justify-center space-x-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-4 h-4 rounded-full transition-colors ${i < confirmPin.length ? "bg-blue-600" : "bg-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-between space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep('welcome')}
                                    disabled={loading}
                                    className="flex-1 h-12"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !name.trim() || pin.length !== 6 || confirmPin.length !== 6}
                                    className="flex-1 h-12 text-base"
                                >
                                    {loading ? "Setting up..." : "Create Account"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
