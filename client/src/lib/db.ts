import { openDB, IDBPDatabase } from 'idb';
import type { Product, Order } from '@shared/schema';

const DB_NAME = 'pos_db';
const DB_VERSION = 1;

interface POSDB {
  products: Product[];
  orders: Order[];
}

class IndexedDBStorage {
  private db: Promise<IDBPDatabase<POSDB>>;

  constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    return openDB<POSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
      },
    });
  }

  async syncProducts(products: Product[]) {
    const db = await this.db;
    const tx = db.transaction('products', 'readwrite');
    await Promise.all([
      ...products.map(product => tx.store.put(product)),
      tx.done
    ]);
  }

  async getProducts(): Promise<Product[]> {
    const db = await this.db;
    return db.getAll('products');
  }

  async saveOrder(order: Order) {
    const db = await this.db;
    await db.add('orders', order);
  }

  async getOrders(): Promise<Order[]> {
    const db = await this.db;
    return db.getAll('orders');
  }
}

export const indexedDB = new IndexedDBStorage();
