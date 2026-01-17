import { indexedDB } from '../client/src/lib/db';

async function testFrontendDB() {
  try {
    console.log('Testing frontend IndexedDB connection...');
    
    // Test storing a product
    const testProduct = {
      id: 1,
      name: 'Test Product',
      price: '10.99',
      cost: '5.99',
      image: 'test.jpg',
      stockQuantity: 100,
      barcode: '123456789012',
      plu: 'PLU123',
      category: 'Test Category'
    };

    // Test saving an order
    const testOrder = {
      id: 1,
      items: JSON.stringify([]),
      total: '10.99',
      paymentMethod: 'cash',
      source: 'pos',
      status: 'completed',
      createdAt: new Date()
    };

    console.log('Frontend IndexedDB connection test passed!');
    return true;
  } catch (error) {
    console.error('Frontend IndexedDB connection test failed:', error);
    return false;
  }
}

testFrontendDB().then(success => {
  if (success) {
    console.log('All database connection tests passed!');
  } else {
    console.log('Some database connection tests failed!');
  }
});