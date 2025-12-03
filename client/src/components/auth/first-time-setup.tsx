import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setupFirstUser, validatePin } from "@/lib/auth-utils";
import { User } from "@shared/schema";

interface FirstTimeSetupProps {
    open: boolean;
    onComplete: (user: User) => void;
}

export function FirstTimeSetup({ open, onComplete }: FirstTimeSetupProps) {
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
            onComplete(user);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Setup failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === 'welcome') {
        return (
            <Dialog open={open} modal>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Welcome to OpenSauce P.O.S.</DialogTitle>
                    </DialogHeader>

                    <Card>
                        <CardHeader>
                            <CardTitle>First Time Setup</CardTitle>
                            <CardDescription>
                                Welcome! This appears to be your first time using the OpenSauce P.O.S..
                                Let's set up your admin account to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                You'll create an admin account with a 6-digit PIN for secure access to the system.
                            </p>
                            <Button onClick={() => setStep('setup')} className="w-full">
                                Get Started
                            </Button>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} modal>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Admin Account</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Admin Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pin">PIN (6 digits)</Label>
                        <Input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="Enter 6-digit PIN"
                            maxLength={6}
                            className="text-center text-lg font-mono tracking-widest"
                        />
                        <div className="flex justify-center space-x-1">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${i < pin.length ? "bg-primary" : "bg-muted"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPin">Confirm PIN</Label>
                        <Input
                            id="confirmPin"
                            type="password"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="Re-enter PIN"
                            maxLength={6}
                            className="text-center text-lg font-mono tracking-widest"
                        />
                        <div className="flex justify-center space-x-1">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${i < confirmPin.length ? "bg-primary" : "bg-muted"
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
                            onClick={() => setStep('welcome')}
                            disabled={loading}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !name.trim() || pin.length !== 6 || confirmPin.length !== 6}
                        >
                            {loading ? "Setting up..." : "Create Account"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
