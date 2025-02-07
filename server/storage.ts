import { type Product, type InsertProduct, type Order, type InsertOrder } from "@shared/schema";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private currentProductId: number;
  private currentOrderId: number;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.currentProductId = 1;
    this.currentOrderId = 1;
    
    // Add sample products
    const sampleProducts = [
      { name: "Smart Watch", price: "199.99", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30", stockQuantity: 50, barcode: "123456789" },
      { name: "Headphones", price: "89.99", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e", stockQuantity: 30, barcode: "987654321" },
      { name: "Sunglasses", price: "129.99", image: "https://images.unsplash.com/photo-1596460107916-430662021049", stockQuantity: 25, barcode: "456789123" },
      { name: "Coffee Maker", price: "299.99", image: "https://images.unsplash.com/photo-1615615228002-890bb61cac6e", stockQuantity: 15, barcode: "789123456" }
    ];
    
    sampleProducts.forEach(product => this.createProduct(product));
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.barcode === barcode);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const newProduct = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const newOrder = { ...order, id };
    this.orders.set(id, newOrder);
    return newOrder;
  }
}

export const storage = new MemStorage();
