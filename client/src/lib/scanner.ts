import { BrowserMultiFormatReader } from '@zxing/library';

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader;
  private active: boolean = false;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
  }

  async start(videoElement: HTMLVideoElement, onScan: (barcode: string) => void) {
    if (this.active) return;
    
    try {
      this.active = true;
      const constraints = {
        video: {
          facingMode: 'environment'
        }
      };

      await this.reader.decodeFromConstraints(constraints, videoElement, (result) => {
        if (result) {
          onScan(result.getText());
        }
      });
    } catch (error) {
      console.error('Scanner error:', error);
      throw error;
    }
  }

  stop() {
    if (!this.active) return;
    this.reader.reset();
    this.active = false;
  }
}

export const scanner = new BarcodeScanner();
