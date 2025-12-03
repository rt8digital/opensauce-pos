import { offlineSync } from './offline-sync';
import type { Settings } from '@shared/schema';

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
}

export const storage = new StorageManager();