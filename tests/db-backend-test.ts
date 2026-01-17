import { db } from '../server/db';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testBackendDB() {
  try {
    console.log('Testing backend database connection...');
    
    // Test querying products
    const products = await db.select().from(schema.products).limit(5);
    console.log(`Retrieved ${products.length} products from backend database`);
    
    // Test querying orders
    const orders = await db.select().from(schema.orders).limit(5);
    console.log(`Retrieved ${orders.length} orders from backend database`);
    
    // Test inserting a test product
    const [newProduct] = await db.insert(schema.products).values({
      name: 'DB Test Product',
      price: '9.99',
      cost: '5.99',
      image: '🧪',
      stockQuantity: 10,
      barcode: '9999999999999',
      category: 'Test'
    }).returning();
    
    console.log('Inserted test product with ID:', newProduct.id);
    
    // Test updating the product
    const [updatedProduct] = await db.update(schema.products)
      .set({ stockQuantity: 20 })
      .where(eq(schema.products.id, newProduct.id))
      .returning();
    
    console.log('Updated product stock to:', updatedProduct.stockQuantity);
    
    // Test deleting the product
    await db.delete(schema.products).where(eq(schema.products.id, newProduct.id));
    console.log('Deleted test product');
    
    console.log('Backend database tests passed!');
    return true;
  } catch (error) {
    console.error('Backend database test failed:', error);
    return false;
  }
}

testBackendDB().then(success => {
  if (success) {
    console.log('All database tests passed!');
    process.exit(0);
  } else {
    console.log('Some database tests failed!');
    process.exit(1);
  }
});