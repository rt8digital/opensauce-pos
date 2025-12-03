import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bluetooth, Printer, RefreshCw, CheckCircle2 } from 'lucide-react';
import { peripheralManager, PeripheralDevice } from '@/lib/peripheral-manager';
import { isCapacitor } from '@/utils/capacitor';
import { useToast } from '@/hooks/use-toast';

interface BluetoothSettingsCardProps {
    onDeviceConnected?: (deviceId: string) => void;
}

export function BluetoothSettingsCard({ onDeviceConnected }: BluetoothSettingsCardProps) {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<PeripheralDevice[]>([]);
    const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

    useEffect(() => {
        // Initial load of devices
        loadDevices();

        // Subscribe to device updates
        const handleDevicesUpdate = (updatedDevices: PeripheralDevice[]) => {
            setDevices(updatedDevices.filter(d => d.connectionType === 'bluetooth'));
        };

        peripheralManager.addListener(handleDevicesUpdate);

        return () => {
            peripheralManager.removeListener(handleDevicesUpdate);
        };
    }, []);

    const loadDevices = () => {
        const allDevices = peripheralManager.getDevices();
        setDevices(allDevices.filter(d => d.connectionType === 'bluetooth'));
    };

    const handleScan = async () => {
        if (!isCapacitor()) {
            toast({
                title: "Not Supported",
                description: "Bluetooth scanning is only available on mobile devices.",
                variant: "destructive"
            });
            return;
        }

        setIsScanning(true);
        try {
            await peripheralManager.discoverDevices();
            toast({
                title: "Scan Complete",
                description: "Bluetooth device scan finished."
            });
        } catch (error) {
            console.error("Scan error:", error);
            toast({
                title: "Scan Failed",
                description: "Failed to scan for Bluetooth devices.",
                variant: "destructive"
            });
        } finally {
            setIsScanning(false);
        }
    };

    const handleConnect = async (device: PeripheralDevice) => {
        try {
            toast({
                title: "Connecting...",
                description: `Connecting to ${device.name || 'device'}...`
            });

            const success = await peripheralManager.testConnection(device.id);

            if (success) {
                setConnectedDeviceId(device.id);
                toast({
                    title: "Connected",
                    description: `Successfully connected to ${device.name || 'device'}.`
                });

                if (onDeviceConnected) {
                    onDeviceConnected(device.id);
                }
            } else {
                toast({
                    title: "Connection Failed",
                    description: `Could not connect to ${device.name || 'device'}.`,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Connection error:", error);
            toast({
                title: "Error",
                description: "An error occurred while connecting.",
                variant: "destructive"
            });
        }
    };

    if (!isCapacitor()) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Bluetooth className="h-5 w-5 text-blue-500" />
                            Bluetooth Devices
                        </CardTitle>
                        <CardDescription>
                            Scan and connect to Bluetooth printers and scanners
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleScan}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Scan
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {devices.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Bluetooth className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No Bluetooth devices found.</p>
                        <p className="text-sm">Tap Scan to search for nearby devices.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {devices.map((device) => (
                            <div
                                key={device.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Printer className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{device.name || 'Unknown Device'}</p>
                                        <p className="text-xs text-muted-foreground">{device.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {device.status === 'connected' || connectedDeviceId === device.id ? (
                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Connected
                                        </Badge>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleConnect(device)}
                                        >
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
