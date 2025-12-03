import { db } from '../db.js';
import * as schema from '../../shared/schema.js';

// Test data for consistent testing environment
const testData = {
  users: [
    {
      name: 'Test Admin',
      pin: '123456',
      role: 'admin',
      isOwner: true,
    },
    {
      name: 'Test Cashier',
      pin: '654321',
      role: 'cashier',
      isOwner: false,
    }
  ],
  products: [
    {
      name: 'Test Product 1',
      price: '10.99',
      image: '/placeholder.jpg',
      stockQuantity: 50,
      barcode: '1234567890123',
      category: 'Test Category',
    },
    {
      name: 'Test Product 2',
      price: '25.50',
      image: '/placeholder.jpg',
      stockQuantity: 25,
      barcode: '1234567890124',
      category: 'Test Category',
    }
  ],
  customers: [
    {
      name: 'Test Customer',
      phone: '555-1234',
      email: 'test@example.com',
    }
  ]
};

export async function seedTestData() {
  try {
    // Clear existing data in correct order (respecting foreign keys)
    await db.delete(schema.orderItems);
    await db.delete(schema.orders);
    await db.delete(schema.customers);
    await db.delete(schema.products);
    await db.delete(schema.users);

    // Insert test users
    for (const user of testData.users) {
      await db.insert(schema.users).values(user);
    }

    // Insert test products
    for (const product of testData.products) {
      await db.insert(schema.products).values(product);
    }

    // Insert test customers
    for (const customer of testData.customers) {
      await db.insert(schema.customers).values(customer);
    }

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

export async function seedDefaultData() {
  try {
    // Check if we already have data
    const existingUsers = await db.select().from(schema.users).limit(1);
    const existingProducts = await db.select().from(schema.products).limit(1);

    if (existingUsers.length === 0) {
      // Insert default admin user
      await db.insert(schema.users).values({
        name: 'Admin',
        pin: '1234',
        role: 'admin',
        isOwner: true,
      });
    }

    if (existingProducts.length === 0) {
      // Insert sample products
      await db.insert(schema.products).values([
        {
          name: 'Sample Product 1',
          price: '15.99',
          image: '/placeholder.jpg',
          stockQuantity: 100,
          barcode: '1234567890125',
          category: 'Samples',
        },
        {
          name: 'Sample Product 2',
          price: '29.99',
          image: '/placeholder.jpg',
          stockQuantity: 50,
          barcode: '1234567890126',
          category: 'Samples',
        }
      ]);
    }

    console.log('Default data seeded successfully');
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
}
