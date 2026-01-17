import { offlineSync } from './offline-sync';
import type { Settings } from '../../../../shared/types';

// Define the structure for saved carts
interface SavedCart {
  id: string;
  name: string;
  cart: any[];
  createdAt: number;
  customer?: any;
}

class StorageManager {
    async getSettings(): Promise<Settings | null> {
        try {
            // Try to get settings from cache first
            const cachedSettings = await offlineSync.getSettings();
            if (cachedSettings) {
                return cachedSettings;
            }

            // If no cached settings, return null
            return null;
        } catch (error) {
            console.warn('Failed to get settings from storage:', error);
            return null;
        }
    }

    async updateSettings(settings: Partial<Settings>): Promise<Settings | null> {
        try {
            // Update cache
            const currentSettings = await this.getSettings();
            const updatedSettings = { ...currentSettings, ...settings } as Settings;
            await offlineSync.storeSettings(updatedSettings);
            return updatedSettings;
        } catch (error) {
            console.warn('Failed to update settings in storage:', error);
            return null;
        }
    }

    // Methods for managing saved carts
    async saveCart(id: string, name: string, cart: any[], customer?: any): Promise<void> {
        try {
            const savedCarts = await this.getSavedCarts();
            const existingIndex = savedCarts.findIndex(cart => cart.id === id);

            const newCart: SavedCart = {
                id,
                name,
                cart,
                createdAt: Date.now(),
                customer
            };

            if (existingIndex >= 0) {
                savedCarts[existingIndex] = newCart;
            } else {
                savedCarts.push(newCart);
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('saved_carts', JSON.stringify(savedCarts));
            }
        } catch (error) {
            console.warn('Failed to save cart:', error);
        }
    }

    async getSavedCarts(): Promise<SavedCart[]> {
        try {
            const savedCartsString = typeof window !== 'undefined' ? localStorage.getItem('saved_carts') : null;
            if (!savedCartsString) {
                return [];
            }
            return JSON.parse(savedCartsString);
        } catch (error) {
            console.warn('Failed to get saved carts:', error);
            return [];
        }
    }

    async loadCart(id: string): Promise<SavedCart | null> {
        try {
            const savedCarts = await this.getSavedCarts();
            return savedCarts.find(cart => cart.id === id) || null;
        } catch (error) {
            console.warn('Failed to load cart:', error);
            return null;
        }
    }

    async deleteCart(id: string): Promise<void> {
        try {
            const savedCarts = await this.getSavedCarts();
            const filteredCarts = savedCarts.filter(cart => cart.id !== id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('saved_carts', JSON.stringify(filteredCarts));
            }
        } catch (error) {
            console.warn('Failed to delete cart:', error);
        }
    }

    // Method for managing last receipt
    async saveLastReceipt(receiptData: any): Promise<void> {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('last_receipt', JSON.stringify(receiptData));
            }
        } catch (error) {
            console.warn('Failed to save last receipt:', error);
        }
    }

    async getLastReceipt(): Promise<any | null> {
        try {
            const lastReceiptString = typeof window !== 'undefined' ? localStorage.getItem('last_receipt') : null;
            if (!lastReceiptString) {
                return null;
            }
            return JSON.parse(lastReceiptString);
        } catch (error) {
            console.warn('Failed to get last receipt:', error);
            return null;
        }
    }
}

export const storage = new StorageManager();