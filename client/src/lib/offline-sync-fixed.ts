import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { apiRequest } from './queryClient';
import type { Product, Order, Customer, Discount, Settings } from '../../../../shared/types';

interface SyncQueueItem {
    id: string;
    type: 'order' | 'product' | 'customer' | 'discount' | 'settings';
    action: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
    retries: number;
    version: number;
}

interface POSDatabase extends DBSchema {
    syncQueue: {
        key: string;
        value: SyncQueueItem;
    };
    products: {
        key: number;
        value: Product & { lastModified: number; version: number };
    };
    orders: {
        key: number;
        value: Order & { lastModified: number; version: number };
    };
    customers: {
        key: number;
        value: Customer & { lastModified: number; version: number };
    };
    discounts: {
        key: number;
        value: Discount & { lastModified: number; version: number };
    };
    settings: {
        key: number;
        value: Settings & { lastModified: number; version: number };
    };
    metadata: {
        key: string;
        value: { key: string; value: any; lastModified: number };
    };
}

class OfflineSync {
    private dbPromise: Promise<IDBPDatabase<POSDatabase>>;
    private isSyncing = false;

    constructor() {
        // Only initialize IndexedDB in browser environments
        if (typeof indexedDB !== 'undefined') {
            this.dbPromise = openDB<POSDatabase>('pos-db', 3, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    if (oldVersion < 1) {
                        db.createObjectStore('products', { keyPath: 'id' });
                        db.createObjectStore('orders', { keyPath: 'id' });
                    }
                    if (oldVersion < 2) {
                        db.createObjectStore('syncQueue', { keyPath: 'id' });
                    }
                    if (oldVersion < 3) {
                        if (!db.objectStoreNames.contains('customers')) {
                            db.createObjectStore('customers', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('discounts')) {
                            db.createObjectStore('discounts', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('settings')) {
                            db.createObjectStore('settings', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('metadata')) {
                            db.createObjectStore('metadata', { keyPath: 'key' });
                        }
                    }
                },
            });
        } else {
            // Fallback for non-browser environments (tests, server-side)
            this.dbPromise = Promise.reject(new Error('IndexedDB not available in this environment'));
        }
    }

    async initialize() {
        // Listen for online events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.processSyncQueue());
        }

        // Process queue on initialization if online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            await this.processSyncQueue();
        }
    }

    async queueAction(type: SyncQueueItem['type'], action: SyncQueueItem['action'], data: any) {
        const item: SyncQueueItem = {
            id: `${Date.now()}-${Math.random()}`,
            type,
            action,
            data,
            timestamp: Date.now(),
            retries: 0,
            version: Date.now(),
        };

        try {
            const db = await this.dbPromise;
            await db.put('syncQueue', item);
        } catch (error) {
            // Ignore errors in non-browser environments
            console.warn('Failed to queue action in offline storage:', error);
        }

        // Try to sync immediately if online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            await this.processSyncQueue();
        }

        return item.id;
    }

    // Data storage methods
    async storeProducts(products: Product[]) {
        try {
            const db = await this.dbPromise;
            const tx = db.transaction('products', 'readwrite');

            await tx.store.clear();

            const timestamp = Date.now();
            await Promise.all([
                ...products.map(product =>
                    tx.store.put({
                        ...product,
                        lastModified: timestamp,
                        version: timestamp
                    })
                ),
                tx.done
            ]);
        } catch (error) {
            console.warn('Failed to store products in offline storage:', error);
        }
    }

    async getProducts(): Promise<Product[]> {
        try {
            const db = await this.dbPromise;
            const products = await db.getAll('products');
            return products.map(p => {
                const { lastModified, version, ...product } = p;
                return product;
            });
        } catch (error) {
            console.warn('Failed to get products from offline storage:', error);
            return [];
        }
    }

    async storeCustomers(customers: Customer[]) {
        try {
            const db = await this.dbPromise;
            const tx = db.transaction('customers', 'readwrite');

            await tx.store.clear();

            const timestamp = Date.now();
            await Promise.all([
                ...customers.map(customer =>
                    tx.store.put({
                        ...customer,
                        lastModified: timestamp,
                        version: timestamp
                    })
                ),
                tx.done
            ]);
        } catch (error) {
            console.warn('Failed to store customers in offline storage:', error);
        }
    }

    async getCustomers(): Promise<Customer[]> {
        try {
            const db = await this.dbPromise;
            const customers = await db.getAll('customers');
            return customers.map(c => {
                const { lastModified, version, ...customer } = c;
                return customer;
            });
        } catch (error) {
            console.warn('Failed to get customers from offline storage:', error);
            return [];
        }
    }

    async storeSettings(settings: Settings) {
        try {
            const db = await this.dbPromise;
            const timestamp = Date.now();
            await db.put('settings', {
                ...settings,
                lastModified: timestamp,
                version: timestamp
            });
        } catch (error) {
            console.warn('Failed to store settings in offline storage:', error);
        }
    }

    async getSettings(): Promise<Settings | null> {
        try {
            const db = await this.dbPromise;
            const settings = await db.getAll('settings');
            if (settings.length === 0) return null;

            const { lastModified, version, ...setting } = settings[0];
            return setting;
        } catch (error) {
            console.warn('Failed to get settings from offline storage:', error);
            return null;
        }
    }

    async processSyncQueue() {
        if (this.isSyncing || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            return;
        }

        try {
            const db = await this.dbPromise;
            const queue = await db.getAll('syncQueue');

            if (queue.length === 0) {
                return;
            }

            this.isSyncing = true;

            // Sort by timestamp to ensure order
            queue.sort((a, b) => a.timestamp - b.timestamp);

            for (const item of queue) {
                try {
                    await this.syncItem(item);
                    await db.delete('syncQueue', item.id); // Remove successful item
                } catch (error) {
                    console.error('Sync failed for item:', item, error);

                    item.retries++;
                    if (item.retries >= 3) {
                        // Move to failed queue or keep it? For now, we keep it but maybe stop processing to avoid blocking?
                        // Or just delete it if it's hopeless? 
                        // Let's update retries in DB
                        await db.put('syncQueue', item);
                    }
                    // If one fails, we might want to stop to preserve order dependency?
                    // For now, let's continue trying others unless it's critical.
                }
            }

            this.isSyncing = false;
        } catch (error) {
            console.warn('Failed to process sync queue:', error);
            this.isSyncing = false;
        }
    }

    private async syncItem(item: SyncQueueItem) {
        const { type, action, data } = item;

        switch (type) {
            case 'order':
                if (action === 'create') {
                    await apiRequest('POST', '/api/orders', data);
                }
                break;

            case 'product':
                if (action === 'create') {
                    await apiRequest('POST', '/api/products', data);
                } else if (action === 'update') {
                    await apiRequest('PATCH', `/api/products/${data.id}`, data);
                } else if (action === 'delete') {
                    await apiRequest('DELETE', `/api/products/${data.id}`);
                }
                break;

            case 'customer':
                if (action === 'create') {
                    await apiRequest('POST', '/api/customers', data);
                } else if (action === 'update') {
                    await apiRequest('PATCH', `/api/customers/${data.id}`, data);
                } else if (action === 'delete') {
                    await apiRequest('DELETE', `/api/customers/${data.id}`);
                }
                break;

            case 'discount':
                if (action === 'create') {
                    await apiRequest('POST', '/api/discounts', data);
                } else if (action === 'update') {
                    await apiRequest('PATCH', `/api/discounts/${data.id}`, data);
                } else if (action === 'delete') {
                    await apiRequest('DELETE', `/api/discounts/${data.id}`);
                }
                break;

            case 'settings':
                if (action === 'update') {
                    await apiRequest('PATCH', '/api/settings', data);
                }
                break;
        }
    }

    async getSyncQueueLength() {
        try {
            const db = await this.dbPromise;
            return db.count('syncQueue');
        } catch (error) {
            console.warn('Failed to get sync queue length:', error);
            return 0;
        }
    }
}

export const offlineSync = new OfflineSync();