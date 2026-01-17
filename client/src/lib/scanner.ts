import { BrowserMultiFormatReader } from '@zxing/library';

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader;
  private active: boolean = false;
  private videoElement: HTMLVideoElement | null = null; // Store video element to reset
  private hardwareScannerActive: boolean = false;
  private hardwareScanCallback: ((barcode: string) => void) | null = null;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
    this.initHardwareScanner();
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    return await this.reader.listVideoInputDevices();
  }

  async start(videoElement: HTMLVideoElement, onScan: (barcode: string) => void, deviceId?: string) {
    if (this.active && this.videoElement === videoElement) {
      console.log("Scanner already active with the same video element.");
      return; // Already active with same element
    }

    this.stop(); // Ensure any previous scanner is stopped before starting a new one
    this.videoElement = videoElement;

    try {
      this.active = true;

      // If specific device ID is provided, use it. Otherwise default to environment facing mode
      if (deviceId) {
        await this.reader.decodeFromVideoDevice(deviceId, videoElement, (result) => {
          if (result) {
            onScan(result.getText());
          }
        });
      } else {
        const constraints = {
          video: {
            facingMode: 'environment'
          }
        };
        // Decode continuously from the video element
        this.reader.decodeFromConstraints(constraints, videoElement, (result) => {
          if (result) {
            onScan(result.getText());
          }
        });
      }

      console.log("Camera scanner started.");
    } catch (error) {
      console.error('Camera scanner error:', error);
      this.active = false; // Reset active state on error
      this.videoElement = null; // Clear video element on error
      throw error;
    }
  }

  stop() {
    if (!this.active) {
      // Silent - don't log when already inactive
      return;
    }
    this.reader.reset(); // This stops the video stream and resets internal state
    this.active = false;
    this.videoElement = null;
    // Silent - reduce log noise
  }

  /**
   * Initialize hardware scanner support by listening to keyboard events
   * This handles keyboard wedge scanners that act like keyboards
   */
  private initHardwareScanner() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', this.handleHardwareScan.bind(this));
    }
  }

  /**
   * Handle keyboard events from hardware scanners
   * Assumes scanner sends barcode as keystrokes followed by Enter key
   */
  private handleHardwareScan(event: KeyboardEvent) {
    // Only process if we have a callback registered
    if (!this.hardwareScanCallback) return;

    // Always allow modifier keys to pass through
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // Get the currently focused element
    const activeElement = document.activeElement;
    const isInputElement = activeElement instanceof HTMLInputElement ||
                          activeElement instanceof HTMLTextAreaElement ||
                          activeElement?.hasAttribute('contenteditable');

    // Initialize scan tracking properties if they don't exist
    if (!this.hasOwnProperty('scanBuffer')) {
      (this as any).scanBuffer = '';
      (this as any).lastKeyPressTime = 0;
      (this as any).isProcessingScannerInput = false;
    }

    const now = Date.now();

    // Update the global last scanner activity time for POS page to check
    (window as any).lastScannerActivityTime = now;

    // Check if this is likely from a scanner based on typing speed
    // Scanners input characters very quickly (typically <10ms between characters)
    // Humans typically type much slower (200-500ms+ between characters for fast typists)
    const isScannerInput = (now - (this as any).lastKeyPressTime) < 50;
    (this as any).lastKeyPressTime = now;

    // If it's the Enter key, process the buffer if it looks like scanner input
    if (event.key === 'Enter') {
      // Check if we have accumulated what looks like scanner input
      if ((this as any).scanBuffer.length > 0 && ((this as any).isProcessingScannerInput || isScannerInput)) {
        // Process the barcode
        this.hardwareScanCallback((this as any).scanBuffer);

        // Clear the buffer and state
        (this as any).scanBuffer = '';
        (this as any).isProcessingScannerInput = false;

        // Clear any existing timeout
        if (this.hasOwnProperty('scanTimeout')) {
          clearTimeout((this as any).scanTimeout);
        }

        // Prevent the Enter key from triggering other functions (like checkout)
        // since this Enter was part of a barcode scan
        event.preventDefault();
        event.stopPropagation(); // Stop the event from bubbling to other listeners
      } else {
        // Clear the buffer if it was not scanner input, but allow Enter to function normally
        (this as any).scanBuffer = '';
        (this as any).isProcessingScannerInput = false;
      }
      return;
    }

    // For character keys (0-9, letters, symbols that could be in barcodes)
    if (event.key.length === 1) { // Only single character keys (not special keys like Enter, Tab, etc.)
      if (isScannerInput || (this as any).isProcessingScannerInput) {
        // This looks like scanner input - add to buffer
        (this as any).scanBuffer += event.key;
        (this as any).isProcessingScannerInput = true; // Mark that we're in scanner input mode

        // Reset buffer after 100ms of inactivity (assumes scanner is faster)
        if (this.hasOwnProperty('scanTimeout')) {
          clearTimeout((this as any).scanTimeout);
        }
        (this as any).scanTimeout = setTimeout(() => {
          // Reset scanner state after timeout
          (this as any).scanBuffer = '';
          (this as any).isProcessingScannerInput = false;
        }, 100);

        // For input elements, allow the character to be entered normally
        // For non-input elements, prevent default to avoid unwanted characters
        if (!isInputElement) {
          event.preventDefault();
        }
      } else {
        // This looks like normal keyboard typing, clear scanner buffer and state
        (this as any).scanBuffer = '';
        (this as any).isProcessingScannerInput = false;
      }
    } else {
      // For special keys (not character keys), clear scanner buffer but allow them to pass through
      (this as any).scanBuffer = '';
      (this as any).isProcessingScannerInput = false;
    }
  }

  /**
   * Enable hardware scanner support
   */
  enableHardwareScanner(onScan: (barcode: string) => void) {
    // Only log once per state change to reduce noise
    if (!this.hardwareScannerActive) {
      console.log("Hardware scanner enabled.");
    }
    this.hardwareScanCallback = onScan;
    this.hardwareScannerActive = true;
  }

  /**
   * Disable hardware scanner support
   */
  disableHardwareScanner() {
    // Only log once per state change to reduce noise
    if (this.hardwareScannerActive) {
      console.log("Hardware scanner disabled.");
    }
    this.hardwareScanCallback = null;
    this.hardwareScannerActive = false;
  }

  /**
   * Check if hardware scanner is active
   */
  isHardwareScannerActive(): boolean {
    return this.hardwareScannerActive;
  }

  /**
   * Test hardware scanner connection (simulated)
   */
  async testHardwareScanner(): Promise<boolean> {
    // In a real implementation, this would check for connected hardware scanners
    // For now, we'll just check if we can listen to keyboard events
    return typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  }
}

export const scanner = new BarcodeScanner();
