import { offlineSync } from './offline-sync';
import { apiRequest, queryClient } from './queryClient';
import type { Product, Order, Customer, Discount, Settings } from '../../../../shared/types';

class OfflineDataManager {
    private isOnline = navigator.onLine;

    private get isElectron(): boolean {
        return typeof (window as any).electronAPI !== 'undefined';
    }

    constructor() {
        // Listen for network changes
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleReconnection();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Products
    async getProducts(): Promise<Product[]> {
        if (this.isOnline) {
            try {
                const products = this.isElectron ? await (window as any).electronAPI.getProducts() : await (await apiRequest('GET', '/api/products')).json();

                // Ensure products is an array
                const productsArray = Array.isArray(products) ? products : [];

                // Cache in IndexedDB for offline use
                await offlineSync.storeProducts(productsArray);

                return productsArray;
            } catch (error: any) {
                // Check if the error is specifically about database not being initialized
                if (error.message && error.message.includes('Database not initialized')) {
                    console.warn('Database not initialized, returning empty products list:', error);
                    return [];
                }
                console.warn('Failed to fetch products from API, falling back to cache:', error);
                const cachedProducts = await offlineSync.getProducts();
                return Array.isArray(cachedProducts) ? cachedProducts : [];
            }
        } else {
            return offlineSync.getProducts();
        }
    }

    async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
        if (this.isOnline) {
            try {
                const response = this.isElectron ? await (window as any).electronAPI.createProduct(product) : await (await apiRequest('POST', '/api/products', product)).json();
                const newProduct = response?.data ? response.data : response;

                // Update cache
                const products = await offlineSync.getProducts();
                if (Array.isArray(products)) {
                    products.push(newProduct);
                    await offlineSync.storeProducts(products);
                }

                return newProduct;
            } catch (error) {
                console.warn('Failed to create product online, queuing for later:', error);
                // Queue for later sync
                await offlineSync.queueAction('product', 'create', product);
                throw error; // Let the UI handle this
            }
        } else {
            // Queue for later sync
            await offlineSync.queueAction('product', 'create', product);
            throw new Error('Cannot create product while offline');
        }
    }

    async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
        if (this.isOnline) {
            try {
                const updatedProduct = this.isElectron ? await (window as any).electronAPI.updateProduct(id, updates) : await (await apiRequest('PATCH', `/api/products/${id}`, updates)).json();

                // Update cache
                const products = await offlineSync.getProducts();
                const index = products.findIndex(p => p.id === id);
                if (index !== -1) {
                    products[index] = updatedProduct;
                    await offlineSync.storeProducts(products);
                }

                return updatedProduct;
            } catch (error) {
                console.warn('Failed to update product online, queuing for later:', error);
                await offlineSync.queueAction('product', 'update', { id, ...updates });
                throw error;
            }
        } else {
            await offlineSync.queueAction('product', 'update', { id, ...updates });
            throw new Error('Cannot update product while offline');
        }
    }

    // Customers
    async getCustomers(): Promise<Customer[]> {
        if (this.isOnline) {
            try {
                const customers = this.isElectron ? await (window as any).electronAPI.getCustomers() : await (await apiRequest('GET', '/api/customers')).json();

                // Ensure customers is an array
                const customersArray = Array.isArray(customers) ? customers : [];

                // Cache in IndexedDB
                await offlineSync.storeCustomers(customersArray);

                return customersArray;
            } catch (error: any) {
                // Check if the error is specifically about database not being initialized
                if (error.message && error.message.includes('Database not initialized')) {
                    console.warn('Database not initialized, returning empty customers list:', error);
                    return [];
                }
                console.warn('Failed to fetch customers from API, falling back to cache:', error);
                const cachedCustomers = await offlineSync.getCustomers();
                return Array.isArray(cachedCustomers) ? cachedCustomers : [];
            }
        } else {
            const cachedCustomers = await offlineSync.getCustomers();
            return Array.isArray(cachedCustomers) ? cachedCustomers : [];
        }
    }

    async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalSpent'>): Promise<Customer> {
        if (this.isOnline) {
            try {
                const newCustomer = this.isElectron ? await (window as any).electronAPI.createCustomer(customer) : await (await apiRequest('POST', '/api/customers', customer)).json();

                // Update cache
                const customers = await offlineSync.getCustomers();
                customers.push(newCustomer);
                await offlineSync.storeCustomers(customers);

                return newCustomer;
            } catch (error) {
                console.warn('Failed to create customer online, queuing for later:', error);
                await offlineSync.queueAction('customer', 'create', customer);
                throw error;
            }
        } else {
            await offlineSync.queueAction('customer', 'create', customer);
            throw new Error('Cannot create customer while offline');
        }
    }

    // Orders
    async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
        if (this.isOnline) {
            try {
                const newOrder = this.isElectron ? await (window as any).electronAPI.createOrder(order) : await (await apiRequest('POST', '/api/orders', order)).json();
                return newOrder;
            } catch (error) {
                console.warn('Failed to create order online, queuing for later:', error);
                await offlineSync.queueAction('order', 'create', order);
                throw error;
            }
        } else {
            await offlineSync.queueAction('order', 'create', order);
            throw new Error('Cannot create order while offline');
        }
    }

    // Settings
    async getSettings(): Promise<Settings | null> {
        if (this.isOnline) {
            try {
                const settings = this.isElectron ? await (window as any).electronAPI.getSettings() : await (await apiRequest('GET', '/api/settings')).json();

                // Cache in IndexedDB
                await offlineSync.storeSettings(settings);

                return settings;
            } catch (error: any) {
                // Check if the error is specifically about database not being initialized
                if (error.message && error.message.includes('Database not initialized')) {
                    console.warn('Database not initialized, returning default settings:', error);
                    // Return default settings when database is not available
                    return {
                        id: 1,
                        storeName: 'OpenSauce P.O.S.',
                        currency: 'R',
                        theme: 'light',
                        language: 'en',
                        deviceRole: 'standalone',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                }
                console.warn('Failed to fetch settings from API, falling back to cache:', error);
                return offlineSync.getSettings();
            }
        } else {
            return offlineSync.getSettings();
        }
    }

    async updateSettings(settings: Partial<Settings>): Promise<Settings> {
        if (this.isOnline) {
            try {
                const updatedSettings = this.isElectron ? await (window as any).electronAPI.updateSettings(settings) : await (await apiRequest('PATCH', '/api/settings', settings)).json();

                // Update cache
                await offlineSync.storeSettings(updatedSettings);

                return updatedSettings;
            } catch (error) {
                console.warn('Failed to update settings online, queuing for later:', error);
                await offlineSync.queueAction('settings', 'update', settings);
                throw error;
            }
        } else {
            await offlineSync.queueAction('settings', 'update', settings);
            throw new Error('Cannot update settings while offline');
        }
    }

    // Utility methods
    getSyncQueueLength(): Promise<number> {
        return offlineSync.getSyncQueueLength();
    }

    isCurrentlyOnline(): boolean {
        return this.isOnline;
    }

    private async handleReconnection() {
        console.log('Reconnected to internet, processing sync queue...');
        // The offlineSync will automatically process the queue when it detects online status
    }
}

export const offlineDataManager = new OfflineDataManager();
