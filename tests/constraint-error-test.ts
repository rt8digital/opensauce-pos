import { db } from '../server/db';
import * as schema from '../shared/schema';

async function testConstraintError() {
  try {
    // Try to insert a product with a duplicate barcode
    await db.insert(schema.products).values({
      name: 'Test Product',
      price: '9.99',
      cost: '5.99',
      image: '🧪',
      stockQuantity: 10,
      barcode: '1234567890123', // This barcode already exists
      category: 'Test'
    });
  } catch (error: any) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Full error object:', JSON.stringify(error, null, 2));
  }
}

testConstraintError();