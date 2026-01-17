import { test, expect } from '@playwright/test';
import { z } from 'zod';
import * as schema from '../../shared/schema';

test.describe('Zod Validation Tests', () => {
  test('should validate correct product data', async () => {
    const validProduct = {
      name: 'Test Product',
      price: '10.99',
      image: 'test.jpg',
      stockQuantity: 100,
      barcode: '1234567890123',
      plu: 'PLU123',
      category: 'General'
    };

    // This should not throw an error
    const result = schema.insertProductSchema.parse(validProduct);
    // Category field has a default value in schema, so it may not be in result
    expect(result).toMatchObject(validProduct);
  });

  test('should reject product with missing required fields', async () => {
    const invalidProduct = {
      name: 'Test Product',
      // Missing price, image, stockQuantity, barcode
    };

    expect(() => schema.insertProductSchema.parse(invalidProduct)).toThrow();
  });

  test('should reject product with invalid price type', async () => {
    const invalidProduct = {
      name: 'Test Product',
      price: 10.99, // Should be string
      image: 'test.jpg',
      stockQuantity: 100,
      barcode: '1234567890123',
      plu: 'PLU123',
      category: 'General'
    };

    expect(() => schema.insertProductSchema.parse(invalidProduct)).toThrow();
  });

  test('should validate partial product data for updates', async () => {
    const partialProduct = {
      name: 'Updated Product Name'
    };

    // This should not throw an error
    const result = schema.insertProductSchema.partial().parse(partialProduct);
    expect(result).toEqual(partialProduct);
  });
});
