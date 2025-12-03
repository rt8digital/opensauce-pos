import { ReceiptPrinter as Printer } from './printer';
import { BarcodeScanner } from './scanner';
import { CashDrawer } from './cash-drawer';
import { CustomerDisplay } from './customer-display';
import { Scale } from './scale';
import { capacitorPeripherals } from './capacitor-peripherals';
import { isCapacitor } from '@/utils/capacitor';

export interface PeripheralDevice {
  id: string;
  name: string;
  type: 'printer' | 'scanner' | 'cashDrawer' | 'customerDisplay' | 'scale' | 'unknown';
  status: 'connected' | 'disconnected' | 'error';
  connectionType?: 'usb' | 'bluetooth' | 'network' | 'serial';
  address?: string;
  vendorId?: string;
  productId?: string;
}

export class PeripheralManager {
  private static instance: PeripheralManager;
  private devices: Map<string, PeripheralDevice> = new Map();
  private listeners: Array<(devices: PeripheralDevice[]) => void> = [];

  private constructor() { }

  static getInstance(): PeripheralManager {
    if (!PeripheralManager.instance) {
      PeripheralManager.instance = new PeripheralManager();
    }
    return PeripheralManager.instance;
  }

  /**
   * Discover available peripheral devices
   */
  async discoverDevices(): Promise<PeripheralDevice[]> {
    const devices: PeripheralDevice[] = [];

    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.discoverPeripherals();
        if (result.success && result.devices) {
          devices.push(...result.devices);
        }
      }
      // For Capacitor environment
      else if (isCapacitor()) {
        const bluetoothDevices = await capacitorPeripherals.scanBluetoothDevices();
        bluetoothDevices.forEach((device: any) => {
          devices.push({
            id: device.deviceId,
            name: device.name || 'Unknown Bluetooth Device',
            type: 'unknown', // User will need to map this
            status: 'disconnected',
            connectionType: 'bluetooth',
            address: device.deviceId
          });
        });
      }
      // Fallback for web environment
      else {
        // Check what's available through APIs
        const printerStatus = await Printer.getInstance().getStatus();
        if (printerStatus) {
          devices.push({
            id: 'web-printer',
            name: 'Web Printer',
            type: 'printer',
            status: 'connected'
          });
        }
      }

      // Update internal device list
      this.devices.clear();
      devices.forEach(device => {
        this.devices.set(device.id, device);
      });

      // Notify listeners
      this.notifyListeners();

      return devices;
    } catch (error) {
      console.error('Error discovering devices:', error);
      return devices;
    }
  }

  /**
   * Test connection to a specific device
   * @param deviceId - ID of the device to test
   */
  async testConnection(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        console.error(`Device ${deviceId} not found`);
        return false;
      }

      let result = false;

      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        if (device.type === 'printer') {
          const response = await (window as any).electronAPI.testPrinter(device.connectionType, device.address);
          result = response.success;
        } else {
          // Generic test for other devices
          // In a real app, we'd have specific test methods per device type
          result = true;
        }
      }
      // For Capacitor environment
      else if (isCapacitor() && device.connectionType === 'bluetooth') {
        if (device.type === 'printer') {
          result = await capacitorPeripherals.connectBluetoothPrinter(device.id);
        } else if (device.type === 'scanner') {
          result = await capacitorPeripherals.connectBluetoothScanner(device.id);
        } else {
          // Generic connection test
          result = await capacitorPeripherals.connectBluetoothPrinter(device.id); // Reusing connection logic
        }
      }
      // Fallback
      else {
        result = true;
      }

      // Update device status
      device.status = result ? 'connected' : 'error';
      this.devices.set(deviceId, device);
      this.notifyListeners();

      return result;
    } catch (error) {
      console.error(`Error testing connection to device ${deviceId}:`, error);

      // Update device status
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = 'error';
        this.devices.set(deviceId, device);
        this.notifyListeners();
      }

      return false;
    }
  }

  /**
   * Get all managed devices
   */
  getDevices(): PeripheralDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get devices by type
   * @param type - Type of devices to retrieve
   */
  getDevicesByType(type: PeripheralDevice['type']): PeripheralDevice[] {
    return Array.from(this.devices.values()).filter(device => device.type === type);
  }

  /**
   * Add a listener for device updates
   * @param listener - Function to call when devices are updated
   */
  addListener(listener: (devices: PeripheralDevice[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener for device updates
   * @param listener - Function to remove
   */
  removeListener(listener: (devices: PeripheralDevice[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of device updates
   */
  private notifyListeners(): void {
    const devices = this.getDevices();
    this.listeners.forEach(listener => listener(devices));
  }

  /**
   * Initialize all peripherals
   */
  async initialize(): Promise<void> {
    // Discover devices on initialization
    await this.discoverDevices();
  }
}

export const peripheralManager = PeripheralManager.getInstance();