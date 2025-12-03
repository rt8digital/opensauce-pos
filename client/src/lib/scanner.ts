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

  async start(videoElement: HTMLVideoElement, onScan: (barcode: string) => void) {
    if (this.active && this.videoElement === videoElement) {
      console.log("Scanner already active with the same video element.");
      return; // Already active with same element
    }

    this.stop(); // Ensure any previous scanner is stopped before starting a new one
    this.videoElement = videoElement;
    
    try {
      this.active = true;
      const constraints = {
        video: {
          facingMode: 'environment'
        }
      };

      // Decode continuously from the video element
      this.reader.decodeFromConstraints(constraints, videoElement, (result) => {
        if (result) {
          onScan(result.getText());
          // The component (pos.tsx) will call stop via setShowScanner(false) after a successful scan.
        }
      });
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
      console.log("Camera scanner not active, no need to stop.");
      return;
    }
    this.reader.reset(); // This stops the video stream and resets internal state
    this.active = false;
    this.videoElement = null;
    console.log("Camera scanner stopped.");
  }

  /**
   * Initialize hardware scanner support by listening to keyboard events
   * This handles keyboard wedge scanners that act like keyboards
   */
  private initHardwareScanner() {
    if (typeof window !== 'undefined') {
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

    // Ignore modifier keys
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // Buffer to accumulate scanned characters
    if (!this.hasOwnProperty('scanBuffer')) {
      (this as any).scanBuffer = '';
    }

    // If it's the Enter key, process the buffer
    if (event.key === 'Enter') {
      if ((this as any).scanBuffer.length > 0) {
        this.hardwareScanCallback((this as any).scanBuffer);
        (this as any).scanBuffer = '';
        event.preventDefault();
      }
      return;
    }

    // Accumulate character
    (this as any).scanBuffer += event.key;

    // Reset buffer after 100ms of inactivity (assumes scanner is faster)
    if (this.hasOwnProperty('scanTimeout')) {
      clearTimeout((this as any).scanTimeout);
    }
    (this as any).scanTimeout = setTimeout(() => {
      (this as any).scanBuffer = '';
    }, 100);

    // Prevent default for scanner input
    event.preventDefault();
  }

  /**
   * Enable hardware scanner support
   */
  enableHardwareScanner(onScan: (barcode: string) => void) {
    this.hardwareScanCallback = onScan;
    this.hardwareScannerActive = true;
    console.log("Hardware scanner enabled.");
  }

  /**
   * Disable hardware scanner support
   */
  disableHardwareScanner() {
    this.hardwareScanCallback = null;
    this.hardwareScannerActive = false;
    console.log("Hardware scanner disabled.");
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
    return typeof window !== 'undefined';
  }
}

export const scanner = new BarcodeScanner();
