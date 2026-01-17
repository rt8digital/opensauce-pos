import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import type { Settings } from '../../../shared/types';
import { UserManagementCard } from '@/components/settings/user-management-card';
import { socketClient, type LinkedDevice } from '@/lib/socket';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useNavigation } from '@/contexts/navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';

// Import new components
import { GeneralSettings } from '@/components/settings/general-settings';
import { StoreSettings } from '@/components/settings/store-settings';
import { ReceiptSettings } from '@/components/settings/receipt-settings';
import { PeripheralsSettings } from '@/components/settings/peripherals-settings';
import { MobileSettings } from '@/components/settings/mobile-settings';
import { KeyboardShortcuts } from '@/components/settings/keyboard-shortcuts';
import { InventorySettings } from '@/components/settings/inventory-settings';
import { FactoryResetOverlay } from '@/components/settings/factory-reset-overlay';
import { AdvancedFunctions } from '@/components/settings/advanced-functions';
import { AdviceSettings } from '@/components/settings/advice-settings';


export default function SettingsPage() {
    const { toast } = useToast();
    const { isAdmin, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    // Protect settings page
    React.useEffect(() => {
        if (!isLoading && !isAdmin) {
            toast({
                title: "Access Denied",
                description: "You do not have permission to access settings.",
                variant: "destructive"
            });
            setLocation('/');
        }
    }, [isAdmin, isLoading, setLocation, toast]);



    // const { t } = useTranslation();
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const [qrPreview, setQrPreview] = React.useState<string | null>(null);
    const [showFactoryResetOverlay, setShowFactoryResetOverlay] = React.useState(false);

    // Local state for settings with initial values
    const [storeName, setStoreName] = React.useState('');
    const [storeAddress, setStoreAddress] = React.useState('');
    const [storePhone, setStorePhone] = React.useState('');
    const [storeEmail, setStoreEmail] = React.useState('');
    const [taxRate, setTaxRate] = React.useState<number>(0);
    const [currency, setCurrency] = React.useState('R');
    const [enableCustomerDisplay, setEnableCustomerDisplay] = React.useState(false);
    const [enableBluetoothPeripherals, setEnableBluetoothPeripherals] = React.useState(false);
    const [theme, setTheme] = React.useState('light');
    const [language, setLanguage] = React.useState('en');
    const [receiptWidth, setReceiptWidth] = React.useState('80mm');
    const [receiptCustomWidth, setReceiptCustomWidth] = React.useState<number>(80);
    const [receiptFontSize, setReceiptFontSize] = React.useState('medium');
    const [receiptHeaderText, setReceiptHeaderText] = React.useState('');
    const [receiptFooterText, setReceiptFooterText] = React.useState('');
    const [receiptShowLogo, setReceiptShowLogo] = React.useState(true);
    const [receiptShowOrderNumber, setReceiptShowOrderNumber] = React.useState(true);
    const [receiptShowDate, setReceiptShowDate] = React.useState(true);
    const [receiptShowCustomer, setReceiptShowCustomer] = React.useState(true);
    const [receiptShowPaymentMethod, setReceiptShowPaymentMethod] = React.useState(true);
    const [receiptShowBarcode, setReceiptShowBarcode] = React.useState(false);
    const [printerType, setPrinterType] = React.useState('usb');
    const [printerIp, setPrinterIp] = React.useState('');
    const [printerDeviceId, setPrinterDeviceId] = React.useState('');
    const [printerCodepage, setPrinterCodepage] = React.useState('cp437');
    const [printerModel, setPrinterModel] = React.useState('');
    const [printerManufacturer, setPrinterManufacturer] = React.useState('');
    const [scannerType, setScannerType] = React.useState('usb');
    const [cashDrawerPort, setCashDrawerPort] = React.useState('');
    const [cashDrawerPulse, setCashDrawerPulse] = React.useState<number>(100);
    const [customerDisplayType, setCustomerDisplayType] = React.useState('none');
    const [customerDisplayValue, setCustomerDisplayValue] = React.useState('');
    const [lowStockThreshold, setLowStockThreshold] = React.useState<number>(10);
    const [stockAlertEnabled, setStockAlertEnabled] = React.useState(true);
    const [receiptShowQrCode, setReceiptShowQrCode] = React.useState(false);
    const [receiptQrCodeScale, setReceiptQrCodeScale] = React.useState<number>(100);
    const [vatPercentage, setVatPercentage] = React.useState<number>(0);
    const [vatNumber, setVatNumber] = React.useState('');
    const [adviceList, setAdviceList] = React.useState('[]');
    const [autoLaunchEnabled, setAutoLaunchEnabled] = React.useState(false);

    // Robust Receipt Customization State
    const [receiptHeaderFont, setReceiptHeaderFont] = React.useState('standard');
    const [receiptHeaderScale, setReceiptHeaderScale] = React.useState(100);
    const [receiptItemsFont, setReceiptItemsFont] = React.useState('standard');
    const [receiptItemsScale, setReceiptItemsScale] = React.useState(100);
    const [receiptNumbersFont, setReceiptNumbersFont] = React.useState('mono');
    const [receiptNumbersScale, setReceiptNumbersScale] = React.useState(100);
    const [receiptDetailsFont, setReceiptDetailsFont] = React.useState('mono');
    const [receiptDetailsScale, setReceiptDetailsScale] = React.useState(90);
    const [receiptMetadataFont, setReceiptMetadataFont] = React.useState('standard');
    const [receiptMetadataScale, setReceiptMetadataScale] = React.useState(80);
    const [receiptLogoScale, setReceiptLogoScale] = React.useState(100);
    const [receiptDividerOpacity, setReceiptDividerOpacity] = React.useState(20);
    const [receiptShowItemDivider, setReceiptShowItemDivider] = React.useState(true);
    const [receiptItemDividerStyle, setReceiptItemDividerStyle] = React.useState<'solid' | 'dashed' | 'dotted'>('dashed');
    const [receiptShowTotalDivider, setReceiptShowTotalDivider] = React.useState(true);
    const [receiptCompactMode, setReceiptCompactMode] = React.useState(false);



    // Use navigation context for unsaved changes
    const { setHasUnsavedChanges, registerSaveHandler } = useNavigation();
    const [localHasUnsavedChanges, setLocalHasUnsavedChanges] = React.useState(false);
    const hasInitialized = React.useRef(false);

    // Removed useDebouncedUpdates hook

    const { data: settings, isLoading: isSettingsLoading, isError, refetch } = useQuery<Settings>({
        queryKey: ['/api/settings'],
        refetchOnWindowFocus: false, // Don't refetch when window regains focus to prevent flash
        refetchOnMount: true,        // Refetch when component mounts to ensure fresh data
        retry: 2,                    // Retry on failure
        staleTime: 0,                // Always fetch fresh data
        gcTime: 0,                // Don't cache in background
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (updates: Partial<Settings>) => {
            const response = await apiRequest('PATCH', '/api/settings', updates);
            return response.json();
        },
        onMutate: async (updates) => {
            // Cancel outgoing refetches to prevent overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['/api/settings'] });

            // Get previous settings value
            const previousSettings = queryClient.getQueryData<Settings>(['/api/settings']);

            // Optimistically update the cache
            queryClient.setQueryData(['/api/settings'], (old: Settings | undefined) => {
                if (!old) return old;
                return { ...old, ...updates };
            });

            // Return context object with the previous settings
            return { previousSettings };
        },
        onError: (_err, _updates, context) => {
            // Rollback the cache update if mutation fails
            if (context?.previousSettings) {
                queryClient.setQueryData(['/api/settings'], context.previousSettings);
            }
            toast({
                title: 'Error',
                description: 'Failed to save settings.',
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
            toast({
                title: 'Settings Saved',
                description: 'Your settings have been updated successfully.',
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
            setLocalHasUnsavedChanges(false);
            setHasUnsavedChanges(false);
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

    const factoryResetMutation = useMutation({
        mutationFn: async () => {
            // Check if we're in Electron environment
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                // Use Electron API directly
                return await (window as any).electronAPI.factoryReset();
            } else {
                // Fallback to web API request
                const response = await apiRequest('POST', '/api/database/factory-reset');
                return response.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            setLocalHasUnsavedChanges(false);
            setHasUnsavedChanges(false);
            toast({
                title: 'Factory Reset Complete',
                description: 'Database has been reset to its original state. All data has been removed.',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to factory reset database.',
                variant: 'destructive',
            });
        },
    });

    React.useEffect(() => {
        if (settings) {
            // Only update local state if we haven't initialized yet OR if there are no unsaved changes
            // This prevents background refreshes from overwriting what the user is currently typing
            if (hasInitialized.current && localHasUnsavedChanges) {
                return;
            }

            if (settings?.storeLogo) {
                setLogoPreview(settings.storeLogo);
            }
            if (settings?.paymentQrCode) {
                setQrPreview(settings.paymentQrCode);
            }

            setStoreName(settings.storeName || '');
            setStoreAddress(settings.storeAddress || '');
            setStorePhone(settings.storePhone || '');
            setStoreEmail(settings.storeEmail || '');
            setTaxRate(settings.taxRate || 0);
            setCurrency(settings.currency || 'R');
            setEnableCustomerDisplay(settings.enableCustomerDisplay || false);
            setEnableBluetoothPeripherals(settings.enableBluetoothPeripherals || false);
            setTheme(settings.theme || 'light');
            setLanguage(settings.language || 'en');
            setReceiptWidth(settings.receiptWidth || '80mm');
            setReceiptCustomWidth(settings.receiptCustomWidth || 80);
            setReceiptFontSize(settings.receiptFontSize || 'medium');
            setReceiptHeaderText(settings.receiptHeaderText || '');
            setReceiptFooterText(settings.receiptFooterText || '');
            setReceiptShowLogo(settings.receiptShowLogo ?? true);
            setReceiptShowOrderNumber(settings.receiptShowOrderNumber ?? true);
            setReceiptShowDate(settings.receiptShowDate ?? true);
            setReceiptShowCustomer(settings.receiptShowCustomer ?? true);
            setReceiptShowPaymentMethod(settings.receiptShowPaymentMethod ?? true);
            setReceiptShowBarcode(settings.receiptShowBarcode ?? false);
            setPrinterType(settings.printerType || 'usb');
            setPrinterIp(settings.printerIp || '');
            setPrinterDeviceId(settings.printerDeviceId || '');
            setPrinterCodepage(settings.printerCodepage || 'cp437');
            setPrinterModel(settings.printerModel || '');
            setPrinterManufacturer(settings.printerManufacturer || '');
            setScannerType(settings.scannerType || 'usb');
            setCashDrawerPort(settings.cashDrawerPort || '');
            setCashDrawerPulse(settings.cashDrawerPulse || 100);
            setCustomerDisplayType(settings.customerDisplayType || 'none');
            setCustomerDisplayValue(settings.customerDisplayValue || '');
            setLowStockThreshold(settings.lowStockThreshold || 10);
            setStockAlertEnabled(settings.stockAlertEnabled ?? true);
            setReceiptShowQrCode(settings.receiptShowQrCode ?? false);
            setReceiptQrCodeScale(settings.qrCodeScale ?? 100);
            setVatPercentage(settings.vatPercentage || 0);
            setVatNumber(settings.vatNumber || '');
            setAdviceList(settings.adviceList || '[]');
            setAutoLaunchEnabled(settings.autoLaunchEnabled ?? false);

            // Initialize Robust Receipt Customization
            setReceiptHeaderFont(settings.receiptHeaderFont || 'standard');
            setReceiptHeaderScale(settings.receiptHeaderScale ?? 100);
            setReceiptItemsFont(settings.receiptItemsFont || 'standard');
            setReceiptItemsScale(settings.receiptItemsScale ?? 100);
            setReceiptNumbersFont(settings.receiptNumbersFont || 'mono');
            setReceiptNumbersScale(settings.receiptNumbersScale ?? 100);
            setReceiptDetailsFont(settings.receiptDetailsFont || 'mono');
            setReceiptDetailsScale(settings.receiptDetailsScale ?? 90);
            setReceiptMetadataFont(settings.receiptMetadataFont || 'standard');
            setReceiptMetadataScale(settings.receiptMetadataScale ?? 80);
            setReceiptLogoScale(settings.receiptLogoScale ?? 100);
            setReceiptDividerOpacity(settings.receiptDividerOpacity ?? 20);
            setReceiptShowItemDivider(settings.receiptShowItemDivider ?? true);
            setReceiptItemDividerStyle(settings.receiptItemDividerStyle as any || 'dashed');
            setReceiptShowTotalDivider(settings.receiptShowTotalDivider ?? true);
            setReceiptCompactMode(settings.receiptCompactMode ?? false);

            hasInitialized.current = true;
        }

        // Cleanup function to reset initialization flag when component unmounts
        return () => {
            hasInitialized.current = false;
        };
    }, [settings]);



    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => {
        const file = event.target.files?.[0];
        if (file) {
            // Electron Optimization: Use main process to handle image reading and resizing
            // to avoid freezing the renderer thread with large Data URLs
            if (typeof window !== 'undefined' && (window as any).electronAPI && (file as any).path) {
                const filePath = (file as any).path;
                console.log('Using optimized Electron image upload for:', filePath);

                (window as any).electronAPI.processImageUpload(filePath)
                    .then((result: any) => {
                        if (result.success && result.dataUrl) {
                            if (type === 'logo') {
                                setLogoPreview(result.dataUrl);
                                updateSettingsMutation.mutate({ storeLogo: result.dataUrl }, {
                                    onSuccess: () => {
                                        setLocalHasUnsavedChanges(true);
                                        setHasUnsavedChanges(true);
                                    }
                                });
                            } else {
                                setQrPreview(result.dataUrl);
                                updateSettingsMutation.mutate({ paymentQrCode: result.dataUrl }, {
                                    onSuccess: () => {
                                        setLocalHasUnsavedChanges(true);
                                        setHasUnsavedChanges(true);
                                    }
                                });
                            }
                        } else {
                            console.error('Electron image processing failed:', result.error);
                            // Fallback to FileReader if Electron processing fails
                            readFileWithReader(file, type);
                        }
                    })
                    .catch((err: any) => {
                        console.error('Electron image processing error:', err);
                        readFileWithReader(file, type);
                    });
                return;
            }

            // Web Fallback (or if Electron API fails)
            readFileWithReader(file, type);
        }
    };

    const readFileWithReader = (file: File, type: 'logo' | 'qr') => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (type === 'logo') {
                setLogoPreview(result);
                updateSettingsMutation.mutate({ storeLogo: result }, {
                    onSuccess: () => {
                        setLocalHasUnsavedChanges(true);
                        setHasUnsavedChanges(true);
                    }
                });
            } else {
                setQrPreview(result);
                updateSettingsMutation.mutate({ paymentQrCode: result }, {
                    onSuccess: () => {
                        setLocalHasUnsavedChanges(true);
                        setHasUnsavedChanges(true);
                    }
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveAll = async () => {
        const updates: Partial<Settings> = {
            storeName,
            storeAddress,
            storePhone,
            storeEmail,
            taxRate,
            currency,
            enableCustomerDisplay,
            enableBluetoothPeripherals,
            theme,
            language,
            receiptWidth,
            receiptCustomWidth,
            receiptFontSize,
            receiptHeaderText,
            receiptFooterText,
            receiptShowLogo,
            receiptShowOrderNumber,
            receiptShowDate,
            receiptShowCustomer,
            receiptShowPaymentMethod,
            receiptShowBarcode,
            printerType,
            printerIp,
            printerDeviceId,
            printerCodepage,
            printerModel,
            printerManufacturer,
            scannerType,
            cashDrawerPort,
            cashDrawerPulse,
            customerDisplayType,
            customerDisplayValue,
            lowStockThreshold,
            stockAlertEnabled,
            receiptShowQrCode,
            qrCodeScale: receiptQrCodeScale,
            vatPercentage,
            vatNumber,
            adviceList,
            autoLaunchEnabled,
            receiptHeaderFont,
            receiptHeaderScale,
            receiptItemsFont,
            receiptItemsScale,
            receiptNumbersFont,
            receiptNumbersScale,
            receiptDetailsFont,
            receiptDetailsScale,
            receiptMetadataFont,
            receiptMetadataScale,
            receiptLogoScale,
            receiptDividerOpacity,
            receiptShowItemDivider,
            receiptItemDividerStyle,
            receiptShowTotalDivider,
            receiptCompactMode,
        };
        try {
            await updateSettingsMutation.mutateAsync(updates);
            setLocalHasUnsavedChanges(false);
            setHasUnsavedChanges(false);
            toast({
                title: 'Settings Saved',
                description: 'Your settings have been saved successfully.',
            });
        } catch (error) {
            // Error handled by mutation onError
            throw error; // Re-throw to ensure await fails if caller is waiting
        }
    };

    // Register save handler with ref to avoid dependency cycles and ensure fresh state
    const handleSaveAllRef = React.useRef(handleSaveAll);
    handleSaveAllRef.current = handleSaveAll;

    React.useEffect(() => {
        registerSaveHandler(async () => {
            await handleSaveAllRef.current();
        });
        // Cleanup on unmount
        return () => registerSaveHandler(() => { });
    }, [registerSaveHandler]);

    // Individual update functions for debounced saving
    const updateSetting = (field: keyof Settings, value: any) => {
        // Update local state
        switch (field) {
            case 'storeName': setStoreName(value); break;
            case 'storeAddress': setStoreAddress(value); break;
            case 'storePhone': setStorePhone(value); break;
            case 'storeEmail': setStoreEmail(value); break;
            case 'taxRate': setTaxRate(value); break;
            case 'currency': setCurrency(value); break;
            case 'enableCustomerDisplay': setEnableCustomerDisplay(value); break;
            case 'enableBluetoothPeripherals': setEnableBluetoothPeripherals(value); break;
            case 'theme': setTheme(value); break;
            case 'language': setLanguage(value); break;
            case 'receiptWidth': setReceiptWidth(value); break;
            case 'receiptCustomWidth': setReceiptCustomWidth(value); break;
            case 'receiptFontSize': setReceiptFontSize(value); break;
            case 'receiptHeaderText': setReceiptHeaderText(value); break;
            case 'receiptFooterText': setReceiptFooterText(value); break;
            case 'receiptShowLogo': setReceiptShowLogo(value); break;
            case 'receiptShowOrderNumber': setReceiptShowOrderNumber(value); break;
            case 'receiptShowDate': setReceiptShowDate(value); break;
            case 'printerCodepage': setPrinterCodepage(value); break;
            case 'printerModel': setPrinterModel(value); break;
            case 'printerManufacturer': setPrinterManufacturer(value); break;
            case 'receiptShowCustomer': setReceiptShowCustomer(value); break;
            case 'receiptShowPaymentMethod': setReceiptShowPaymentMethod(value); break;
            case 'receiptShowBarcode': setReceiptShowBarcode(value); break;
            case 'printerType': setPrinterType(value); break;
            case 'printerIp': setPrinterIp(value); break;
            case 'printerDeviceId': setPrinterDeviceId(value); break;
            case 'scannerType': setScannerType(value); break;
            case 'cashDrawerPort': setCashDrawerPort(value); break;
            case 'cashDrawerPulse': setCashDrawerPulse(value); break;
            case 'customerDisplayType': setCustomerDisplayType(value); break;
            case 'customerDisplayValue': setCustomerDisplayValue(value); break;
            case 'lowStockThreshold': setLowStockThreshold(value); break;
            case 'stockAlertEnabled': setStockAlertEnabled(value); break;
            case 'receiptShowQrCode': setReceiptShowQrCode(value); break;
            case 'qrCodeScale': setReceiptQrCodeScale(value); break;
            case 'vatPercentage': setVatPercentage(value); break;
            case 'vatNumber': setVatNumber(value); break;
            case 'adviceList': setAdviceList(value); break;
            case 'autoLaunchEnabled': setAutoLaunchEnabled(value); break;
            case 'receiptHeaderFont': setReceiptHeaderFont(value); break;
            case 'receiptHeaderScale': setReceiptHeaderScale(value); break;
            case 'receiptItemsFont': setReceiptItemsFont(value); break;
            case 'receiptItemsScale': setReceiptItemsScale(value); break;
            case 'receiptNumbersFont': setReceiptNumbersFont(value); break;
            case 'receiptNumbersScale': setReceiptNumbersScale(value); break;
            case 'receiptDetailsFont': setReceiptDetailsFont(value); break;
            case 'receiptDetailsScale': setReceiptDetailsScale(value); break;
            case 'receiptMetadataFont': setReceiptMetadataFont(value); break;
            case 'receiptMetadataScale': setReceiptMetadataScale(value); break;
            case 'receiptLogoScale': setReceiptLogoScale(value); break;
            case 'receiptDividerOpacity': setReceiptDividerOpacity(value); break;
            case 'receiptShowItemDivider': setReceiptShowItemDivider(value); break;
            case 'receiptItemDividerStyle': setReceiptItemDividerStyle(value); break;
            case 'receiptShowTotalDivider': setReceiptShowTotalDivider(value); break;
            case 'receiptCompactMode': setReceiptCompactMode(value); break;
        }

        // Add to debounced updates
        // addUpdate(field, value); // REMOVED
        setLocalHasUnsavedChanges(true);
        setHasUnsavedChanges(true);
    };


    // Warn user about unsaved changes when leaving the page
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (localHasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [localHasUnsavedChanges]);

    // Use the unsaved changes hook
    useUnsavedChanges(localHasUnsavedChanges);

    const handleResetSettings = () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            resetSettingsMutation.mutate();
        }
    };

    const handleFactoryReset = () => {
        if (confirm('⚠️ WARNING: This will permanently delete ALL data including products, sales, customers, settings. User accounts will be preserved. Are you absolutely sure you want to factory reset the database? This action cannot be undone.')) {
            setShowFactoryResetOverlay(true);
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

            // Use the updated ReceiptPrinter service that uses server API
            const { ReceiptPrinter } = await import('@/lib/printer');
            const printer = ReceiptPrinter.getInstance();

            const success = await printer.testPrinter(
                settings?.printerType as 'usb' | 'network' || 'usb',
                settings?.printerIp
            );

            if (success) {
                toast({
                    title: 'Printer Test',
                    description: 'Printer connection successful!',
                });
            } else {
                toast({
                    title: 'Printer Test Failed',
                    description: 'Failed to connect to printer',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Printer test error:', error);
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

            // Try printing with configured settings using server API
            const success = await printer.printEscPos(
                testOrder as any,
                settings?.printerType as any || 'usb',
                settings?.printerType === 'bluetooth' ? settings?.printerDeviceId : settings?.printerIp ?? undefined
            );

            if (success) {
                toast({
                    title: 'Test Receipt',
                    description: 'Test receipt printed successfully!',
                });
            } else {
                // Fallback to PDF printing if server API fails
                ReceiptPrinter.print(testOrder as any);
                toast({
                    title: 'Test Receipt',
                    description: 'Test receipt opened in print dialog (PDF fallback)',
                });
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
                        description: 'Customer display updated successfully!',
                    });
                } else {
                    toast({
                        title: 'Customer Display Failed',
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

    // Mobile linking functions
    const refreshLinkedDevices = () => {
        // Listen for device updates
        const removeListener = socketClient.onDevicesUpdated((devices: LinkedDevice[]) => {
            console.log('Linked devices:', devices);
            removeListener(); // Clean up after getting devices
        });
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Verifying permissions...</div>
                </div>
            </MainLayout>
        );
    }

    if (!isAdmin) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg font-bold text-red-500 uppercase tracking-widest">Access Denied</div>
                    <p className="text-muted-foreground ml-4">You do not have permission to view this page.</p>
                </div>
            </MainLayout>
        );
    }

    if (isSettingsLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading settings...</div>
                </div>
            </MainLayout>
        );
    }

    if (isError) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64 space-x-4">
                    <div className="text-lg text-red-600">Error loading settings</div>
                    <Button onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </MainLayout>
        );
    }

    if (!settings) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64 space-x-4">
                    <div className="text-lg text-red-600">No settings found</div>
                    <Button onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="relative min-h-screen">
                {/* Subtle Background Glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
                    <div className="flex flex-col space-y-6 lg:flex-row lg:justify-between lg:items-end mb-10">
                        <div className="flex flex-col space-y-2">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2 w-fit">
                                <SettingsIcon className="h-3 w-3" />
                                <span>Configuration</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter sm:text-4xl lg:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                System <span className="text-primary">Settings</span>
                            </h1>
                            <p className="text-base text-muted-foreground max-w-md">
                                Customize your store's behavior, manage peripherals, and configure receipt details.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-10 rounded-xl px-4">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                            <Button onClick={handleSaveAll} size="sm" className="h-10 rounded-xl px-6 bg-primary font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="general" className="space-y-8">
                        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 py-2 border-b border-border/50 transition-all duration-300">
                            <div className="container mx-auto max-w-7xl overflow-x-auto scrollbar-hide">
                                <TabsList className="h-12 w-fit items-center justify-start bg-muted/50 p-1 rounded-xl border border-border/50">
                                    <TabsTrigger value="general" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">General</TabsTrigger>
                                    <TabsTrigger value="store" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Store</TabsTrigger>
                                    <TabsTrigger value="receipt" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Receipt</TabsTrigger>
                                    <TabsTrigger value="peripherals" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Peripherals</TabsTrigger>
                                    <TabsTrigger value="mobile" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Mobile</TabsTrigger>
                                    <TabsTrigger value="shortcuts" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Shortcuts</TabsTrigger>
                                    <TabsTrigger value="inventory" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Inventory</TabsTrigger>
                                    <TabsTrigger value="advice" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Advice</TabsTrigger>
                                    <TabsTrigger value="users" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Users</TabsTrigger>
                                    <TabsTrigger value="advanced" className="relative h-10 rounded-lg px-4 font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-rose-500">Advanced</TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        <TabsContent value="general" className="space-y-4">
                            <GeneralSettings
                                settings={settings!}
                                localStoreName={storeName}
                                localStoreAddress={storeAddress}
                                localStorePhone={storePhone}
                                localTaxRate={taxRate}
                                localCurrency={currency}
                                localEnableCustomerDisplay={enableCustomerDisplay}
                                localEnableBluetoothPeripherals={enableBluetoothPeripherals}
                                localTheme={theme}
                                localLanguage={language}
                                localVatPercentage={vatPercentage}
                                localVatNumber={vatNumber}
                                updateSetting={updateSetting}
                            />
                        </TabsContent>

                        <TabsContent value="store" className="space-y-4">
                            <StoreSettings
                                settings={settings!}
                                localStoreName={storeName}
                                localStoreAddress={storeAddress}
                                localStorePhone={storePhone}
                                localStoreEmail={storeEmail}
                                logoPreview={logoPreview}
                                qrPreview={qrPreview}
                                handleImageUpload={handleImageUpload}
                                updateSetting={updateSetting}
                            />
                        </TabsContent>

                        <TabsContent value="receipt" className="space-y-4">
                            <ReceiptSettings
                                settings={settings!}
                                localReceiptWidth={receiptWidth}
                                localReceiptHeaderText={receiptHeaderText}
                                localReceiptFooterText={receiptFooterText}
                                localReceiptShowLogo={receiptShowLogo}
                                localReceiptShowOrderNumber={receiptShowOrderNumber}
                                localReceiptShowDate={receiptShowDate}
                                localReceiptShowCustomer={receiptShowCustomer}
                                localReceiptShowPaymentMethod={receiptShowPaymentMethod}
                                localReceiptShowBarcode={receiptShowBarcode}
                                localReceiptShowQrCode={receiptShowQrCode}
                                localReceiptQrCodeScale={receiptQrCodeScale}
                                localReceiptHeaderFont={receiptHeaderFont}
                                localReceiptHeaderScale={receiptHeaderScale}
                                localReceiptItemsFont={receiptItemsFont}
                                localReceiptItemsScale={receiptItemsScale}
                                localReceiptNumbersFont={receiptNumbersFont}
                                localReceiptNumbersScale={receiptNumbersScale}
                                localReceiptDetailsFont={receiptDetailsFont}
                                localReceiptDetailsScale={receiptDetailsScale}
                                localReceiptMetadataFont={receiptMetadataFont}
                                localReceiptMetadataScale={receiptMetadataScale}
                                localReceiptLogoScale={receiptLogoScale}
                                localReceiptDividerOpacity={receiptDividerOpacity}
                                localReceiptShowItemDivider={receiptShowItemDivider}
                                localReceiptItemDividerStyle={receiptItemDividerStyle}
                                localReceiptShowTotalDivider={receiptShowTotalDivider}
                                localReceiptCompactMode={receiptCompactMode}
                                qrPreview={qrPreview}
                                logoPreview={logoPreview}
                                updateSetting={updateSetting}
                                printTestReceipt={printTestReceipt}
                            />
                        </TabsContent>

                        <TabsContent value="peripherals" className="space-y-4">
                            <PeripheralsSettings
                                settings={settings!}
                                updateSetting={updateSetting}
                                testPrinterConnection={testPrinterConnection}
                                printTestReceipt={printTestReceipt}
                                testScannerConnection={testScannerConnection}
                                testCashDrawerConnection={testCashDrawerConnection}
                                openCashDrawer={openCashDrawer}
                                testCustomerDisplayConnection={testCustomerDisplayConnection}
                                updateCustomerDisplay={updateCustomerDisplay}
                                onDeviceConnected={(deviceId) => {
                                    console.log('Bluetooth device connected:', deviceId);
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="mobile" className="space-y-4">
                            <MobileSettings
                                refreshLinkedDevices={refreshLinkedDevices}
                            />
                        </TabsContent>

                        <TabsContent value="shortcuts" className="space-y-4">
                            <KeyboardShortcuts />
                        </TabsContent>

                        <TabsContent value="inventory" className="space-y-4">
                            <InventorySettings
                                settings={settings!}
                                updateSetting={updateSetting}
                            />
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4">
                            <AdvancedFunctions
                                onFactoryReset={handleFactoryReset}
                                onResetToDefaults={handleResetSettings}
                                autoLaunchEnabled={autoLaunchEnabled}
                                updateSetting={updateSetting}
                            />
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4">
                            <UserManagementCard onAuthRequired={() => {
                                toast({
                                    title: 'Authentication Required',
                                    description: 'Please log in with admin credentials to manage users.',
                                    variant: 'destructive',
                                });
                            }} />
                        </TabsContent>

                        <TabsContent value="advice" className="space-y-4">
                            <AdviceSettings
                                settings={settings!}
                                updateSetting={updateSetting}
                            />
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
            <FactoryResetOverlay
                isOpen={showFactoryResetOverlay}
                onComplete={() => {
                    setShowFactoryResetOverlay(false);
                    // Force a hard reload to ensure clean state and return to login if needed
                    window.location.href = '/';
                    window.location.reload();
                }}
                onError={(error) => {
                    // Error is handled in the overlay UI, but we can log it here
                    console.error('Factory reset error:', error);
                }}
                performReset={async () => {
                    return await factoryResetMutation.mutateAsync();
                }}
            />
        </MainLayout>
    );
}