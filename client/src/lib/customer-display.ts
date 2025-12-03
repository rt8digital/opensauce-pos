import { ipcRenderer } from 'electron';

export interface DisplayContent {
  header?: string;
  items?: Array<{ name: string; price: string }>;
  total?: string;
  footer?: string;
  promotion?: string;
}

export class CustomerDisplay {
  private static instance: CustomerDisplay;
  private isConnected: boolean = false;
  private currentContent: DisplayContent = {};

  private constructor() {}

  static getInstance(): CustomerDisplay {
    if (!CustomerDisplay.instance) {
      CustomerDisplay.instance = new CustomerDisplay();
    }
    return CustomerDisplay.instance;
  }

  /**
   * Update the customer display with new content
   * @param content - The content to display
   * @param displayType - Type of display ('monitor', 'network', 'serial')
   * @param displayAddress - Address of the display (IP for network, COM port for serial)
   */
  async update(content: DisplayContent, displayType?: string, displayAddress?: string): Promise<boolean> {
    try {
      this.currentContent = content;
      
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.updateCustomerDisplay(
          content, 
          displayType, 
          displayAddress
        );
        this.isConnected = result;
        return result;
      }
      
      // Fallback for web environment
      console.log('Customer display update:', content);
      return true;
    } catch (error) {
      console.error('Error updating customer display:', error);
      return false;
    }
  }

  /**
   * Clear the customer display
   */
  async clear(displayType?: string, displayAddress?: string): Promise<boolean> {
    try {
      this.currentContent = {};
      
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.clearCustomerDisplay(
          displayType, 
          displayAddress
        );
        return result;
      }
      
      // Fallback for web environment
      console.log('Customer display cleared');
      return true;
    } catch (error) {
      console.error('Error clearing customer display:', error);
      return false;
    }
  }

  /**
   * Show a welcome message on the customer display
   */
  async showWelcome(displayType?: string, displayAddress?: string): Promise<boolean> {
    return this.update(
      { header: 'WELCOME', footer: 'Please scan your items' },
      displayType,
      displayAddress
    );
  }

  /**
   * Show transaction details on the customer display
   * @param items - Items in the transaction
   * @param total - Total amount
   */
  async showTransaction(items: Array<{ name: string; price: string }>, total: string, displayType?: string, displayAddress?: string): Promise<boolean> {
    return this.update(
      { 
        header: 'CURRENT ORDER',
        items,
        total: `TOTAL: ${total}`,
        footer: 'Thank you for your purchase!'
      },
      displayType,
      displayAddress
    );
  }

  /**
   * Get the current status of the customer display
   */
  async getStatus(): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const status = await (window as any).electronAPI.getCustomerDisplayStatus();
        this.isConnected = status;
        return status;
      }
      
      // Return cached status for web environment
      return this.isConnected;
    } catch (error) {
      console.error('Error getting customer display status:', error);
      return false;
    }
  }

  /**
   * Get the current content displayed
   */
  getCurrentContent(): DisplayContent {
    return this.currentContent;
  }
}

export const customerDisplay = CustomerDisplay.getInstance();