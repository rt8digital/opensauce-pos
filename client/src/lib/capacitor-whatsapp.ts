import { Share } from '@capacitor/share';
import { isCapacitor } from '@/utils/capacitor';

export interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  timestamp: string;
  id: string;
  status: 'pending' | 'sent' | 'failed';
}

export class CapacitorWhatsApp {
  private static instance: CapacitorWhatsApp;
  private readonly STORAGE_KEY = 'offline_whatsapp_messages';

  private constructor() { }

  static getInstance(): CapacitorWhatsApp {
    if (!CapacitorWhatsApp.instance) {
      CapacitorWhatsApp.instance = new CapacitorWhatsApp();
    }
    return CapacitorWhatsApp.instance;
  }

  /**
   * Check if we're running in a Capacitor environment
   */
  isCapacitor(): boolean {
    return isCapacitor();
  }

  /**
   * Send a WhatsApp message
   * @param phoneNumber - The phone number to send the message to
   * @param message - The message content
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isCapacitor()) {
      console.warn('WhatsApp messaging only available in Capacitor environment');
      return false;
    }

    try {
      // Format phone number (remove non-digits)
      const cleanNumber = phoneNumber.replace(/\D/g, '');

      // Use Capacitor Share API
      // This will open the native share sheet, user selects WhatsApp
      // Alternatively, we can use deep linking

      const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

      // Check if we can open the URL
      // Note: Capacitor App plugin doesn't have canOpenUrl, so we try to open it
      // Or we use the Share API which is more reliable but requires user interaction

      await Share.share({
        title: 'Receipt',
        text: message,
        url: whatsappUrl, // Some devices might use this
        dialogTitle: 'Send Receipt via WhatsApp',
      });

      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);

      // If sharing failed, store offline
      await this.storeOfflineMessage(phoneNumber, message);
      return false;
    }
  }

  /**
   * Check if WhatsApp is available on the device
   */
  async isWhatsAppAvailable(): Promise<boolean> {
    if (!this.isCapacitor()) {
      return false;
    }

    // There's no direct way to check installed apps in Capacitor without a custom plugin
    // We assume it's available or the user will install it
    return true;
  }

  /**
   * Store messages for offline sending
   */
  async storeOfflineMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const messages = await this.getStoredMessages();
      messages.push({
        phoneNumber,
        message,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
        status: 'pending'
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Error storing offline WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Get stored offline messages
   */
  async getStoredMessages(): Promise<WhatsAppMessage[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Send stored offline messages
   */
  async sendStoredMessages(): Promise<boolean> {
    try {
      const messages = await this.getStoredMessages();
      const pendingMessages = messages.filter(m => m.status === 'pending');

      if (pendingMessages.length === 0) return true;

      // We can't auto-send via WhatsApp without user interaction
      // So we just notify the user they have pending messages
      console.log(`You have ${pendingMessages.length} pending WhatsApp messages`);

      return true;
    } catch (error) {
      console.error('Error sending stored WhatsApp messages:', error);
      return false;
    }
  }

  /**
   * Format a receipt for WhatsApp
   */
  formatReceipt(order: any): string {
    let text = `*RECEIPT*\n`;
    text += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
    text += `Order #${order.id}\n\n`;

    order.items.forEach((item: any) => {
      text += `${item.quantity}x ${item.productName} - ${item.price}\n`;
    });

    text += `\n*Total: ${order.total}*\n`;
    text += `Thank you for your business!`;

    return text;
  }
}

export const capacitorWhatsApp = CapacitorWhatsApp.getInstance();