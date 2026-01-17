import { io, Socket } from 'socket.io-client';

interface LinkedDevice {
    id: string;
    name: string;
    type: 'scanner' | 'printer';
    socketId: string;
    connectedAt: Date;
}

interface RemoteScanEvent {
    barcode: string;
    deviceId: string;
    deviceName: string;
    timestamp: Date;
}

interface PrintJobEvent {
    content: string;
    fromDevice: string;
    timestamp: Date;
}

class SocketClient {
    private socket: Socket | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isElectronMode = false;

    // Event listeners
    private onRemoteScanListeners: ((event: RemoteScanEvent) => void)[] = [];
    private onDevicesUpdatedListeners: ((devices: LinkedDevice[]) => void)[] = [];
    private onPrintJobListeners: ((event: PrintJobEvent) => void)[] = [];
    private onConnectListeners: (() => void)[] = [];
    private onDisconnectListeners: (() => void)[] = [];

    constructor() {
        this.isElectronMode = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
        if (!this.isElectronMode) {
            this.initializeSocket().catch(error => {
                console.error('Failed to initialize socket:', error);
                // Ensure socket state is consistent on failure
                this.socket = null;
                this.isConnected = false;
            });
        } else {
            console.log('Socket: Running in Electron mode, skipping socket initialization');
        }
    }

    private async initializeSocket() {
        try {
            // Check if we're running in Electron and can use direct database access
            if (window.electronAPI) {
                console.log('Socket: Running in Electron mode, skipping socket initialization');
                return;
            }

            // Get server URL - use fallback for web dev
            let serverUrl = window.location.origin;
            if (window.location.hostname === 'localhost') {
                serverUrl = 'http://localhost:5001'; // Fallback for web dev
            }

            console.log('Socket: Connecting to server URL:', serverUrl);
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize socket:', error);
            // Ensure socket is null on failure
            this.socket = null;
            this.isConnected = false;
        }
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.onConnectListeners.forEach(listener => listener());
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.onDisconnectListeners.forEach(listener => listener());

            // Auto-reconnect logic
            if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                this.attemptReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.attemptReconnect();
        });

        // Handle remote scan events from mobile devices
        this.socket.on('remote_scan', (data: RemoteScanEvent) => {
            console.log('Remote scan received:', data);
            this.onRemoteScanListeners.forEach(listener => listener(data));
        });

        // Handle device list updates
        this.socket.on('devices_updated', (devices: LinkedDevice[]) => {
            console.log('Devices updated:', devices);
            this.onDevicesUpdatedListeners.forEach(listener => listener(devices));
        });

        // Handle print job requests (for mobile devices)
        this.socket.on('print_job', (data: PrintJobEvent) => {
            console.log('Print job received:', data);
            this.onPrintJobListeners.forEach(listener => listener(data));
        });
    }

    private attemptReconnect() {
        if (this.isElectronMode) return;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            try {
                if (this.socket && !this.isConnected) {
                    this.socket.connect();
                }
            } catch (error) {
                console.error('Failed to reconnect socket:', error);
            }
        }, delay);
    }

    // Register a mobile device
    registerDevice(name: string, type: 'scanner' | 'printer'): Promise<{ id: string; name: string; type: string }> {
        return new Promise((resolve, reject) => {
            // Check if we're running in Electron and can use direct database access
            if (window.electronAPI) {
                reject(new Error('Socket connections not available in Electron mode'));
                return;
            }
            if (!this.socket || !this.isConnected) {
                reject(new Error('Not connected to server'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Registration timeout'));
            }, 10000);

            this.socket.emit('register_device', { name, type });

            this.socket.once('device_registered', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });
        });
    }

    // Send barcode scan from mobile device
    sendScan(barcode: string): boolean {
        // Check if we're running in Electron and can use direct database access
        if (window.electronAPI) {
            console.error('Cannot send scan: Electron mode');
            return false;
        }
        if (!this.socket || !this.isConnected) {
            console.error('Cannot send scan: not connected');
            return false;
        }

        this.socket.emit('device_scan', { barcode });
        return true;
    }

    // Request print job to mobile device
    requestPrint(deviceId: string, content: string): boolean {
        // Check if we're running in Electron and can use direct database access
        if (window.electronAPI) {
            console.error('Cannot request print: Electron mode');
            return false;
        }
        if (!this.socket || !this.isConnected) {
            console.error('Cannot request print: not connected');
            return false;
        }

        this.socket.emit('request_print', { deviceId, content });
        return true;
    }

    // Event listener management
    onRemoteScan(listener: (event: RemoteScanEvent) => void) {
        this.onRemoteScanListeners.push(listener);
        return () => {
            const index = this.onRemoteScanListeners.indexOf(listener);
            if (index > -1) {
                this.onRemoteScanListeners.splice(index, 1);
            }
        };
    }

    onDevicesUpdated(listener: (devices: LinkedDevice[]) => void) {
        this.onDevicesUpdatedListeners.push(listener);
        return () => {
            const index = this.onDevicesUpdatedListeners.indexOf(listener);
            if (index > -1) {
                this.onDevicesUpdatedListeners.splice(index, 1);
            }
        };
    }

    onPrintJob(listener: (event: PrintJobEvent) => void) {
        this.onPrintJobListeners.push(listener);
        return () => {
            const index = this.onPrintJobListeners.indexOf(listener);
            if (index > -1) {
                this.onPrintJobListeners.splice(index, 1);
            }
        };
    }

    onConnect(listener: () => void) {
        this.onConnectListeners.push(listener);
        return () => {
            const index = this.onConnectListeners.indexOf(listener);
            if (index > -1) {
                this.onConnectListeners.splice(index, 1);
            }
        };
    }

    onDisconnect(listener: () => void) {
        this.onDisconnectListeners.push(listener);
        return () => {
            const index = this.onDisconnectListeners.indexOf(listener);
            if (index > -1) {
                this.onDisconnectListeners.splice(index, 1);
            }
        };
    }

    // Connection status
    get isSocketConnected(): boolean {
        return this.isConnected;
    }

    // Disconnect
    disconnect() {
        // Check if we're running in Electron and can use direct database access
        if (window.electronAPI) return;
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Reconnect
    reconnect() {
        // Check if we're running in Electron and can use direct database access
        if (window.electronAPI) return;
        if (!this.socket) {
            this.initializeSocket();
        } else {
            this.socket.connect();
        }
    }
}

// Export singleton instance
export const socketClient = new SocketClient();
export type { LinkedDevice, RemoteScanEvent, PrintJobEvent };