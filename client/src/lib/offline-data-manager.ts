import { offlineSync } from './offline-sync';
import { apiRequest, queryClient } from './queryClient';
import type { Product, Order, Customer, Discount, Settings } from '@shared/schema';

class OfflineDataManager {
    private isOnline = navigator.onLine;

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
                const response = await apiRequest('GET', '/api/products');
                const products = await response.json();

                // Cache in IndexedDB for offline use
                await offlineSync.storeProducts(products);

                return products;
            } catch (error) {
                console.warn('Failed to fetch products from API, falling back to cache:', error);
                return offlineSync.getProducts();
            }
        } else {
            return offlineSync.getProducts();
        }
    }

    async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
        if (this.isOnline) {
            try {
                const response = await apiRequest('POST', '/api/products', product);
                const newProduct = await response.json();

                // Update cache
                const products = await offlineSync.getProducts();
                products.push(newProduct);
                await offlineSync.storeProducts(products);

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
                const response = await apiRequest('PATCH', `/api/products/${id}`, updates);
                const updatedProduct = await response.json();

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
                const response = await apiRequest('GET', '/api/customers');
                const customers = await response.json();

                // Cache in IndexedDB
                await offlineSync.storeCustomers(customers);

                return customers;
            } catch (error) {
                console.warn('Failed to fetch customers from API, falling back to cache:', error);
                return offlineSync.getCustomers();
            }
        } else {
            return offlineSync.getCustomers();
        }
    }

    async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalSpent'>): Promise<Customer> {
        if (this.isOnline) {
            try {
                const response = await apiRequest('POST', '/api/customers', customer);
                const newCustomer = await response.json();

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
                const response = await apiRequest('POST', '/api/orders', order);
                const newOrder = await response.json();
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
                const response = await apiRequest('GET', '/api/settings');
                const settings = await response.json();

                // Cache in IndexedDB
                await offlineSync.storeSettings(settings);

                return settings;
            } catch (error) {
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
                const response = await apiRequest('PATCH', '/api/settings', settings);
                const updatedSettings = await response.json();

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
