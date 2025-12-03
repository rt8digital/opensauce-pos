import { isCapacitor } from '@/utils/capacitor';

export interface WhatsAppMessage {
    phoneNumber: string;
    message: string;
    timestamp: string;
    id: string;
    status: 'pending' | 'sent' | 'failed';
}

export class WhatsAppWebService {
    private static instance: WhatsAppWebService;
    private readonly STORAGE_KEY = 'offline_whatsapp_messages';
    private whatsappWebWindow: Window | null = null;

    private constructor() { }

    static getInstance(): WhatsAppWebService {
        if (!WhatsAppWebService.instance) {
            WhatsAppWebService.instance = new WhatsAppWebService();
        }
        return WhatsAppWebService.instance;
    }

    /**
     * Send a WhatsApp message via WhatsApp Web
     * @param phoneNumber - The phone number to send the message to (with country code)
     * @param message - The message content
     */
    async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        try {
            // Format phone number (remove non-digits and ensure country code)
            const cleanNumber = phoneNumber.replace(/\D/g, '');

            // Create WhatsApp Web URL
            const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

            if (this.isElectron()) {
                // For Electron (desktop), try to use background browser automation
                return await this.sendViaElectron(whatsappWebUrl, message);
            } else {
                // For web/mobile, open WhatsApp Web in new tab
                return await this.sendViaBrowser(whatsappWebUrl);
            }
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            await this.storeOfflineMessage(phoneNumber, message);
            return false;
        }
    }

    /**
     * Send message via Electron background browser
     */
    private async sendViaElectron(url: string, message: string): Promise<boolean> {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                const result = await (window as any).electronAPI.sendWhatsAppMessage(url, message);
                return result.success;
            } else {
                // Fallback to opening browser
                return await this.sendViaBrowser(url);
            }
        } catch (error) {
            console.error('Electron WhatsApp send failed:', error);
            return await this.sendViaBrowser(url);
        }
    }

    /**
     * Send message by opening WhatsApp Web in browser
     */
    private async sendViaBrowser(url: string): Promise<boolean> {
        try {
            // Open WhatsApp Web in new tab/window
            const whatsappWindow = window.open(
                url,
                'whatsapp-web',
                'width=800,height=600,scrollbars=yes,resizable=yes'
            );

            if (!whatsappWindow) {
                throw new Error('Failed to open WhatsApp Web window. Please allow popups.');
            }

            this.whatsappWebWindow = whatsappWindow;

            // Store reference for cleanup
            whatsappWindow.onbeforeunload = () => {
                this.whatsappWebWindow = null;
            };

            // For web version, we can't automate sending, so we just open WhatsApp Web
            // User will need to click send manually
            return true;
        } catch (error) {
            console.error('Browser WhatsApp send failed:', error);
            return false;
        }
    }

    /**
     * Check if running in Electron
     */
    private isElectron(): boolean {
        return typeof window !== 'undefined' &&
            window.process &&
            (window.process as any).type === 'renderer';
    }

    /**
     * Check if WhatsApp Web is available
     */
    async isWhatsAppAvailable(): Promise<boolean> {
        // WhatsApp Web is generally available in modern browsers
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

            // Try to send each pending message
            for (const msg of pendingMessages) {
                const success = await this.sendMessage(msg.phoneNumber, msg.message);
                if (success) {
                    msg.status = 'sent';
                }
            }

            // Update storage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
            return true;
        } catch (error) {
            console.error('Error sending stored WhatsApp messages:', error);
            return false;
        }
    }

    /**
     * Open WhatsApp Web for manual messaging
     */
    openWhatsAppWeb(phoneNumber?: string): void {
        let url = 'https://web.whatsapp.com';
        if (phoneNumber) {
            const cleanNumber = phoneNumber.replace(/\D/g, '');
            url = `https://web.whatsapp.com/send?phone=${cleanNumber}`;
        }

        window.open(url, 'whatsapp-web', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    }

    /**
     * Format a receipt for WhatsApp
     */
    formatReceipt(order: any): string {
        let text = `*🧾 RECEIPT*\n`;
        text += `📅 Date: ${new Date(order.createdAt).toLocaleString()}\n`;
        text += `🆔 Order #${order.id}\n\n`;

        text += `*Items:*\n`;
        order.items.forEach((item: any) => {
            text += `• ${item.quantity}x ${item.productName} - R${item.price}\n`;
        });

        text += `\n*💰 Total: R${order.total}*\n`;
        text += `💳 Payment: ${order.paymentMethod}\n\n`;
        text += `🙏 Thank you for your business!\n`;
        text += `*${order.storeName || 'OpenSauce POS'}*`;

        return text;
    }

    /**
     * Close any open WhatsApp Web windows
     */
    closeWhatsAppWeb(): void {
        if (this.whatsappWebWindow && !this.whatsappWebWindow.closed) {
            this.whatsappWebWindow.close();
            this.whatsappWebWindow = null;
        }
    }
}

export const whatsappWebService = WhatsAppWebService.getInstance();
