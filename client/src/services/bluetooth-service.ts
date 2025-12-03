import { BleClient, BleDevice, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';
import { isCapacitor } from '@/utils/capacitor';

/**
 * Bluetooth Low Energy Service for managing peripheral connections
 */
export class BluetoothService {
    private static instance: BluetoothService;
    private isInitialized = false;
    private connectedDevices: Map<string, BleDevice> = new Map();

    // Common Bluetooth service UUIDs for POS peripherals
    private readonly PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
    private readonly PRINTER_CHAR_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

    private constructor() { }

    static getInstance(): BluetoothService {
        if (!BluetoothService.instance) {
            BluetoothService.instance = new BluetoothService();
        }
        return BluetoothService.instance;
    }

    /**
     * Initialize Bluetooth
     */
    async initialize(): Promise<boolean> {
        if (!isCapacitor()) {
            console.warn('Bluetooth only available in Capacitor environment');
            return false;
        }

        try {
            await BleClient.initialize();
            this.isInitialized = true;
            console.log('Bluetooth initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Bluetooth:', error);
            return false;
        }
    }

    /**
     * Request Bluetooth permissions
     */
    async requestPermissions(): Promise<boolean> {
        if (!isCapacitor()) return false;

        try {
            await BleClient.initialize();
            return true;
        } catch (error) {
            console.error('Bluetooth permissions denied:', error);
            return false;
        }
    }

    /**
     * Scan for Bluetooth devices
     * @param durationMs - Scan duration in milliseconds
     */
    async scanDevices(durationMs: number = 5000): Promise<BleDevice[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const devices: BleDevice[] = [];

        try {
            await BleClient.requestLEScan(
                {
                    // Filter for common POS peripheral services
                    services: [],
                    allowDuplicates: false,
                },
                (result) => {
                    // Add device if not already in list
                    if (!devices.find(d => d.deviceId === result.device.deviceId)) {
                        devices.push(result.device);
                    }
                }
            );

            // Stop scanning after duration
            await new Promise(resolve => setTimeout(resolve, durationMs));
            await BleClient.stopLEScan();

            return devices;
        } catch (error) {
            console.error('Bluetooth scan failed:', error);
            return [];
        }
    }

    /**
     * Connect to a Bluetooth device
     * @param deviceId - Device ID to connect to
     */
    async connect(deviceId: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await BleClient.connect(deviceId, (deviceId) => {
                console.log(`Device ${deviceId} disconnected`);
                this.connectedDevices.delete(deviceId);
            });

            // Store connected device
            const device = await BleClient.getConnectedDevices([]);
            const connectedDevice = device.find(d => d.deviceId === deviceId);
            if (connectedDevice) {
                this.connectedDevices.set(deviceId, connectedDevice);
            }

            console.log(`Connected to device: ${deviceId}`);
            return true;
        } catch (error) {
            console.error(`Failed to connect to device ${deviceId}:`, error);
            return false;
        }
    }

    /**
     * Disconnect from a Bluetooth device
     * @param deviceId - Device ID to disconnect from
     */
    async disconnect(deviceId: string): Promise<boolean> {
        try {
            await BleClient.disconnect(deviceId);
            this.connectedDevices.delete(deviceId);
            console.log(`Disconnected from device: ${deviceId}`);
            return true;
        } catch (error) {
            console.error(`Failed to disconnect from device ${deviceId}:`, error);
            return false;
        }
    }

    /**
     * Check if a device is connected
     * @param deviceId - Device ID to check
     */
    isConnected(deviceId: string): boolean {
        return this.connectedDevices.has(deviceId);
    }

    /**
     * Get list of connected devices
     */
    getConnectedDevices(): BleDevice[] {
        return Array.from(this.connectedDevices.values());
    }

    /**
     * Write data to a Bluetooth device
     * @param deviceId - Device ID
     * @param serviceUUID - Service UUID
     * @param characteristicUUID - Characteristic UUID
     * @param data - Data to write (as Uint8Array)
     */
    async write(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        data: Uint8Array
    ): Promise<boolean> {
        try {
            const dataView = numbersToDataView(Array.from(data));
            await BleClient.write(deviceId, serviceUUID, characteristicUUID, dataView);
            return true;
        } catch (error) {
            console.error('Bluetooth write failed:', error);
            return false;
        }
    }

    /**
     * Read data from a Bluetooth device
     * @param deviceId - Device ID
     * @param serviceUUID - Service UUID
     * @param characteristicUUID - Characteristic UUID
     */
    async read(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string
    ): Promise<Uint8Array | null> {
        try {
            const dataView = await BleClient.read(deviceId, serviceUUID, characteristicUUID);
            return new Uint8Array(dataView.buffer);
        } catch (error) {
            console.error('Bluetooth read failed:', error);
            return null;
        }
    }

    /**
     * Discover services for a connected device
     * @param deviceId - Device ID
     */
    async discoverServices(deviceId: string): Promise<any[]> {
        try {
            const services = await BleClient.getServices(deviceId);
            return services;
        } catch (error) {
            console.error('Failed to discover services:', error);
            return [];
        }
    }
}

export const bluetoothService = BluetoothService.getInstance();
