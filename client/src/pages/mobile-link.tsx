import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { socketClient } from '@/lib/socket';
import { QrCode, Smartphone, ScanLine, Printer, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { Settings } from '../../../../shared/types';

export default function MobileLinkPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [deviceName, setDeviceName] = React.useState('');
    const [deviceType, setDeviceType] = React.useState<'scanner' | 'printer'>('scanner');
    const [isRegistering, setIsRegistering] = React.useState(false);
    const [isRegistered, setIsRegistered] = React.useState(false);
    const [deviceId, setDeviceId] = React.useState<string | null>(null);
    const [isScanning, setIsScanning] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const { data: settings } = useQuery<Settings>({
        queryKey: ['/api/settings'],
    });

    // Check if device is already registered
    React.useEffect(() => {
        const checkRegistration = async () => {
            try {
                // Check local storage for device registration
                const storedDeviceId = localStorage.getItem('mobileDeviceId');
                const storedDeviceName = localStorage.getItem('mobileDeviceName');
                const storedDeviceType = localStorage.getItem('mobileDeviceType');

                if (storedDeviceId && storedDeviceName && storedDeviceType) {
                    setDeviceId(storedDeviceId);
                    setDeviceName(storedDeviceName);
                    setDeviceType(storedDeviceType as 'scanner' | 'printer');
                    setIsRegistered(true);
                }
            } catch (error) {
                console.error('Error checking registration:', error);
            }
        };

        checkRegistration();
    }, []);

    const handleRegisterDevice = async () => {
        if (!deviceName.trim()) {
            toast({
                title: 'Device Name Required',
                description: 'Please enter a name for this device.',
                variant: 'destructive',
            });
            return;
        }

        setIsRegistering(true);

        try {
            const result = await socketClient.registerDevice(deviceName, deviceType);

            // Store device info locally
            localStorage.setItem('mobileDeviceId', result.id);
            localStorage.setItem('mobileDeviceName', result.name);
            localStorage.setItem('mobileDeviceType', result.type);

            setDeviceId(result.id);
            setIsRegistered(true);

            toast({
                title: 'Device Registered',
                description: `Successfully registered as ${result.name} (${result.type}).`,
            });
        } catch (error: any) {
            toast({
                title: 'Registration Failed',
                description: error.message || 'Failed to register device.',
                variant: 'destructive',
            });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleStartScanning = async () => {
        if (!isRegistered || !deviceId) {
            toast({
                title: 'Device Not Registered',
                description: 'Please register this device first.',
                variant: 'destructive',
            });
            return;
        }

        setIsScanning(true);

        try {
            // Import scanner dynamically to avoid issues on non-mobile devices
            const { scanner } = await import('@/lib/scanner');

            if (videoRef.current) {
                await scanner.start(videoRef.current, (barcode: string) => {
                    // Send barcode to server via socket
                    const success = socketClient.sendScan(barcode);

                    if (success) {
                        toast({
                            title: 'Barcode Sent',
                            description: `Sent barcode ${barcode} to POS system.`,
                        });
                    } else {
                        toast({
                            title: 'Send Failed',
                            description: 'Failed to send barcode to POS system.',
                            variant: 'destructive',
                        });
                    }
                });
            }
        } catch (error: any) {
            console.error('Scanning error:', error);
            toast({
                title: 'Scanning Error',
                description: error.message || 'Failed to start camera scanning.',
                variant: 'destructive',
            });
            setIsScanning(false);
        }
    };

    const handleStopScanning = () => {
        const { scanner } = require('@/lib/scanner');
        scanner.stop();
        setIsScanning(false);
    };

    const handleUnregisterDevice = () => {
        localStorage.removeItem('mobileDeviceId');
        localStorage.removeItem('mobileDeviceName');
        localStorage.removeItem('mobileDeviceType');

        setDeviceId(null);
        setDeviceName('');
        setIsRegistered(false);

        toast({
            title: 'Device Unregistered',
            description: 'Device has been unregistered from the POS system.',
        });
    };

    if (!isRegistered) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Link Mobile Device</CardTitle>
                        <CardDescription>
                            Register this device to work with your OpenSauce POS system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="deviceName">Device Name</Label>
                            <Input
                                id="deviceName"
                                placeholder="e.g., My iPhone Scanner"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deviceType">Device Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={deviceType === 'scanner' ? 'default' : 'outline'}
                                    onClick={() => setDeviceType('scanner')}
                                    className="flex items-center gap-2"
                                >
                                    <ScanLine className="w-4 h-4" />
                                    Scanner
                                </Button>
                                <Button
                                    type="button"
                                    variant={deviceType === 'printer' ? 'default' : 'outline'}
                                    onClick={() => setDeviceType('printer')}
                                    className="flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    Printer
                                </Button>
                            </div>
                        </div>

                        <Button
                            onClick={handleRegisterDevice}
                            disabled={isRegistering}
                            className="w-full"
                        >
                            {isRegistering ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Register Device
                                </>
                            )}
                        </Button>

                        <div className="text-center">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/')}
                                className="text-sm"
                            >
                                Back to POS
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto space-y-4">
                {/* Device Status */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <CardTitle className="text-lg">Device Linked</CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUnregisterDevice}
                            >
                                Unlink
                            </Button>
                        </div>
                        <CardDescription>
                            {deviceName} ({deviceType})
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Scanner Interface */}
                {deviceType === 'scanner' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ScanLine className="w-5 h-5" />
                                Barcode Scanner
                            </CardTitle>
                            <CardDescription>
                                Scan barcodes to send them to the POS system
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isScanning ? (
                                <Button
                                    onClick={handleStartScanning}
                                    className="w-full"
                                    size="lg"
                                >
                                    <QrCode className="w-5 h-5 mr-2" />
                                    Start Scanning
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full object-cover"
                                            playsInline
                                            muted
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-48 h-24 border-2 border-primary opacity-75 rounded-md animate-pulse"></div>
                                        </div>
                                    </div>

                                    <div className="text-center text-sm text-muted-foreground">
                                        Position barcode within the frame
                                    </div>

                                    <Button
                                        onClick={handleStopScanning}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Stop Scanning
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Printer Interface */}
                {deviceType === 'printer' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Printer className="w-5 h-5" />
                                Receipt Printer
                            </CardTitle>
                            <CardDescription>
                                Ready to receive print jobs from the POS system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Printer className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    This device is registered as a printer. Print jobs will be sent automatically when receipts are printed from the POS system.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-primary">1</span>
                            </div>
                            <p>Register your device with a unique name</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-primary">2</span>
                            </div>
                            <p>Choose whether this device will act as a scanner or printer</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-primary">3</span>
                            </div>
                            <p>Use the scanner to scan barcodes that get sent to your POS system</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-primary">4</span>
                            </div>
                            <p>Printers automatically receive print jobs when receipts are generated</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
