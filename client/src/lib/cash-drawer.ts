import { ipcRenderer } from 'electron';

export class CashDrawer {
  private static instance: CashDrawer;
  private isOpen: boolean = false;

  private constructor() {}

  static getInstance(): CashDrawer {
    if (!CashDrawer.instance) {
      CashDrawer.instance = new CashDrawer();
    }
    return CashDrawer.instance;
  }

  /**
   * Open the cash drawer
   * @param port - The COM port to send the command to
   * @param pulseDuration - Duration of the kick pulse in milliseconds (default: 100)
   */
  async open(port?: string, pulseDuration: number = 100): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.openCashDrawer(port, pulseDuration);
        this.isOpen = result;
        return result;
      }
      
      // Fallback for web environment (would require server-side implementation)
      console.warn('Cash drawer opening not supported in web environment');
      return false;
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      return false;
    }
  }

  /**
   * Get the current status of the cash drawer
   */
  async getStatus(): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const status = await (window as any).electronAPI.getCashDrawerStatus();
        this.isOpen = status;
        return status;
      }
      
      // Return cached status for web environment
      return this.isOpen;
    } catch (error) {
      console.error('Error getting cash drawer status:', error);
      return false;
    }
  }

  /**
   * Close the cash drawer (if supported by hardware)
   */
  async close(): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.closeCashDrawer();
        this.isOpen = !result;
        return result;
      }
      
      // Fallback for web environment
      console.warn('Cash drawer closing not supported in web environment');
      return false;
    } catch (error) {
      console.error('Error closing cash drawer:', error);
      return false;
    }
  }
}

export const cashDrawer = CashDrawer.getInstance();