import { bluetoothService } from './bluetooth-service';
import { isCapacitor } from '@/utils/capacitor';

/**
 * Service for managing Bluetooth ESC/POS printers
 */
export class BluetoothPrinterService {
    private static instance: BluetoothPrinterService;

    // Standard ESC/POS UUIDs
    // Many printers use a custom UUID or the standard serial port UUID
    private readonly SERVICE_UUIDS = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Star Micronics
        '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC (common in cheap printers)
    ];

    private readonly CHAR_UUIDS = [
        '00002af1-0000-1000-8000-00805f9b34fb', // Standard Printer Characteristic
        'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Star Micronics
        '49535343-8841-43f4-a8d4-ecbe34729bb3', // ISSC
    ];

    private constructor() { }

    static getInstance(): BluetoothPrinterService {
        if (!BluetoothPrinterService.instance) {
            BluetoothPrinterService.instance = new BluetoothPrinterService();
        }
        return BluetoothPrinterService.instance;
    }

    /**
     * Connect to a Bluetooth printer
     * @param deviceId - Device ID to connect to
     */
    async connect(deviceId: string): Promise<boolean> {
        return await bluetoothService.connect(deviceId);
    }

    /**
     * Print data to the connected printer
     * @param deviceId - Device ID
     * @param data - Raw bytes to print (ESC/POS commands)
     */
    async print(deviceId: string, data: Uint8Array): Promise<boolean> {
        if (!isCapacitor()) {
            console.warn('Bluetooth printing only available in Capacitor environment');
            return false;
        }

        if (!bluetoothService.isConnected(deviceId)) {
            console.error('Printer not connected');
            return false;
        }

        // Try to find the correct service and characteristic
        // This is tricky because different printers use different UUIDs
        // In a real app, we might need to scan services first or let user select

        // For now, we'll try to discover services first to find a match
        const services = await bluetoothService.discoverServices(deviceId);
        console.log('Discovered services:', services);

        let targetService = '';
        let targetChar = '';

        // Simple heuristic to find writable characteristic
        // This would need to be more robust for production
        if (services && services.length > 0) {
            // Use the first service/characteristic for now as a fallback
            // Ideally we match against known printer UUIDs
            targetService = services[0].uuid;
            if (services[0].characteristics && services[0].characteristics.length > 0) {
                targetChar = services[0].characteristics[0].uuid;
            }
        }

        if (!targetService || !targetChar) {
            console.error('Could not find writable service/characteristic');
            return false;
        }

        // Send data in chunks to avoid buffer overflow
        const CHUNK_SIZE = 100; // 100 bytes per chunk
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            const success = await bluetoothService.write(
                deviceId,
                targetService,
                targetChar,
                chunk
            );

            if (!success) {
                console.error('Failed to write print chunk');
                return false;
            }

            // Small delay between chunks
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        return true;
    }

    /**
     * Generate ESC/POS commands for a simple receipt
     * @param text - Text to print
     */
    generateReceiptData(text: string): Uint8Array {
        // Basic ESC/POS commands
        const ESC = 0x1B;
        const GS = 0x1D;
        const AT = 0x40; // Initialize
        const LF = 0x0A; // Line feed

        const encoder = new TextEncoder();
        const textData = encoder.encode(text);

        // Initialize + Text + Cut
        const commands = [
            ESC, AT,           // Initialize
            ...textData,       // Text content
            LF, LF, LF,        // Feed lines
            GS, 0x56, 0x42, 0x00 // Cut paper
        ];

        return new Uint8Array(commands);
    }
}

export const bluetoothPrinterService = BluetoothPrinterService.getInstance();
