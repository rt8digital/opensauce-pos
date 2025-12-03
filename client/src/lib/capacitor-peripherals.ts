import { bluetoothService } from '../services/bluetooth-service';
import { bluetoothPrinterService } from '../services/bluetooth-printer-service';
import { bluetoothScannerService } from '../services/bluetooth-scanner-service';
import { isCapacitor } from '@/utils/capacitor';

export class CapacitorPeripherals {
  private static instance: CapacitorPeripherals;

  private constructor() { }

  static getInstance(): CapacitorPeripherals {
    if (!CapacitorPeripherals.instance) {
      CapacitorPeripherals.instance = new CapacitorPeripherals();
    }
    return CapacitorPeripherals.instance;
  }

  /**
   * Check if we're running in a Capacitor environment
   */
  isCapacitor(): boolean {
    return isCapacitor();
  }

  /**
   * Connect to a Bluetooth printer
   * @param deviceId - The ID of the Bluetooth device
   */
  async connectBluetoothPrinter(deviceId: string): Promise<boolean> {
    if (!this.isCapacitor()) {
      console.warn('Bluetooth printer connection only available in Capacitor environment');
      return false;
    }

    return await bluetoothPrinterService.connect(deviceId);
  }

  /**
   * Connect to a Bluetooth scanner
   * @param deviceId - The ID of the Bluetooth device
   */
  async connectBluetoothScanner(deviceId: string): Promise<boolean> {
    if (!this.isCapacitor()) {
      console.warn('Bluetooth scanner connection only available in Capacitor environment');
      return false;
    }

    return await bluetoothScannerService.connect(deviceId);
  }

  /**
   * Scan for Bluetooth devices
   */
  async scanBluetoothDevices(): Promise<any[]> {
    if (!this.isCapacitor()) {
      console.warn('Bluetooth scanning only available in Capacitor environment');
      return [];
    }

    return await bluetoothService.scanDevices();
  }
}

export const capacitorPeripherals = CapacitorPeripherals.getInstance();