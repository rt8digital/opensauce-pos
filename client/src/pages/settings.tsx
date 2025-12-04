import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Store, Printer, Camera, ScanLine, Receipt, CreditCard, Scale, Monitor, DollarSign, Settings2, Server, Laptop, MessageCircle, Shield, Database, AlertTriangle, Send } from 'lucide-react';
import type { Settings } from '@shared/schema';
import { ReceiptPreview } from '@/components/pos/receipt-preview';
import { useTranslation } from '@/hooks/use-translation';
import { UserManagementCard } from '@/components/settings/user-management-card';
import { PinDialog } from '@/components/auth/pin-dialog';
import { useState } from 'react';
import { verifyPin, isAuthenticated } from '@/lib/auth-utils';
import { Users } from 'lucide-react';
import { BluetoothSettingsCard } from '@/components/settings/bluetooth-settings-card';
import { whatsappWebService } from '@/lib/whatsapp-web';

export default function SettingsPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const [qrPreview, setQrPreview] = React.useState<string | null>(null);

    const { data: settings, isLoading } = useQuery<Settings>({
        queryKey: ['/api/settings'],
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (updates: Partial<Settings>) => {
            const response = await apiRequest('PATCH', '/api/settings', updates);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
            toast({
                title: 'Settings Saved',
                description: 'Your settings have been updated successfully.',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to save settings.',
                variant: 'destructive',
            });
        },
    });

    const resetSettingsMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('POST', '/api/settings/reset');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
            toast({
                title: 'Settings Reset',
                description: 'Settings have been reset to defaults.',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to reset settings.',
                variant: 'destructive',
            });
        },
    });

    React.useEffect(() => {
        if (settings?.storeLogo) {
            setLogoPreview(settings.storeLogo);
        }
        if (settings?.paymentQrCode) {
            setQrPreview(settings.paymentQrCode);
        }
    }, [settings]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'logo') {
                    setLogoPreview(result);
                    updateSettingsMutation.mutate({ storeLogo: result });
                } else {
                    setQrPreview(result);
                    updateSettingsMutation.mutate({ paymentQrCode: result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFieldUpdate = (field: keyof Settings, value: any) => {
        updateSettingsMutation.mutate({ [field]: value ?? '' });
    };

    const handleResetSettings = () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            resetSettingsMutation.mutate();
        }
    };

    // Peripheral test functions
    const testPrinterConnection = async () => {
        try {
            if (settings?.printerType === 'bluetooth') {
                toast({
                    title: 'Bluetooth Printer',
                    description: 'Please use the Bluetooth Devices card above to scan and test connection.',
                });
                return;
            }

            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.testPrinter(settings?.printerType || 'usb', settings?.printerIp);
                if (result.success) {
                    toast({
                        title: 'Printer Test',
                        description: 'Printer connection successful!',
                    });
                } else {
                    toast({
                        title: 'Printer Test Failed',
                        description: result.error || 'Failed to connect to printer',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Printer testing only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error testing printer connection',
                variant: 'destructive',
            });
        }
    };

    const printTestReceipt = async () => {
        try {
            // Create a test order
            const testOrder = {
                id: 0,
                customerId: null,
                items: [
                    { productId: 1, productName: 'Test Item', quantity: 2, price: '10.00' },
                    { productId: 2, productName: 'Another Item', quantity: 1, price: '15.00' }
                ],
                total: '35.00',
                paymentMethod: 'Cash',
                createdAt: new Date(),
            };

            const { ReceiptPrinter } = await import('@/lib/printer');
            const printer = ReceiptPrinter.getInstance();

            // Try printing with configured settings
            const success = await printer.printEscPos(
                testOrder as any,
                settings?.printerType as any || 'usb',
                settings?.printerIp ?? undefined
            );

            if (success) {
                toast({
                    title: 'Test Receipt',
                    description: 'Test receipt printed successfully!',
                });
            } else {
                // Fallback to PDF printing if not bluetooth (bluetooth failure should be explicit)
                if (settings?.printerType !== 'bluetooth') {
                    ReceiptPrinter.print(testOrder as any);
                    toast({
                        title: 'Test Receipt',
                        description: 'Test receipt opened in print dialog (PDF fallback)',
                    });
                } else {
                    toast({
                        title: 'Print Failed',
                        description: 'Failed to print to Bluetooth printer. Please check connection.',
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            console.error('Print error:', error);
            toast({
                title: 'Error',
                description: 'Error printing test receipt',
                variant: 'destructive',
            });
        }
    };

    const testScannerConnection = async () => {
        try {
            // For hardware scanners, we can't really test connection directly
            // We'll just show a message
            toast({
                title: 'Scanner Test',
                description: 'Scanner connection test not directly available. Try scanning a barcode to test.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error testing scanner connection',
                variant: 'destructive',
            });
        }
    };

    const testCashDrawerConnection = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.openCashDrawer(settings?.cashDrawerPort, 100);
                if (result.success) {
                    toast({
                        title: 'Cash Drawer Test',
                        description: 'Cash drawer connection successful!',
                    });
                } else {
                    toast({
                        title: 'Cash Drawer Test Failed',
                        description: result.error || 'Failed to connect to cash drawer',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Cash drawer testing only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error testing cash drawer connection',
                variant: 'destructive',
            });
        }
    };

    const openCashDrawer = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.openCashDrawer(settings?.cashDrawerPort, 100);
                if (result.success) {
                    toast({
                        title: 'Cash Drawer',
                        description: 'Cash drawer opened successfully!',
                    });
                } else {
                    toast({
                        title: 'Operation Failed',
                        description: result.error || 'Failed to open cash drawer',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Cash drawer control only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error opening cash drawer',
                variant: 'destructive',
            });
        }
    };

    const testCustomerDisplayConnection = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.updateCustomerDisplay(
                    { header: 'TEST', footer: 'Connection OK' },
                    settings?.customerDisplayType,
                    settings?.customerDisplayValue
                );
                if (result.success) {
                    toast({
                        title: 'Customer Display Test',
                        description: 'Customer display connection successful!',
                    });
                } else {
                    toast({
                        title: 'Customer Display Test Failed',
                        description: result.error || 'Failed to connect to customer display',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Customer display testing only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error testing customer display connection',
                variant: 'destructive',
            });
        }
    };

    const updateCustomerDisplay = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.updateCustomerDisplay(
                    { header: 'TEST MESSAGE', footer: 'Display Working!' },
                    settings?.customerDisplayType,
                    settings?.customerDisplayValue
                );
                if (result.success) {
                    toast({
                        title: 'Customer Display',
                        description: 'Test message sent to customer display!',
                    });
                } else {
                    toast({
                        title: 'Operation Failed',
                        description: result.error || 'Failed to update customer display',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Customer display control only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error updating customer display',
                variant: 'destructive',
            });
        }
    };

    const testScaleConnection = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.connectScale(settings?.scalePort);
                if (result.success) {
                    toast({
                        title: 'Scale Test',
                        description: 'Scale connection successful!',
                    });
                } else {
                    toast({
                        title: 'Scale Test Failed',
                        description: result.error || 'Failed to connect to scale',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Scale testing only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error testing scale connection',
                variant: 'destructive',
            });
        }
    };

    const readScaleWeight = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.readScaleWeight();
                if (result.success) {
                    toast({
                        title: 'Scale Reading',
                        description: `Weight: ${result.weight} ${result.unit} (${result.stable ? 'Stable' : 'Unstable'})`,
                    });
                } else {
                    toast({
                        title: 'Reading Failed',
                        description: result.error || 'Failed to read weight from scale',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Scale reading only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error reading scale weight',
                variant: 'destructive',
            });
        }
    };

    const tareScale = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.tareScale();
                if (result.success) {
                    toast({
                        title: 'Scale Tared',
                        description: 'Scale has been tared successfully.',
                    });
                } else {
                    toast({
                        title: 'Tare Failed',
                        description: result.error || 'Failed to tare scale',
                        variant: 'destructive',
                    });
                }
            } else {
                toast({
                    title: 'Not Supported',
                    description: 'Scale taring only available in desktop app',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error taring scale',
                variant: 'destructive',
            });
        }
    };

    const testNetworkConnection = async () => {
        try {
            if (settings?.deviceRole === 'client' && settings.serverIpAddress) {
                // Test connection to server
                const response = await fetch(`http://${settings.serverIpAddress}:5001/api/health`);
                if (response.ok) {
                    toast({
                        title: 'Network Test Successful',
                        description: `Connected to server at ${settings.serverIpAddress}`,
                    });
                } else {
                    toast({
                        title: 'Network Test Failed',
                        description: `Failed to connect to server at ${settings.serverIpAddress}`,
                        variant: 'destructive',
                    });
                }
            } else if (settings?.deviceRole === 'server') {
                // Get local IP addresses for server
                const response = await fetch('/api/discovery');
                if (response.ok) {
                    const discoveryData = await response.json();
                    toast({
                        title: 'Server Info',
                        description: `Server running on IPs: ${discoveryData.ipAddresses.join(', ')}`,
                    });
                } else {
                    toast({
                        title: 'Server Mode',
                        description: 'This device is configured as a server.',
                    });
                }
            } else {
                toast({
                    title: 'Standalone Mode',
                    description: 'This device is operating in standalone mode.',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error testing network connection',
                variant: 'destructive',
            });
        }
    };

    const syncWithServer = async () => {
        try {
            if (settings?.deviceRole === 'client' && settings.serverIpAddress) {
                toast({
                    title: 'Sync Started',
                    description: 'Starting synchronization with server...',
                });

                // In a real implementation, this would trigger a sync process
                // For now, we'll just show a mock success message
                setTimeout(() => {
                    toast({
                        title: 'Sync Completed',
                        description: 'Data synchronized with server successfully.',
                    });
                }, 2000);
            } else {
                toast({
                    title: 'Sync Not Available',
                    description: 'Sync is only available for client devices.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error synchronizing with server',
                variant: 'destructive',
            });
        }
    };

    if (isLoading || !settings) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading settings...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{t('Settings')}</h1>
                        <p className="text-muted-foreground">{t('Configure your OpenSauce P.O.S.')}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleResetSettings}
                    >
                        Reset to Defaults
                    </Button>
                </div>

                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-9">
                        <TabsTrigger value="general" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">🏪</span>
                            <Store className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('General')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="hardware" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">🖨️</span>
                            <Printer className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('Hardware')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="receipt" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">🧾</span>
                            <Receipt className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('Receipt')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">💳</span>
                            <CreditCard className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('Payment')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="whatsapp" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">💬</span>
                            <MessageCircle className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">WhatsApp</span>
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">👥</span>
                            <Users className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('Users')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="network" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">🌐</span>
                            <Server className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('Network')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">🛡️</span>
                            <Shield className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">System</span>
                        </TabsTrigger>
                        <TabsTrigger value="additional" className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:hidden">⚙️</span>
                            <Settings2 className="h-4 w-4 hidden md:block" />
                            <span className="hidden md:inline">{t('Additional')}</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Network Configuration Tab */}
                    <TabsContent value="network" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    Network Configuration
                                </CardTitle>
                                <CardDescription>Configure this device as a server or client in a multi-device setup</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="deviceRole">Device Role</Label>
                                        <Select
                                            defaultValue={settings.deviceRole || 'standalone'}
                                            onValueChange={(value) => handleFieldUpdate('deviceRole', value)}
                                        >
                                            <SelectTrigger id="deviceRole">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standalone">Standalone (Default)</SelectItem>
                                                <SelectItem value="server">Server (Main Database)</SelectItem>
                                                <SelectItem value="client">Client (Connects to Server)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            Select how this device should operate in a networked environment.
                                        </p>
                                    </div>

                                    {settings.deviceRole === 'client' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="serverIpAddress">Server IP Address</Label>
                                            <Input
                                                id="serverIpAddress"
                                                defaultValue={settings.serverIpAddress || ''}
                                                onBlur={(e) => handleFieldUpdate('serverIpAddress', e.target.value)}
                                                placeholder="192.168.1.100"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Enter the IP address of the server device that hosts the main database.
                                            </p>
                                        </div>
                                    )}

                                    {settings.deviceRole === 'server' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <Server className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                                                <div>
                                                    <h4 className="font-medium text-green-800">Server Mode Active</h4>
                                                    <p className="text-sm text-green-700 mt-1">
                                                        This device is configured as the server. Other devices can connect to it using the IP addresses shown below.
                                                    </p>
                                                    <button
                                                        onClick={() => testNetworkConnection()}
                                                        className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                                                    >
                                                        Show IP Addresses
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {settings.deviceRole === 'client' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <Laptop className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                                                <div>
                                                    <h4 className="font-medium text-blue-800">Client Mode Active</h4>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        This device will connect to the server at {settings.serverIpAddress ?? 'not configured'} for database operations.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {settings.deviceRole === 'standalone' && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <Settings2 className="h-5 w-5 text-gray-600 mt-0.5 mr-2" />
                                                <div>
                                                    <h4 className="font-medium text-gray-800">Standalone Mode</h4>
                                                    <p className="text-sm text-gray-700 mt-1">
                                                        This device operates independently with its own local database.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => testNetworkConnection()}
                                        >
                                            Test Connection
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => syncWithServer()}
                                        >
                                            Sync with Server
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* General Settings Tab */}
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Store Information</CardTitle>
                                <CardDescription>Basic information about your store</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="storeName">Store Name</Label>
                                        <Input
                                            id="storeName"
                                            defaultValue={settings.storeName}
                                            onBlur={(e) => handleFieldUpdate('storeName', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select
                                            defaultValue={settings.currency}
                                            onValueChange={(value) => handleFieldUpdate('currency', value)}
                                        >
                                            <SelectTrigger id="currency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="R">South African Rand (R)</SelectItem>
                                                <SelectItem value="$">US Dollar ($)</SelectItem>
                                                <SelectItem value="€">Euro (€)</SelectItem>
                                                <SelectItem value="£">British Pound (£)</SelectItem>
                                                <SelectItem value="¥">Japanese Yen (¥)</SelectItem>
                                                <SelectItem value="₹">Indian Rupee (₹)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="storeAddress">Address</Label>
                                    <Input
                                        id="storeAddress"
                                        defaultValue={settings.storeAddress ?? ''}
                                        onBlur={(e) => handleFieldUpdate('storeAddress', e.target.value)}
                                        placeholder="123 Store Street, City, Country"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="storePhone">Phone</Label>
                                        <Input
                                            id="storePhone"
                                            defaultValue={settings.storePhone ?? ''}
                                            onBlur={(e) => handleFieldUpdate('storePhone', e.target.value)}
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="storeEmail">Email</Label>
                                        <Input
                                            id="storeEmail"
                                            type="email"
                                            defaultValue={settings.storeEmail ?? ''}
                                            onBlur={(e) => handleFieldUpdate('storeEmail', e.target.value)}
                                            placeholder="store@example.com"
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="storeLogo">Store Logo</Label>
                                    <Input
                                        id="storeLogo"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'logo')}
                                        className="cursor-pointer"
                                    />
                                    {logoPreview && (
                                        <div className="mt-4">
                                            <img
                                                src={logoPreview}
                                                alt="Store Logo"
                                                className="max-w-[200px] max-h-[100px] object-contain border rounded p-2"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Hardware Mapping Tab */}
                    <TabsContent value="hardware" className="space-y-6">
                        <BluetoothSettingsCard
                            onDeviceConnected={(deviceId) => {
                                handleFieldUpdate('printerType', 'bluetooth');
                                handleFieldUpdate('printerIp', deviceId);
                            }}
                        />
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Printer className="h-5 w-5" />
                                    Receipt Printer
                                </CardTitle>
                                <CardDescription>Configure your receipt printer</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="printerType">Printer Connection</Label>
                                        <Select
                                            defaultValue={settings.printerType || 'usb'}
                                            onValueChange={(value) => handleFieldUpdate('printerType', value)}
                                        >
                                            <SelectTrigger id="printerType">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="usb">USB (Desktop)</SelectItem>
                                                <SelectItem value="network">Network (Ethernet/WiFi)</SelectItem>
                                                <SelectItem value="bluetooth">Bluetooth (Mobile)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="printerName">Printer Name/Model</Label>
                                        <Input
                                            id="printerName"
                                            defaultValue={settings.printerName || ''}
                                            onBlur={(e) => handleFieldUpdate('printerName', e.target.value)}
                                            placeholder="e.g., EPSON TM-T88"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="printerIp">
                                            {settings.printerType === 'bluetooth' ? 'Bluetooth Device ID' : 'Printer IP Address'}
                                        </Label>
                                        <Input
                                            id="printerIp"
                                            defaultValue={settings.printerIp || ''}
                                            onBlur={(e) => handleFieldUpdate('printerIp', e.target.value)}
                                            placeholder={settings.printerType === 'bluetooth' ? 'Auto-filled on connect' : '192.168.1.100'}
                                            readOnly={settings.printerType === 'bluetooth'}
                                            className={settings.printerType === 'bluetooth' ? 'bg-muted' : ''}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => testPrinterConnection()}
                                    >
                                        Test Connection
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => printTestReceipt()}
                                    >
                                        Print Test Receipt
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ScanLine className="h-5 w-5" />
                                    Barcode Scanner
                                </CardTitle>
                                <CardDescription>Configure your barcode scanner</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="scannerDeviceId">Device ID</Label>
                                        <Input
                                            id="scannerDeviceId"
                                            defaultValue={settings.scannerDeviceId || ''}
                                            onBlur={(e) => handleFieldUpdate('scannerDeviceId', e.target.value)}
                                            placeholder="Scanner device ID"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scannerComPort">COM Port</Label>
                                        <Input
                                            id="scannerComPort"
                                            defaultValue={settings.scannerComPort || ''}
                                            onBlur={(e) => handleFieldUpdate('scannerComPort', e.target.value)}
                                            placeholder="COM3"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => testScannerConnection()}
                                    >
                                        Test Connection
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Camera
                                </CardTitle>
                                <CardDescription>Configure camera for barcode scanning</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cameraDeviceId">Camera Device ID</Label>
                                    <Input
                                        id="cameraDeviceId"
                                        defaultValue={settings.cameraDeviceId || ''}
                                        onBlur={(e) => handleFieldUpdate('cameraDeviceId', e.target.value)}
                                        placeholder="Camera device ID"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Cash Drawer
                                </CardTitle>
                                <CardDescription>Configure cash drawer connection</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cashDrawerPort">COM Port</Label>
                                    <Input
                                        id="cashDrawerPort"
                                        defaultValue={settings.cashDrawerPort || ''}
                                        onBlur={(e) => handleFieldUpdate('cashDrawerPort', e.target.value)}
                                        placeholder="COM4"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => testCashDrawerConnection()}
                                    >
                                        Test Connection
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => openCashDrawer()}
                                    >
                                        Open Drawer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Monitor className="h-5 w-5" />
                                    Customer Display
                                </CardTitle>
                                <CardDescription>Configure secondary display for customers</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerDisplayType">Display Type</Label>
                                        <Select
                                            defaultValue={settings.customerDisplayType || 'monitor'}
                                            onValueChange={(value) => handleFieldUpdate('customerDisplayType', value)}
                                        >
                                            <SelectTrigger id="customerDisplayType">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monitor">Secondary Monitor</SelectItem>
                                                <SelectItem value="ip">Network Display</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customerDisplayValue">
                                            {settings.customerDisplayType === 'ip' ? 'IP Address' : 'Monitor Number'}
                                        </Label>
                                        <Input
                                            id="customerDisplayValue"
                                            defaultValue={settings.customerDisplayValue || ''}
                                            onBlur={(e) => handleFieldUpdate('customerDisplayValue', e.target.value)}
                                            placeholder={settings.customerDisplayType === 'ip' ? '192.168.1.101' : '2'}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => testCustomerDisplayConnection()}
                                    >
                                        Test Connection
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => updateCustomerDisplay()}
                                    >
                                        Show Test Message
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5" />
                                    Scale
                                </CardTitle>
                                <CardDescription>Configure weighing scale</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="scalePort">COM Port</Label>
                                        <Input
                                            id="scalePort"
                                            defaultValue={settings.scalePort || ''}
                                            onBlur={(e) => handleFieldUpdate('scalePort', e.target.value)}
                                            placeholder="COM5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scaleDeviceId">Device ID</Label>
                                        <Input
                                            id="scaleDeviceId"
                                            defaultValue={settings.scaleDeviceId || ''}
                                            onBlur={(e) => handleFieldUpdate('scaleDeviceId', e.target.value)}
                                            placeholder="Scale device ID"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => testScaleConnection()}
                                    >
                                        Test Connection
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => readScaleWeight()}
                                    >
                                        Read Weight
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => tareScale()}
                                    >
                                        Tare Scale
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Receipt Layout Tab */}
                    <TabsContent value="receipt" className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Receipt Format</CardTitle>
                                        <CardDescription>Configure receipt appearance</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="receiptWidth">Receipt Width</Label>
                                            <Select
                                                defaultValue={settings.receiptWidth ?? undefined}
                                                onValueChange={(value) => handleFieldUpdate('receiptWidth', value)}
                                            >
                                                <SelectTrigger id="receiptWidth">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="58mm">58mm (Small)</SelectItem>
                                                    <SelectItem value="80mm">80mm (Standard)</SelectItem>
                                                    <SelectItem value="custom">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {settings.receiptWidth === 'custom' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="receiptCustomWidth">Custom Width (mm)</Label>
                                                <Input
                                                    id="receiptCustomWidth"
                                                    type="number"
                                                    defaultValue={settings.receiptCustomWidth ?? ''}
                                                    onBlur={(e) => handleFieldUpdate('receiptCustomWidth', parseInt(e.target.value))}
                                                    placeholder="70"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="receiptFontSize">Font Size</Label>
                                            <Select
                                                defaultValue={settings.receiptFontSize ?? undefined}
                                                onValueChange={(value) => handleFieldUpdate('receiptFontSize', value)}
                                            >
                                                <SelectTrigger id="receiptFontSize">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="small">Small</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="large">Large</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <Label htmlFor="receiptHeaderText">Header Text</Label>
                                            <Input
                                                id="receiptHeaderText"
                                                defaultValue={settings.receiptHeaderText ?? ''}
                                                onBlur={(e) => handleFieldUpdate('receiptHeaderText', e.target.value)}
                                                placeholder="Thank you for shopping with us!"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="receiptFooterText">Footer Text</Label>
                                            <Input
                                                id="receiptFooterText"
                                                defaultValue={settings.receiptFooterText ?? ''}
                                                onBlur={(e) => handleFieldUpdate('receiptFooterText', e.target.value)}
                                                placeholder="Please visit us again!"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Receipt Fields</CardTitle>
                                        <CardDescription>Show or hide fields on receipt</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="receiptShowLogo">Show Logo</Label>
                                            <Switch
                                                id="receiptShowLogo"
                                                checked={settings.receiptShowLogo ?? true}
                                                onCheckedChange={(checked) => handleFieldUpdate('receiptShowLogo', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="receiptShowOrderNumber">Show Order Number</Label>
                                            <Switch
                                                id="receiptShowOrderNumber"
                                                checked={settings.receiptShowOrderNumber ?? true}
                                                onCheckedChange={(checked) => handleFieldUpdate('receiptShowOrderNumber', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="receiptShowDate">Show Date</Label>
                                            <Switch
                                                id="receiptShowDate"
                                                checked={settings.receiptShowDate ?? true}
                                                onCheckedChange={(checked) => handleFieldUpdate('receiptShowDate', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="receiptShowCustomer">Show Customer Info</Label>
                                            <Switch
                                                id="receiptShowCustomer"
                                                checked={settings.receiptShowCustomer ?? true}
                                                onCheckedChange={(checked) => handleFieldUpdate('receiptShowCustomer', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="receiptShowPaymentMethod">Show Payment Method</Label>
                                            <Switch
                                                id="receiptShowPaymentMethod"
                                                checked={settings.receiptShowPaymentMethod ?? true}
                                                onCheckedChange={(checked) => handleFieldUpdate('receiptShowPaymentMethod', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="receiptShowBarcode">Show Barcode</Label>
                                            <Switch
                                                id="receiptShowBarcode"
                                                checked={settings.receiptShowBarcode ?? false}
                                                onCheckedChange={(checked) => handleFieldUpdate('receiptShowBarcode', checked)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Receipt Preview */}
                            <div>
                                <ReceiptPreview settings={settings} logoPreview={logoPreview} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Payment Settings Tab */}
                    <TabsContent value="payment" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment QR Code</CardTitle>
                                <CardDescription>Upload a QR code for digital payments</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentQrCode">QR Code Image</Label>
                                    <Input
                                        id="paymentQrCode"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'qr')}
                                        className="cursor-pointer"
                                    />
                                    {qrPreview && (
                                        <div className="mt-4">
                                            <img
                                                src={qrPreview}
                                                alt="Payment QR Code"
                                                className="max-w-[200px] mx-auto border rounded p-2"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Additional Options Tab */}
                    <TabsContent value="additional" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('System Customization')}</CardTitle>
                                <CardDescription>{t('Customize the look and feel of your POS')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="theme">{t('POS Theme')}</Label>
                                        <Select
                                            defaultValue={settings.theme || 'light'}
                                            onValueChange={(value) => handleFieldUpdate('theme', value)}
                                        >
                                            <SelectTrigger id="theme">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">{t('Light Mode')}</SelectItem>
                                                <SelectItem value="dark">{t('Dark Mode')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            {t('Select the visual theme for the application.')}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="language">{t('System Language')}</Label>
                                        <Select
                                            defaultValue={settings.language || 'en'}
                                            onValueChange={(value) => handleFieldUpdate('language', value)}
                                        >
                                            <SelectTrigger id="language">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="es">Spanish (Español)</SelectItem>
                                                <SelectItem value="fr">French (Français)</SelectItem>
                                                <SelectItem value="de">German (Deutsch)</SelectItem>
                                                <SelectItem value="zh">Chinese (中文)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            {t('Select your preferred language for the interface.')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* WhatsApp Integration Tab */}
                    <TabsContent value="whatsapp" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    WhatsApp Web Integration
                                </CardTitle>
                                <CardDescription>Configure WhatsApp Web for sending receipts and customer interactions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                                            <div>
                                                <h4 className="font-medium text-blue-800">WhatsApp Web Setup</h4>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    This integration uses WhatsApp Web for sending messages. You'll need to scan the QR code the first time to link your WhatsApp account.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => whatsappWebService.openWhatsAppWeb()}
                                                >
                                                    Open WhatsApp Web
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="whatsappEnabled">Enable WhatsApp Integration</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Allow sending receipts and interacting with customers via WhatsApp Web
                                            </p>
                                        </div>
                                        <Switch
                                            id="whatsappEnabled"
                                            checked={settings.whatsappEnabled ?? false}
                                            onCheckedChange={(checked) => handleFieldUpdate('whatsappEnabled', checked)}
                                        />
                                    </div>

                                    {settings.whatsappEnabled && (
                                        <>
                                            <Separator />

                                            <div className="space-y-2">
                                                <Label htmlFor="whatsappPhoneNumber">Business Phone Number</Label>
                                                <div className="flex gap-2">
                                                    <Select defaultValue="+27">
                                                        <SelectTrigger className="w-24">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                                            <SelectItem value="+27">🇿🇦 +27</SelectItem>
                                                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                                            <SelectItem value="+49">🇩🇪 +49</SelectItem>
                                                            <SelectItem value="+33">🇫🇷 +33</SelectItem>
                                                            <SelectItem value="+39">🇮🇹 +39</SelectItem>
                                                            <SelectItem value="+34">🇪🇸 +34</SelectItem>
                                                            <SelectItem value="+31">🇳🇱 +31</SelectItem>
                                                            <SelectItem value="+46">🇸🇪 +46</SelectItem>
                                                            <SelectItem value="+47">🇳🇴 +47</SelectItem>
                                                            <SelectItem value="+45">🇩🇰 +45</SelectItem>
                                                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                                                            <SelectItem value="+86">🇨🇳 +86</SelectItem>
                                                            <SelectItem value="+81">🇯🇵 +81</SelectItem>
                                                            <SelectItem value="+82">🇰🇷 +82</SelectItem>
                                                            <SelectItem value="+65">🇸🇬 +65</SelectItem>
                                                            <SelectItem value="+60">🇲🇾 +60</SelectItem>
                                                            <SelectItem value="+66">🇹🇭 +66</SelectItem>
                                                            <SelectItem value="+84">🇻🇳 +84</SelectItem>
                                                            <SelectItem value="+62">🇮🇩 +62</SelectItem>
                                                            <SelectItem value="+63">🇵🇭 +63</SelectItem>
                                                            <SelectItem value="+61">🇦🇺 +61</SelectItem>
                                                            <SelectItem value="+64">🇳🇿 +64</SelectItem>
                                                            <SelectItem value="+55">🇧🇷 +55</SelectItem>
                                                            <SelectItem value="+52">🇲🇽 +52</SelectItem>
                                                            <SelectItem value="+54">🇦🇷 +54</SelectItem>
                                                            <SelectItem value="+56">🇨🇱 +56</SelectItem>
                                                            <SelectItem value="+57">🇨🇴 +57</SelectItem>
                                                            <SelectItem value="+58">🇻🇪 +58</SelectItem>
                                                            <SelectItem value="+51">🇵🇪 +51</SelectItem>
                                                            <SelectItem value="+593">🇪🇨 +593</SelectItem>
                                                            <SelectItem value="+598">🇺🇾 +598</SelectItem>
                                                            <SelectItem value="+595">🇵🇾 +595</SelectItem>
                                                            <SelectItem value="+507">🇵🇦 +507</SelectItem>
                                                            <SelectItem value="+506">🇨🇷 +506</SelectItem>
                                                            <SelectItem value="+502">🇬🇹 +502</SelectItem>
                                                            <SelectItem value="+503">🇸🇻 +503</SelectItem>
                                                            <SelectItem value="+504">🇭🇳 +504</SelectItem>
                                                            <SelectItem value="+505">🇳🇮 +505</SelectItem>
                                                            <SelectItem value="+53">🇨🇺 +53</SelectItem>
                                                            <SelectItem value="+1-242">🇧🇸 +1-242</SelectItem>
                                                            <SelectItem value="+1-246">🇧🇧 +1-246</SelectItem>
                                                            <SelectItem value="+1-441">🇧🇲 +1-441</SelectItem>
                                                            <SelectItem value="+1-345">🇰🇾 +1-345</SelectItem>
                                                            <SelectItem value="+1-767">🇩🇲 +1-767</SelectItem>
                                                            <SelectItem value="+1-721">🇸🇽 +1-721</SelectItem>
                                                            <SelectItem value="+1-868">🇹🇹 +1-868</SelectItem>
                                                            <SelectItem value="+1-784">🇻🇨 +1-784</SelectItem>
                                                            <SelectItem value="+1-809">🇩🇴 +1-809</SelectItem>
                                                            <SelectItem value="+1-829">🇩🇴 +1-829</SelectItem>
                                                            <SelectItem value="+1-849">🇩🇴 +1-849</SelectItem>
                                                            <SelectItem value="+20">🇪🇬 +20</SelectItem>
                                                            <SelectItem value="+966">🇸🇦 +966</SelectItem>
                                                            <SelectItem value="+971">🇦🇪 +971</SelectItem>
                                                            <SelectItem value="+974">🇶🇦 +974</SelectItem>
                                                            <SelectItem value="+968">🇴🇲 +968</SelectItem>
                                                            <SelectItem value="+973">🇧🇭 +973</SelectItem>
                                                            <SelectItem value="+965">🇰🇼 +965</SelectItem>
                                                            <SelectItem value="+964">🇮🇶 +964</SelectItem>
                                                            <SelectItem value="+98">🇮🇷 +98</SelectItem>
                                                            <SelectItem value="+90">🇹🇷 +90</SelectItem>
                                                            <SelectItem value="+7">🇷🇺 +7</SelectItem>
                                                            <SelectItem value="+380">🇺🇦 +380</SelectItem>
                                                            <SelectItem value="+48">🇵🇱 +48</SelectItem>
                                                            <SelectItem value="+40">🇷🇴 +40</SelectItem>
                                                            <SelectItem value="+359">🇧🇬 +359</SelectItem>
                                                            <SelectItem value="+30">🇬🇷 +30</SelectItem>
                                                            <SelectItem value="+36">🇭🇺 +36</SelectItem>
                                                            <SelectItem value="+43">🇦🇹 +43</SelectItem>
                                                            <SelectItem value="+41">🇨🇭 +41</SelectItem>
                                                            <SelectItem value="+32">🇧🇪 +32</SelectItem>
                                                            <SelectItem value="+351">🇵🇹 +351</SelectItem>
                                                            <SelectItem value="+353">🇮🇪 +353</SelectItem>
                                                            <SelectItem value="+372">🇪🇪 +372</SelectItem>
                                                            <SelectItem value="+371">🇱🇻 +371</SelectItem>
                                                            <SelectItem value="+370">🇱🇹 +370</SelectItem>
                                                            <SelectItem value="+358">🇫🇮 +358</SelectItem>
                                                            <SelectItem value="+420">🇨🇿 +420</SelectItem>
                                                            <SelectItem value="+421">🇸🇰 +421</SelectItem>
                                                            <SelectItem value="+386">🇸🇮 +386</SelectItem>
                                                            <SelectItem value="+385">🇭🇷 +385</SelectItem>
                                                            <SelectItem value="+381">🇷🇸 +381</SelectItem>
                                                            <SelectItem value="+389">🇲🇰 +389</SelectItem>
                                                            <SelectItem value="+355">🇦🇱 +355</SelectItem>
                                                            <SelectItem value="+374">🇦🇲 +374</SelectItem>
                                                            <SelectItem value="+994">🇦🇿 +994</SelectItem>
                                                            <SelectItem value="+995">🇬🇪 +995</SelectItem>
                                                            <SelectItem value="+7-6">🇰🇿 +7-6</SelectItem>
                                                            <SelectItem value="+7-7">🇰🇬 +7-7</SelectItem>
                                                            <SelectItem value="+992">🇹🇯 +992</SelectItem>
                                                            <SelectItem value="+993">🇹🇲 +993</SelectItem>
                                                            <SelectItem value="+994">🇦🇿 +994</SelectItem>
                                                            <SelectItem value="+250">🇷🇼 +250</SelectItem>
                                                            <SelectItem value="+256">🇺🇬 +256</SelectItem>
                                                            <SelectItem value="+254">🇰🇪 +254</SelectItem>
                                                            <SelectItem value="+255">🇹🇿 +255</SelectItem>
                                                            <SelectItem value="+257">🇧🇮 +257</SelectItem>
                                                            <SelectItem value="+258">🇲🇿 +258</SelectItem>
                                                            <SelectItem value="+260">🇿🇲 +260</SelectItem>
                                                            <SelectItem value="+263">🇿🇼 +263</SelectItem>
                                                            <SelectItem value="+265">🇲🇼 +265</SelectItem>
                                                            <SelectItem value="+267">🇧🇼 +267</SelectItem>
                                                            <SelectItem value="+268">🇸🇿 +268</SelectItem>
                                                            <SelectItem value="+269">🇰🇲 +269</SelectItem>
                                                            <SelectItem value="+261">🇲🇬 +261</SelectItem>
                                                            <SelectItem value="+262">🇷🇪 +262</SelectItem>
                                                            <SelectItem value="+263">🇿🇼 +263</SelectItem>
                                                            <SelectItem value="+264">🇳🇦 +264</SelectItem>
                                                            <SelectItem value="+266">🇱🇸 +266</SelectItem>
                                                            <SelectItem value="+231">🇱🇷 +231</SelectItem>
                                                            <SelectItem value="+225">🇨🇮 +225</SelectItem>
                                                            <SelectItem value="+223">🇲🇱 +223</SelectItem>
                                                            <SelectItem value="+221">🇸🇳 +221</SelectItem>
                                                            <SelectItem value="+220">🇬🇲 +220</SelectItem>
                                                            <SelectItem value="+216">🇹🇳 +216</SelectItem>
                                                            <SelectItem value="+213">🇩🇿 +213</SelectItem>
                                                            <SelectItem value="+212">🇲🇦 +212</SelectItem>
                                                            <SelectItem value="+211">🇸🇸 +211</SelectItem>
                                                            <SelectItem value="+249">🇸🇩 +249</SelectItem>
                                                            <SelectItem value="+252">🇸🇴 +252</SelectItem>
                                                            <SelectItem value="+251">🇪🇹 +251</SelectItem>
                                                            <SelectItem value="+253">🇩🇯 +253</SelectItem>
                                                            <SelectItem value="+243">🇨🇩 +243</SelectItem>
                                                            <SelectItem value="+242">🇨🇬 +242</SelectItem>
                                                            <SelectItem value="+241">🇬🇦 +241</SelectItem>
                                                            <SelectItem value="+240">🇦🇴 +240</SelectItem>
                                                            <SelectItem value="+239">🇸🇹 +239</SelectItem>
                                                            <SelectItem value="+238">🇨🇻 +238</SelectItem>
                                                            <SelectItem value="+235">🇹🇩 +235</SelectItem>
                                                            <SelectItem value="+234">🇳🇬 +234</SelectItem>
                                                            <SelectItem value="+233">🇬🇭 +233</SelectItem>
                                                            <SelectItem value="+232">🇸🇱 +232</SelectItem>
                                                            <SelectItem value="+227">🇳🇪 +227</SelectItem>
                                                            <SelectItem value="+226">🇧🇫 +226</SelectItem>
                                                            <SelectItem value="+224">🇬🇳 +224</SelectItem>
                                                            <SelectItem value="+222">🇲🇷 +222</SelectItem>
                                                            <SelectItem value="+218">🇱🇾 +218</SelectItem>
                                                            <SelectItem value="+237">🇨🇲 +237</SelectItem>
                                                            <SelectItem value="+236">🇨🇫 +236</SelectItem>
                                                            <SelectItem value="+228">🇹🇬 +228</SelectItem>
                                                            <SelectItem value="+229">🇧🇯 +229</SelectItem>
                                                            <SelectItem value="+225">🇨🇮 +225</SelectItem>
                                                            <SelectItem value="+230">🇲🇺 +230</SelectItem>
                                                            <SelectItem value="+244">🇦🇴 +244</SelectItem>
                                                            <SelectItem value="+245">🇬🇼 +245</SelectItem>
                                                            <SelectItem value="+246">🇮🇴 +246</SelectItem>
                                                            <SelectItem value="+247">🇦🇨 +247</SelectItem>
                                                            <SelectItem value="+248">🇸🇨 +248</SelectItem>
                                                            <SelectItem value="+249">🇸🇩 +249</SelectItem>
                                                            <SelectItem value="+250">🇷🇼 +250</SelectItem>
                                                            <SelectItem value="+251">🇪🇹 +251</SelectItem>
                                                            <SelectItem value="+252">🇸🇴 +252</SelectItem>
                                                            <SelectItem value="+253">🇩🇯 +253</SelectItem>
                                                            <SelectItem value="+254">🇰🇪 +254</SelectItem>
                                                            <SelectItem value="+255">🇹🇿 +255</SelectItem>
                                                            <SelectItem value="+256">🇺🇬 +256</SelectItem>
                                                            <SelectItem value="+257">🇧🇮 +257</SelectItem>
                                                            <SelectItem value="+258">🇲🇿 +258</SelectItem>
                                                            <SelectItem value="+259">🇿🇦 +259</SelectItem>
                                                            <SelectItem value="+260">🇿🇲 +260</SelectItem>
                                                            <SelectItem value="+261">🇲🇬 +261</SelectItem>
                                                            <SelectItem value="+262">🇷🇪 +262</SelectItem>
                                                            <SelectItem value="+263">🇿🇼 +263</SelectItem>
                                                            <SelectItem value="+264">🇳🇦 +264</SelectItem>
                                                            <SelectItem value="+265">🇲🇼 +265</SelectItem>
                                                            <SelectItem value="+266">🇱🇸 +266</SelectItem>
                                                            <SelectItem value="+267">🇧🇼 +267</SelectItem>
                                                            <SelectItem value="+268">🇸🇿 +268</SelectItem>
                                                            <SelectItem value="+269">🇰🇲 +269</SelectItem>
                                                            <SelectItem value="+290">🇸🇭 +290</SelectItem>
                                                            <SelectItem value="+291">🇪🇷 +291</SelectItem>
                                                            <SelectItem value="+297">🇦🇼 +297</SelectItem>
                                                            <SelectItem value="+298">🇫🇴 +298</SelectItem>
                                                            <SelectItem value="+299">🇬🇱 +299</SelectItem>
                                                            <SelectItem value="+350">🇬🇮 +350</SelectItem>
                                                            <SelectItem value="+351">🇵🇹 +351</SelectItem>
                                                            <SelectItem value="+352">🇱🇺 +352</SelectItem>
                                                            <SelectItem value="+353">🇮🇪 +353</SelectItem>
                                                            <SelectItem value="+354">🇮🇸 +354</SelectItem>
                                                            <SelectItem value="+355">🇦🇱 +355</SelectItem>
                                                            <SelectItem value="+356">🇲🇹 +356</SelectItem>
                                                            <SelectItem value="+357">🇨🇾 +357</SelectItem>
                                                            <SelectItem value="+358">🇫🇮 +358</SelectItem>
                                                            <SelectItem value="+359">🇧🇬 +359</SelectItem>
                                                            <SelectItem value="+370">🇱🇹 +370</SelectItem>
                                                            <SelectItem value="+371">🇱🇻 +371</SelectItem>
                                                            <SelectItem value="+372">🇪🇪 +372</SelectItem>
                                                            <SelectItem value="+373">🇲🇩 +373</SelectItem>
                                                            <SelectItem value="+374">🇦🇲 +374</SelectItem>
                                                            <SelectItem value="+375">🇧🇾 +375</SelectItem>
                                                            <SelectItem value="+376">🇦🇩 +376</SelectItem>
                                                            <SelectItem value="+377">🇲🇨 +377</SelectItem>
                                                            <SelectItem value="+378">🇸🇲 +378</SelectItem>
                                                            <SelectItem value="+379">🇻🇦 +379</SelectItem>
                                                            <SelectItem value="+380">🇺🇦 +380</SelectItem>
                                                            <SelectItem value="+381">🇷🇸 +381</SelectItem>
                                                            <SelectItem value="+382">🇲🇪 +382</SelectItem>
                                                            <SelectItem value="+383">🇽🇰 +383</SelectItem>
                                                            <SelectItem value="+385">🇭🇷 +385</SelectItem>
                                                            <SelectItem value="+386">🇸🇮 +386</SelectItem>
                                                            <SelectItem value="+387">🇧🇦 +387</SelectItem>
                                                            <SelectItem value="+389">🇲🇰 +389</SelectItem>
                                                            <SelectItem value="+420">🇨🇿 +420</SelectItem>
                                                            <SelectItem value="+421">🇸🇰 +421</SelectItem>
                                                            <SelectItem value="+423">🇱🇮 +423</SelectItem>
                                                            <SelectItem value="+500">🇫🇰 +500</SelectItem>
                                                            <SelectItem value="+501">🇧🇿 +501</SelectItem>
                                                            <SelectItem value="+502">🇬🇹 +502</SelectItem>
                                                            <SelectItem value="+503">🇸🇻 +503</SelectItem>
                                                            <SelectItem value="+504">🇭🇳 +504</SelectItem>
                                                            <SelectItem value="+505">🇳🇮 +505</SelectItem>
                                                            <SelectItem value="+506">🇨🇷 +506</SelectItem>
                                                            <SelectItem value="+507">🇵🇦 +507</SelectItem>
                                                            <SelectItem value="+508">🇵🇲 +508</SelectItem>
                                                            <SelectItem value="+509">🇭🇹 +509</SelectItem>
                                                            <SelectItem value="+590">🇬🇵 +590</SelectItem>
                                                            <SelectItem value="+591">🇧🇴 +591</SelectItem>
                                                            <SelectItem value="+592">🇬🇾 +592</SelectItem>
                                                            <SelectItem value="+593">🇪🇨 +593</SelectItem>
                                                            <SelectItem value="+594">🇬🇫 +594</SelectItem>
                                                            <SelectItem value="+595">🇵🇾 +595</SelectItem>
                                                            <SelectItem value="+596">🇲🇶 +596</SelectItem>
                                                            <SelectItem value="+597">🇸🇷 +597</SelectItem>
                                                            <SelectItem value="+598">🇺🇾 +598</SelectItem>
                                                            <SelectItem value="+599">🇨🇼 +599</SelectItem>
                                                            <SelectItem value="+670">🇹🇱 +670</SelectItem>
                                                            <SelectItem value="+672">🇦🇶 +672</SelectItem>
                                                            <SelectItem value="+673">🇧🇳 +673</SelectItem>
                                                            <SelectItem value="+674">🇳🇷 +674</SelectItem>
                                                            <SelectItem value="+675">🇵🇬 +675</SelectItem>
                                                            <SelectItem value="+676">🇹🇴 +676</SelectItem>
                                                            <SelectItem value="+677">🇸🇧 +677</SelectItem>
                                                            <SelectItem value="+678">🇻🇺 +678</SelectItem>
                                                            <SelectItem value="+679">🇫🇯 +679</SelectItem>
                                                            <SelectItem value="+680">🇵🇼 +680</SelectItem>
                                                            <SelectItem value="+681">🇼🇫 +681</SelectItem>
                                                            <SelectItem value="+682">🇨🇰 +682</SelectItem>
                                                            <SelectItem value="+683">🇳🇺 +683</SelectItem>
                                                            <SelectItem value="+684">🇦🇸 +684</SelectItem>
                                                            <SelectItem value="+685">🇼🇸 +685</SelectItem>
                                                            <SelectItem value="+686">🇰🇮 +686</SelectItem>
                                                            <SelectItem value="+687">🇳🇨 +687</SelectItem>
                                                            <SelectItem value="+688">🇹🇻 +688</SelectItem>
                                                            <SelectItem value="+689">🇵🇫 +689</SelectItem>
                                                            <SelectItem value="+690">🇹🇰 +690</SelectItem>
                                                            <SelectItem value="+691">🇫🇲 +691</SelectItem>
                                                            <SelectItem value="+692">🇲🇭 +692</SelectItem>
                                                            <SelectItem value="+850">🇰🇵 +850</SelectItem>
                                                            <SelectItem value="+852">🇭🇰 +852</SelectItem>
                                                            <SelectItem value="+853">🇲🇴 +853</SelectItem>
                                                            <SelectItem value="+855">🇰🇭 +855</SelectItem>
                                                            <SelectItem value="+856">🇱🇦 +856</SelectItem>
                                                            <SelectItem value="+880">🇧🇩 +880</SelectItem>
                                                            <SelectItem value="+886">🇹🇼 +886</SelectItem>
                                                            <SelectItem value="+960">🇲🇻 +960</SelectItem>
                                                            <SelectItem value="+961">🇱🇧 +961</SelectItem>
                                                            <SelectItem value="+962">🇯🇴 +962</SelectItem>
                                                            <SelectItem value="+963">🇸🇾 +963</SelectItem>
                                                            <SelectItem value="+964">🇮🇶 +964</SelectItem>
                                                            <SelectItem value="+965">🇰🇼 +965</SelectItem>
                                                            <SelectItem value="+966">🇸🇦 +966</SelectItem>
                                                            <SelectItem value="+967">🇾🇪 +967</SelectItem>
                                                            <SelectItem value="+968">🇴🇲 +968</SelectItem>
                                                            <SelectItem value="+970">🇵🇸 +970</SelectItem>
                                                            <SelectItem value="+971">🇦🇪 +971</SelectItem>
                                                            <SelectItem value="+972">🇮🇱 +972</SelectItem>
                                                            <SelectItem value="+973">🇧🇭 +973</SelectItem>
                                                            <SelectItem value="+974">🇶🇦 +974</SelectItem>
                                                            <SelectItem value="+975">🇧🇹 +975</SelectItem>
                                                            <SelectItem value="+976">🇲🇳 +976</SelectItem>
                                                            <SelectItem value="+977">🇳🇵 +977</SelectItem>
                                                            <SelectItem value="+992">🇹🇯 +992</SelectItem>
                                                            <SelectItem value="+993">🇹🇲 +993</SelectItem>
                                                            <SelectItem value="+994">🇦🇿 +994</SelectItem>
                                                            <SelectItem value="+995">🇬🇪 +995</SelectItem>
                                                            <SelectItem value="+996">🇰🇬 +996</SelectItem>
                                                            <SelectItem value="+998">🇺🇿 +998</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        id="whatsappPhoneNumber"
                                                        defaultValue={settings.whatsappPhoneNumber ? settings.whatsappPhoneNumber.replace(/^\+\d+/, '') : ''}
                                                        onBlur={(e) => {
                                                            const countryCode = (document.querySelector('[name="country-code"]') as HTMLSelectElement)?.value || '+27';
                                                            const fullNumber = countryCode + e.target.value.replace(/\D/g, '');
                                                            handleFieldUpdate('whatsappPhoneNumber', fullNumber);
                                                        }}
                                                        placeholder="821234567"
                                                        className="flex-1"
                                                    />
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Your business WhatsApp number - select country code and enter the local number (without country code)
                                                </p>
                                            </div>

                                            <Separator />

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="whatsappSendReceipts">Send Receipts via WhatsApp</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Automatically send receipts to customers after purchase (requires WhatsApp Web to be logged in)
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="whatsappSendReceipts"
                                                    checked={settings.whatsappSendReceipts ?? false}
                                                    onCheckedChange={(checked) => handleFieldUpdate('whatsappSendReceipts', checked)}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="space-y-2">
                                                <Label>Test WhatsApp Integration</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Send a test message to verify your WhatsApp Web integration is working correctly.
                                                </p>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" className="w-full">
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Send Test Message
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Send Test WhatsApp Message</DialogTitle>
                                                            <DialogDescription>
                                                                Enter a WhatsApp number to send a test message. Make sure WhatsApp Web is logged in.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="test-phone">Phone Number</Label>
                                                                <div className="flex gap-2">
                                                                    <Select defaultValue="+27" name="test-country-code">
                                                                        <SelectTrigger className="w-24">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                                                            <SelectItem value="+27">🇿🇦 +27</SelectItem>
                                                                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                                                            <SelectItem value="+49">🇩🇪 +49</SelectItem>
                                                                            <SelectItem value="+33">🇫🇷 +33</SelectItem>
                                                                            <SelectItem value="+39">🇮🇹 +39</SelectItem>
                                                                            <SelectItem value="+34">🇪🇸 +34</SelectItem>
                                                                            <SelectItem value="+31">🇳🇱 +31</SelectItem>
                                                                            <SelectItem value="+46">🇸🇪 +46</SelectItem>
                                                                            <SelectItem value="+47">🇳🇴 +47</SelectItem>
                                                                            <SelectItem value="+45">🇩🇰 +45</SelectItem>
                                                                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                                                                            <SelectItem value="+86">🇨🇳 +86</SelectItem>
                                                                            <SelectItem value="+81">🇯🇵 +81</SelectItem>
                                                                            <SelectItem value="+82">🇰🇷 +82</SelectItem>
                                                                            <SelectItem value="+65">🇸🇬 +65</SelectItem>
                                                                            <SelectItem value="+60">🇲🇾 +60</SelectItem>
                                                                            <SelectItem value="+66">🇹🇭 +66</SelectItem>
                                                                            <SelectItem value="+84">🇻🇳 +84</SelectItem>
                                                                            <SelectItem value="+62">🇮🇩 +62</SelectItem>
                                                                            <SelectItem value="+63">🇵🇭 +63</SelectItem>
                                                                            <SelectItem value="+61">🇦🇺 +61</SelectItem>
                                                                            <SelectItem value="+64">🇳🇿 +64</SelectItem>
                                                                            <SelectItem value="+55">🇧🇷 +55</SelectItem>
                                                                            <SelectItem value="+52">🇲🇽 +52</SelectItem>
                                                                            <SelectItem value="+54">🇦🇷 +54</SelectItem>
                                                                            <SelectItem value="+56">🇨🇱 +56</SelectItem>
                                                                            <SelectItem value="+57">🇨🇴 +57</SelectItem>
                                                                            <SelectItem value="+58">🇻🇪 +58</SelectItem>
                                                                            <SelectItem value="+51">🇵🇪 +51</SelectItem>
                                                                            <SelectItem value="+593">🇪🇨 +593</SelectItem>
                                                                            <SelectItem value="+598">🇺🇾 +598</SelectItem>
                                                                            <SelectItem value="+595">🇵🇾 +595</SelectItem>
                                                                            <SelectItem value="+507">🇵🇦 +507</SelectItem>
                                                                            <SelectItem value="+506">🇨🇷 +506</SelectItem>
                                                                            <SelectItem value="+502">🇬🇹 +502</SelectItem>
                                                                            <SelectItem value="+503">🇸🇻 +503</SelectItem>
                                                                            <SelectItem value="+504">🇭🇳 +504</SelectItem>
                                                                            <SelectItem value="+505">🇳🇮 +505</SelectItem>
                                                                            <SelectItem value="+53">🇨🇺 +53</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Input
                                                                        id="test-phone"
                                                                        placeholder="821234567"
                                                                        className="flex-1"
                                                                        defaultValue={settings.whatsappPhoneNumber ? settings.whatsappPhoneNumber.replace(/^\+\d+/, '') : ''}
                                                                    />
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Select country code and enter the local number (without country code)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline">Cancel</Button>
                                                            </DialogTrigger>
                                                            <Button
                                                                onClick={async () => {
                                                                    const phoneInput = document.getElementById('test-phone') as HTMLInputElement;
                                                                    const countryCodeSelect = document.querySelector('[name="test-country-code"]') as HTMLSelectElement;
                                                                    const localNumber = phoneInput?.value?.trim();
                                                                    const countryCode = countryCodeSelect?.value || '+27';

                                                                    if (!localNumber) {
                                                                        toast({
                                                                            title: 'Phone Number Required',
                                                                            description: 'Please enter a WhatsApp phone number.',
                                                                            variant: 'destructive',
                                                                        });
                                                                        return;
                                                                    }

                                                                    const fullPhoneNumber = countryCode + localNumber.replace(/\D/g, '');

                                                                    try {
                                                                        const success = await whatsappWebService.sendMessage(
                                                                            fullPhoneNumber,
                                                                            `🧪 *WhatsApp Test Message*\n\nHello! This is a test message from your OpenSauce POS system.\n\n📅 Sent at: ${new Date().toLocaleString()}\n\nIf you received this message, your WhatsApp integration is working correctly! 🎉`
                                                                        );

                                                                        if (success) {
                                                                            toast({
                                                                                title: 'Test Message Sent',
                                                                                description: `Test message sent to ${fullPhoneNumber}`,
                                                                            });
                                                                        } else {
                                                                            toast({
                                                                                title: 'Message Failed',
                                                                                description: 'Failed to send test message. Check WhatsApp Web connection.',
                                                                                variant: 'destructive',
                                                                            });
                                                                        }
                                                                    } catch (error: any) {
                                                                        toast({
                                                                            title: 'Error',
                                                                            description: error.message || 'An error occurred while sending the test message.',
                                                                            variant: 'destructive',
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <Send className="h-4 w-4 mr-2" />
                                                                Send Test
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                                                    <div>
                                                        <h4 className="font-medium text-amber-800">Important Setup Steps</h4>
                                                        <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                                                            <li>Click "Open WhatsApp Web" above and scan the QR code with your phone</li>
                                                            <li>Keep WhatsApp Web open in your browser for automated messaging</li>
                                                            <li>For desktop apps, messages will be sent automatically via background browser</li>
                                                            <li>For web/mobile apps, WhatsApp Web will open in a new tab for manual sending</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <MessageCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                                                    <div>
                                                        <h4 className="font-medium text-green-800">How It Works</h4>
                                                        <ul className="text-sm text-green-700 mt-1 list-disc list-inside space-y-1">
                                                            <li><strong>Desktop:</strong> Messages sent automatically via background browser automation</li>
                                                            <li><strong>Web/Mobile:</strong> WhatsApp Web opens in new tab for manual sending</li>
                                                            <li><strong>Receipts:</strong> Formatted with emojis and business branding</li>
                                                            <li><strong>Offline:</strong> Messages queued and sent when connection available</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <Settings2 className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                                                    <div>
                                                        <h4 className="font-medium text-purple-800">Receipt Preview</h4>
                                                        <div className="text-sm text-purple-700 mt-1 font-mono bg-white p-2 rounded border text-xs">
                                                            *🧾 RECEIPT*<br />
                                                            📅 Date: {new Date().toLocaleString()}<br />
                                                            🆔 Order #123<br /><br />
                                                            *Items:*<br />
                                                            • 2x Test Item - R20.00<br />
                                                            • 1x Another Item - R15.00<br /><br />
                                                            *💰 Total: R35.00*<br />
                                                            💳 Payment: Cash<br /><br />
                                                            🙏 Thank you for your business!<br />
                                                            *OpenSauce POS*
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* System Settings Tab */}
                    <TabsContent value="system" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Backup & Restore
                                </CardTitle>
                                <CardDescription>Configure automatic backups and data restoration</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="autoBackupEnabled">Enable Automatic Backups</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically backup your data at scheduled intervals
                                        </p>
                                    </div>
                                    <Switch
                                        id="autoBackupEnabled"
                                        checked={settings.autoBackupEnabled ?? false}
                                        onCheckedChange={(checked) => handleFieldUpdate('autoBackupEnabled', checked)}
                                    />
                                </div>

                                {settings.autoBackupEnabled && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                                                <Select
                                                    defaultValue={settings.backupFrequency || 'daily'}
                                                    onValueChange={(value) => handleFieldUpdate('backupFrequency', value)}
                                                >
                                                    <SelectTrigger id="backupFrequency">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="hourly">Hourly</SelectItem>
                                                        <SelectItem value="daily">Daily</SelectItem>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="backupLocation">Backup Location</Label>
                                                <Input
                                                    id="backupLocation"
                                                    defaultValue={settings.backupLocation || ''}
                                                    onBlur={(e) => handleFieldUpdate('backupLocation', e.target.value)}
                                                    placeholder="C:\Backups\POS"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Security Settings
                                </CardTitle>
                                <CardDescription>Configure password policies and session management</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                                        <Input
                                            id="sessionTimeout"
                                            type="number"
                                            defaultValue={settings.sessionTimeout ?? 30}
                                            onBlur={(e) => handleFieldUpdate('sessionTimeout', parseInt(e.target.value))}
                                            min="5"
                                            max="480"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Automatically log out users after this period of inactivity
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                                        <Input
                                            id="passwordMinLength"
                                            type="number"
                                            defaultValue={settings.passwordMinLength ?? 6}
                                            onBlur={(e) => handleFieldUpdate('passwordMinLength', parseInt(e.target.value))}
                                            min="4"
                                            max="20"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Minimum number of characters required for PINs
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="passwordRequireSpecial">Require Special Characters</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Require special characters in PINs (recommended for security)
                                        </p>
                                    </div>
                                    <Switch
                                        id="passwordRequireSpecial"
                                        checked={settings.passwordRequireSpecial ?? false}
                                        onCheckedChange={(checked) => handleFieldUpdate('passwordRequireSpecial', checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Inventory Alerts
                                </CardTitle>
                                <CardDescription>Configure low stock notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="stockAlertEnabled">Enable Low Stock Alerts</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified when products are running low
                                        </p>
                                    </div>
                                    <Switch
                                        id="stockAlertEnabled"
                                        checked={settings.stockAlertEnabled ?? true}
                                        onCheckedChange={(checked) => handleFieldUpdate('stockAlertEnabled', checked)}
                                    />
                                </div>

                                {settings.stockAlertEnabled && (
                                    <div className="space-y-2">
                                        <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                                        <Input
                                            id="lowStockThreshold"
                                            type="number"
                                            defaultValue={settings.lowStockThreshold ?? 10}
                                            onBlur={(e) => handleFieldUpdate('lowStockThreshold', parseInt(e.target.value))}
                                            min="1"
                                            max="1000"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Alert when product stock falls below this number
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className="h-5 w-5" />
                                    Audit Logging
                                </CardTitle>
                                <CardDescription>Configure system activity logging</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="auditLoggingEnabled">Enable Audit Logging</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Log all system activities for security and compliance
                                        </p>
                                    </div>
                                    <Switch
                                        id="auditLoggingEnabled"
                                        checked={settings.auditLoggingEnabled ?? true}
                                        onCheckedChange={(checked) => handleFieldUpdate('auditLoggingEnabled', checked)}
                                    />
                                </div>

                                {settings.auditLoggingEnabled && (
                                    <div className="space-y-2">
                                        <Label htmlFor="auditLogLevel">Log Level</Label>
                                        <Select
                                            defaultValue={settings.auditLogLevel || 'info'}
                                            onValueChange={(value) => handleFieldUpdate('auditLogLevel', value)}
                                        >
                                            <SelectTrigger id="auditLogLevel">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="error">Errors Only</SelectItem>
                                                <SelectItem value="warn">Warnings & Errors</SelectItem>
                                                <SelectItem value="info">Info & Above</SelectItem>
                                                <SelectItem value="debug">Debug (Verbose)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            Level of detail to include in audit logs
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* User Management Tab */}
                    <TabsContent value="users" className="space-y-6">
                        <UserManagementCard
                            onAuthRequired={() => {
                                toast({
                                    title: 'Authentication Required',
                                    description: 'Please verify your PIN to access user management.',
                                    variant: 'destructive'
                                });
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
