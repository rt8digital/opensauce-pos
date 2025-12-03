import { bluetoothService } from './bluetooth-service';
import { isCapacitor } from '@/utils/capacitor';
import { BleClient } from '@capacitor-community/bluetooth-le';

/**
 * Service for managing Bluetooth Barcode Scanners
 */
export class BluetoothScannerService {
    private static instance: BluetoothScannerService;
    private scanListeners: ((barcode: string) => void)[] = [];

    // Common Scanner UUIDs
    // HID scanners usually act as keyboards, but SPP scanners use Bluetooth
    private readonly SCANNER_SERVICE_UUIDS = [
        '00001101-0000-1000-8000-00805f9b34fb', // SPP
        '00001812-0000-1000-8000-00805f9b34fb', // HID (Human Interface Device)
    ];

    private constructor() { }

    static getInstance(): BluetoothScannerService {
        if (!BluetoothScannerService.instance) {
            BluetoothScannerService.instance = new BluetoothScannerService();
        }
        return BluetoothScannerService.instance;
    }

    /**
     * Connect to a Bluetooth scanner and start listening
     * @param deviceId - Device ID to connect to
     */
    async connect(deviceId: string): Promise<boolean> {
        const connected = await bluetoothService.connect(deviceId);
        if (!connected) return false;

        // Start notifications for scanner data
        return await this.startNotifications(deviceId);
    }

    /**
     * Start listening for notifications from the scanner
     */
    private async startNotifications(deviceId: string): Promise<boolean> {
        if (!isCapacitor()) return false;

        try {
            // Find the notification characteristic
            const services = await bluetoothService.discoverServices(deviceId);
            let notifyService = '';
            let notifyChar = '';

            // Look for a characteristic that supports notify
            // This is simplified; real implementation needs specific UUID matching
            for (const service of services) {
                for (const char of service.characteristics) {
                    if (char.properties.notify) {
                        notifyService = service.uuid;
                        notifyChar = char.uuid;
                        break;
                    }
                }
                if (notifyService) break;
            }

            if (!notifyService || !notifyChar) {
                console.error('No notification characteristic found');
                return false;
            }

            await BleClient.startNotifications(
                deviceId,
                notifyService,
                notifyChar,
                (value) => {
                    this.handleNotification(value);
                }
            );

            console.log('Scanner notifications started');
            return true;
        } catch (error) {
            console.error('Failed to start scanner notifications:', error);
            return false;
        }
    }

    /**
     * Handle incoming data from scanner
     */
    private handleNotification(data: DataView) {
        // Convert DataView to string
        const decoder = new TextDecoder('utf-8');
        const barcode = decoder.decode(data);

        // Clean up the barcode (remove newlines, etc.)
        const cleanBarcode = barcode.trim();

        if (cleanBarcode) {
            this.notifyListeners(cleanBarcode);
        }
    }

    /**
     * Add a listener for scanned barcodes
     */
    addListener(callback: (barcode: string) => void) {
        this.scanListeners.push(callback);
    }

    /**
     * Remove a listener
     */
    removeListener(callback: (barcode: string) => void) {
        this.scanListeners = this.scanListeners.filter(l => l !== callback);
    }

    /**
     * Notify all listeners of a new barcode
     */
    private notifyListeners(barcode: string) {
        this.scanListeners.forEach(listener => listener(barcode));
    }
}

export const bluetoothScannerService = BluetoothScannerService.getInstance();
