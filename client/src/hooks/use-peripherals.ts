import { useState, useEffect } from 'react';
import { ReceiptPrinter } from '@/lib/printer';
import { BarcodeScanner } from '@/lib/scanner';
import { CashDrawer } from '@/lib/cash-drawer';
import { CustomerDisplay } from '@/lib/customer-display';
import { Scale } from '@/lib/scale';
import { PeripheralDevice, PeripheralManager } from '@/lib/peripheral-manager';
import { useToast } from '@/hooks/use-toast';

export interface PeripheralState {
  devices: PeripheralDevice[];
  isInitialized: boolean;
  isDiscovering: boolean;
}

export const usePeripherals = () => {
  const [state, setState] = useState<PeripheralState>({
    devices: [],
    isInitialized: false,
    isDiscovering: false,
  });
  
  const { toast } = useToast();
  const [printer, setPrinter] = useState<ReceiptPrinter>(ReceiptPrinter.getInstance());
  const [scanner, setScanner] = useState<BarcodeScanner>(BarcodeScanner.getInstance());
  const [cashDrawer, setCashDrawer] = useState<CashDrawer>(CashDrawer.getInstance());
  const [customerDisplay, setCustomerDisplay] = useState<CustomerDisplay>(CustomerDisplay.getInstance());
  const [scale, setScale] = useState<Scale>(Scale.getInstance());
  const [peripheralManager, setPeripheralManager] = useState<PeripheralManager>(PeripheralManager.getInstance());

  // Initialize peripherals
  useEffect(() => {
    const initPeripherals = async () => {
      try {
        await peripheralManager.initialize();
        setState(prev => ({ ...prev, isInitialized: true }));
      } catch (error) {
        console.error('Error initializing peripherals:', error);
        toast({
          title: 'Peripheral Error',
          description: 'Failed to initialize peripherals',
          variant: 'destructive',
        });
      }
    };

    initPeripherals();
  }, [toast]);

  // Discover devices
  const discoverDevices = async () => {
    try {
      setState(prev => ({ ...prev, isDiscovering: true }));
      const devices = await peripheralManager.discoverDevices();
      setState(prev => ({ ...prev, devices, isDiscovering: false }));
      return devices;
    } catch (error) {
      console.error('Error discovering devices:', error);
      setState(prev => ({ ...prev, isDiscovering: false }));
      toast({
        title: 'Discovery Error',
        description: 'Failed to discover peripheral devices',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Test connection to a device
  const testConnection = async (deviceId: string) => {
    try {
      const success = await peripheralManager.testConnection(deviceId);
      if (success) {
        toast({
          title: 'Connection Success',
          description: 'Device connected successfully',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Failed to connect to device',
          variant: 'destructive',
        });
      }
      return success;
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Connection Error',
        description: 'Error testing device connection',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get devices by type
  const getDevicesByType = (type: PeripheralDevice['type']) => {
    return state.devices.filter(device => device.type === type);
  };

  // Print receipt
  const printReceipt = async (order: any, printerType?: 'usb' | 'network' | 'bluetooth', printerAddress?: string) => {
    try {
      if (printerType && printerAddress) {
        // Use ESC/POS printing
        const success = await printer.printEscPos(order, printerType, printerAddress);
        if (success) {
          toast({
            title: 'Print Success',
            description: 'Receipt printed successfully',
          });
        } else {
          toast({
            title: 'Print Failed',
            description: 'Failed to print receipt',
            variant: 'destructive',
          });
        }
        return success;
      } else {
        // Use PDF printing
        ReceiptPrinter.print(order);
        return true;
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: 'Print Error',
        description: 'Error printing receipt',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Open cash drawer
  const openCashDrawer = async (port?: string, pulseDuration?: number) => {
    try {
      const success = await cashDrawer.open(port, pulseDuration);
      if (success) {
        toast({
          title: 'Cash Drawer',
          description: 'Cash drawer opened successfully',
        });
      } else {
        toast({
          title: 'Cash Drawer Error',
          description: 'Failed to open cash drawer',
          variant: 'destructive',
        });
      }
      return success;
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      toast({
        title: 'Cash Drawer Error',
        description: 'Error opening cash drawer',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Read scale weight
  const readScaleWeight = async () => {
    try {
      const reading = await scale.readWeight();
      if (!reading) {
        toast({
          title: 'Scale Error',
          description: 'Failed to read weight from scale',
          variant: 'destructive',
        });
      }
      return reading;
    } catch (error) {
      console.error('Error reading scale weight:', error);
      toast({
        title: 'Scale Error',
        description: 'Error reading weight from scale',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update customer display
  const updateCustomerDisplay = async (content: any, displayType?: string, displayAddress?: string) => {
    try {
      const success = await customerDisplay.update(content, displayType, displayAddress);
      if (!success) {
        toast({
          title: 'Display Error',
          description: 'Failed to update customer display',
          variant: 'destructive',
        });
      }
      return success;
    } catch (error) {
      console.error('Error updating customer display:', error);
      toast({
        title: 'Display Error',
        description: 'Error updating customer display',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    // State
    ...state,
    
    // Core services
    printer,
    scanner,
    cashDrawer,
    customerDisplay,
    scale,
    peripheralManager,
    
    // Methods
    discoverDevices,
    testConnection,
    getDevicesByType,
    printReceipt,
    openCashDrawer,
    readScaleWeight,
    updateCustomerDisplay,
  };
};