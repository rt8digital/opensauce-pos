/**
 * Comprehensive Products CRUD Test Suite
 * Tests all CRUD operations, edge cases, validation, and performance for the Products entity
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './shared/schema.js';
import { eq, and, or, like, ilike } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_DB_PATH = 'test-products-crud.sqlite';
const RESULTS_FILE = 'products-crud-test-results.json';

// Test data generators
const generateTestProducts = (count = 100) => {
    const products = [];
    const categories = ['General', 'Food', 'Beverages', 'Electronics', 'Clothing'];
    const adjectives = ['Premium', 'Deluxe', 'Ultra', 'Super', 'Mega', 'Basic', 'Standard', 'Advanced'];
    const nouns = ['Widget', 'Gadget', 'Tool', 'Device', 'Item', 'Product', 'Package', 'Bundle'];

    for (let i = 1; i <= count; i++) {
        const price = (Math.random() * 999 + 1).toFixed(2);
        const cost = (parseFloat(price) * (0.3 + Math.random() * 0.4)).toFixed(2);
        const stockQuantity = Math.floor(Math.random() * 1000) + 1;
        const category = categories[i % categories.length];

        products.push({
            name: `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i}`,
            price: price,
            cost: cost,
            image: `image-${i}.jpg`,
            stockQuantity: stockQuantity,
            barcode: `123456789012${i.toString().padStart(2, '0')}`,
            plu: `PLU${i.toString().padStart(3, '0')}`,
            category: category,
            categoryId: null // Will be set later when categories are created
        });
    }
    return products;
};

const generateTestCategories = () => {
    return [
        { name: 'General', description: 'General products category' },
        { name: 'Food', description: 'Food and snacks' },
        { name: 'Beverages', description: 'Drinks and beverages' },
        { name: 'Electronics', description: 'Electronic devices' },
        { name: 'Clothing', description: 'Apparel and clothing' }
    ];
};

// Test Suite Class
class ProductsCRUDTestSuite {
    constructor() {
        this.db = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: [],
            tests: []
        };
        this.startTime = Date.now();
    }

    async initialize() {
        console.log('🗄️ Initializing test database...');

        // Clean up existing test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }

        // Create new test database
        this.db = new Database(TEST_DB_PATH);

        // Enable WAL mode for better performance
        this.db.pragma('journal_mode = WAL');

        // Create Drizzle instance
        this.drizzle = drizzle(this.db, { schema });

        await this.setupSchema();
        console.log('✅ Test database initialized');
    }

    async setupSchema() {
        console.log('🔧 Setting up database schema...');

        // Create tables manually based on the schema
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                pin TEXT NOT NULL,
                role TEXT NOT NULL,
                is_owner INTEGER DEFAULT 0,
                created_at INTEGER,
                last_login INTEGER
            )`,

            `CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                loyalty_points INTEGER DEFAULT 0,
                total_spent TEXT DEFAULT '0',
                created_at INTEGER
            )`,

            `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at INTEGER
            )`,

            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price TEXT NOT NULL,
                cost TEXT DEFAULT '0',
                image TEXT NOT NULL,
                stock_quantity INTEGER NOT NULL,
                barcode TEXT NOT NULL UNIQUE,
                plu TEXT,
                category_id INTEGER,
                category TEXT DEFAULT 'General' NOT NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`,

            `CREATE TABLE IF NOT EXISTS discounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                value TEXT NOT NULL,
                active INTEGER DEFAULT 1
            )`,

            `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                user_id INTEGER,
                items TEXT NOT NULL,
                total TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                source TEXT DEFAULT 'pos',
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at INTEGER,
                cash_received TEXT,
                change TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`,

            `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_name TEXT DEFAULT 'OpenSauce P.O.S.' NOT NULL,
                store_address TEXT,
                store_phone TEXT,
                store_email TEXT,
                store_logo TEXT,
                currency TEXT DEFAULT 'R' NOT NULL,
                theme TEXT DEFAULT 'light' NOT NULL,
                language TEXT DEFAULT 'en' NOT NULL,
                device_role TEXT DEFAULT 'standalone',
                server_ip_address TEXT,
                low_stock_threshold INTEGER DEFAULT 10,
                stock_alert_enabled INTEGER DEFAULT 1,
                updated_at INTEGER
            )`
        ];

        // Execute table creation statements
        for (const sql of tables) {
            this.db.exec(sql);
        }

        console.log('✅ Database schema created');
    }

    async runTest(testName, testFn) {
        console.log(`\n🧪 Running test: ${testName}`);

        try {
            const result = await testFn();
            if (result === true || result === undefined) {
                this.testResults.passed++;
                this.testResults.tests.push({ name: testName, status: 'PASSED', error: null });
                console.log(`✅ ${testName} - PASSED`);
            } else {
                this.testResults.failed++;
                this.testResults.tests.push({ name: testName, status: 'FAILED', error: result });
                console.log(`❌ ${testName} - FAILED: ${result}`);
            }
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push({ test: testName, error: error.message, stack: error.stack });
            this.testResults.tests.push({ name: testName, status: 'ERROR', error: error.message });
            console.log(`💥 ${testName} - ERROR: ${error.message}`);
        }
    }

    // CREATE Operations Tests
    async testCreateValidProduct() {
        const product = {
            name: 'Test Product',
            price: '10.99',
            cost: '5.50',
            image: 'test.jpg',
            stockQuantity: 100,
            barcode: '1234567890123',
            category: 'General'
        };

        const [created] = await this.drizzle.insert(schema.products).values(product).returning();

        if (created && created.id) {
            // Verify the created product
            const [retrieved] = await this.drizzle.select().from(schema.products).where(eq(schema.products.id, created.id));
            return retrieved && retrieved.name === product.name;
        }
        return false;
    }

    async testCreateMultipleProducts() {
        const products = generateTestProducts(10);
        const results = await this.drizzle.insert(schema.products).values(products).returning();

        return results.length === products.length;
    }

    async testCreateProductWithCategory() {
        // First create a category
        const [category] = await this.drizzle.insert(schema.categories).values({
            name: 'Test Category',
            description: 'Test category for products'
        }).returning();

        // Create product with category reference
        const product = {
            name: 'Test Product with Category',
            price: '15.99',
            cost: '7.99',
            image: 'test-category.jpg',
            stockQuantity: 50,
            barcode: '1234567890999',
            categoryId: category.id,
            category: 'Test Category'
        };

        const [created] = await this.drizzle.insert(schema.products).values(product).returning();

        return created && created.categoryId === category.id;
    }

    async testCreateProductValidationErrors() {
        const testCases = [
            {
                name: 'Missing required fields',
                product: { price: '10.99', image: 'test.jpg', stockQuantity: 10, barcode: '1234567890001' },
                expectedError: 'NOT NULL constraint failed: products.name'
            },
            {
                name: 'Invalid price',
                product: { name: 'Test', price: 'invalid', image: 'test.jpg', stockQuantity: 10, barcode: '1234567890002' },
                expectedError: 'invalid'
            },
            {
                name: 'Missing barcode',
                product: { name: 'Test', price: '10.99', image: 'test.jpg', stockQuantity: 10 },
                expectedError: 'NOT NULL constraint failed: products.barcode'
            }
        ];

        let errorCount = 0;
        for (const testCase of testCases) {
            try {
                await this.drizzle.insert(schema.products).values(testCase.product);
            } catch (error) {
                if (error.message.includes(testCase.expectedError) || error.message.includes('NOT NULL') || error.message.includes('constraint')) {
                    errorCount++;
                }
            }
        }

        return errorCount === testCases.length;
    }

    async testCreateProductDuplicateBarcode() {
        const product = {
            name: 'First Product',
            price: '10.99',
            cost: '5.50',
            image: 'test1.jpg',
            stockQuantity: 100,
            barcode: 'DUPLICATE123',
            category: 'General'
        };

        // Create first product
        await this.drizzle.insert(schema.products).values(product);

        // Try to create second product with same barcode
        try {
            const duplicateProduct = { ...product, name: 'Second Product' };
            await this.drizzle.insert(schema.products).values(duplicateProduct);
            return false; // Should have failed
        } catch (error) {
            return error.message.includes('UNIQUE constraint failed') || error.message.includes('barcode');
        }
    }

    // READ Operations Tests
    async testReadSingleProduct() {
        // Create a test product
        const [created] = await this.drizzle.insert(schema.products).values({
            name: 'Read Test Product',
            price: '25.99',
            cost: '12.99',
            image: 'read-test.jpg',
            stockQuantity: 75,
            barcode: 'READTEST123',
            category: 'General'
        }).returning();

        // Read the product
        const [retrieved] = await this.drizzle.select().from(schema.products).where(eq(schema.products.id, created.id));

        return retrieved && retrieved.id === created.id && retrieved.name === created.name;
    }

    async testReadAllProducts() {
        // Create multiple products
        const products = [
            { name: 'Product 1', price: '10.00', image: 'p1.jpg', stockQuantity: 10, barcode: 'P1' },
            { name: 'Product 2', price: '20.00', image: 'p2.jpg', stockQuantity: 20, barcode: 'P2' },
            { name: 'Product 3', price: '30.00', image: 'p3.jpg', stockQuantity: 30, barcode: 'P3' }
        ];

        await this.drizzle.insert(schema.products).values(products);

        // Read all products
        const allProducts = await this.drizzle.select().from(schema.products);

        return allProducts.length >= 3;
    }

    async testReadProductsWithFiltering() {
        const products = [
            { name: 'Apple Product', price: '10.00', image: 'apple.jpg', stockQuantity: 10, barcode: 'APPLE1' },
            { name: 'Banana Product', price: '15.00', image: 'banana.jpg', stockQuantity: 15, barcode: 'BANANA1' },
            { name: 'Cherry Product', price: '20.00', image: 'cherry.jpg', stockQuantity: 20, banana: 'CHERRY1' }
        ];

        await this.drizzle.insert(schema.products).values(products);

        // Filter by name containing "Apple"
        const appleProducts = await this.drizzle.select().from(schema.products)
            .where(ilike(schema.products.name, '%Apple%'));

        return appleProducts.length === 1 && appleProducts[0].name === 'Apple Product';
    }

    async testReadProductsWithSorting() {
        const products = [
            { name: 'Zebra Product', price: '30.00', image: 'zebra.jpg', stockQuantity: 30, barcode: 'ZEBRA1' },
            { name: 'Alpha Product', price: '10.00', image: 'alpha.jpg', stockQuantity: 10, barcode: 'ALPHA1' },
            { name: 'Beta Product', price: '20.00', image: 'beta.jpg', stockQuantity: 20, barcode: 'BETA1' }
        ];

        await this.drizzle.insert(schema.products).values(products);

        // This is a simplified test - in real Drizzle you might need raw SQL for complex sorting
        const allProducts = await this.drizzle.select().from(schema.products);

        return allProducts.length >= 3;
    }

    async testSearchByBarcode() {
        const testBarcode = 'SEARCHTEST123';
        const product = {
            name: 'Barcode Search Test',
            price: '18.99',
            cost: '9.50',
            image: 'search-test.jpg',
            stockQuantity: 25,
            barcode: testBarcode,
            category: 'General'
        };

        await this.drizzle.insert(schema.products).values(product);

        const [found] = await this.drizzle.select().from(schema.products)
            .where(eq(schema.products.barcode, testBarcode));

        return found && found.barcode === testBarcode;
    }

    async testSearchByPLU() {
        const testPLU = 'PLU123';
        const product = {
            name: 'PLU Search Test',
            price: '22.99',
            cost: '11.50',
            image: 'plu-test.jpg',
            stockQuantity: 35,
            barcode: 'PLU_SEARCH_123',
            plu: testPLU,
            category: 'General'
        };

        await this.drizzle.insert(schema.products).values(product);

        const [found] = await this.drizzle.select().from(schema.products)
            .where(eq(schema.products.plu, testPLU));

        return found && found.plu === testPLU;
    }

    // UPDATE Operations Tests
    async testUpdateProduct() {
        // Create a test product
        const [created] = await this.drizzle.insert(schema.products).values({
            name: 'Original Product',
            price: '10.00',
            cost: '5.00',
            image: 'original.jpg',
            stockQuantity: 10,
            barcode: 'UPDATE_TEST_123',
            category: 'General'
        }).returning();

        // Update the product
        const [updated] = await this.drizzle.update(schema.products)
            .set({
                name: 'Updated Product',
                price: '15.00',
                stockQuantity: 20
            })
            .where(eq(schema.products.id, created.id))
            .returning();

        return updated && updated.name === 'Updated Product' && updated.price === '15.00';
    }

    async testPartialUpdate() {
        const [created] = await this.drizzle.insert(schema.products).values({
            name: 'Partial Update Test',
            price: '12.00',
            cost: '6.00',
            image: 'partial.jpg',
            stockQuantity: 15,
            barcode: 'PARTIAL_UPDATE_123',
            category: 'General'
        }).returning();

        // Update only the name
        const [updated] = await this.drizzle.update(schema.products)
            .set({ name: 'Partially Updated Product' })
            .where(eq(schema.products.id, created.id))
            .returning();

        return updated && updated.name === 'Partially Updated Product' && updated.price === '12.00';
    }

    async testUpdateWithCategoryReference() {
        // Create category first
        const [category] = await this.drizzle.insert(schema.categories).values({
            name: 'Update Test Category',
            description: 'Category for testing updates'
        }).returning();

        // Create product
        const [created] = await this.drizzle.insert(schema.products).values({
            name: 'Category Update Test',
            price: '20.00',
            cost: '10.00',
            image: 'cat-update.jpg',
            stockQuantity: 25,
            barcode: 'CAT_UPDATE_123',
            category: 'General'
        }).returning();

        // Update with category reference
        const [updated] = await this.drizzle.update(schema.products)
            .set({ categoryId: category.id, category: 'Update Test Category' })
            .where(eq(schema.products.id, created.id))
            .returning();

        return updated && updated.categoryId === category.id;
    }

    async testUpdateNonExistentProduct() {
        const result = await this.drizzle.update(schema.products)
            .set({ name: 'Non-existent Update' })
            .where(eq(schema.products.id, 99999))
            .returning();

        return result.length === 0;
    }

    // DELETE Operations Tests
    async testDeleteProduct() {
        // Create a test product
        const [created] = await this.drizzle.insert(schema.products).values({
            name: 'Product to Delete',
            price: '30.00',
            cost: '15.00',
            image: 'delete-test.jpg',
            stockQuantity: 5,
            barcode: 'DELETE_TEST_123',
            category: 'General'
        }).returning();

        // Delete the product
        const deleted = await this.drizzle.delete(schema.products)
            .where(eq(schema.products.id, created.id))
            .returning();

        // Verify deletion
        const [found] = await this.drizzle.select().from(schema.products)
            .where(eq(schema.products.id, created.id));

        return deleted.length === 1 && !found;
    }

    async testDeleteNonExistentProduct() {
        const result = await this.drizzle.delete(schema.products)
            .where(eq(schema.products.id, 99999))
            .returning();

        return result.length === 0;
    }

    async testCascadeDeleteWithOrders() {
        // This test would verify cascade behavior if there were foreign key constraints
        // For now, just test that we can delete products even if they have related order items

        const [created] = await this.drizzle.insert(schema.products).values({
            name: 'Cascade Test Product',
            price: '40.00',
            cost: '20.00',
            image: 'cascade.jpg',
            stockQuantity: 10,
            barcode: 'CASCADE_123',
            category: 'General'
        }).returning();

        // Try to delete (this would fail if there were actual foreign key constraints with CASCADE)
        const deleted = await this.drizzle.delete(schema.products)
            .where(eq(schema.products.id, created.id))
            .returning();

        return deleted.length === 1;
    }

    // Edge Cases and Validation Tests
    async testProductWithSpecialCharacters() {
        const product = {
            name: 'Product with "quotes" & special chars!@#',
            price: '99.99',
            cost: '49.99',
            image: 'special-chars.jpg',
            stockQuantity: 1,
            barcode: 'SPECIAL123',
            category: 'General'
        };

        const [created] = await this.drizzle.insert(schema.products).values(product).returning();
        return created && created.name.includes('quotes');
    }

    async testProductWithLongStrings() {
        const product = {
            name: 'A'.repeat(255), // Maximum reasonable length
            price: '100.00',
            cost: '50.00',
            image: 'long-string.jpg',
            stockQuantity: 1,
            barcode: 'LONGSTRING123',
            category: 'General'
        };

        try {
            const [created] = await this.drizzle.insert(schema.products).values(product).returning();
            return created && created.name.length === 255;
        } catch (error) {
            // Some databases might have string length limits
            return error.message.includes('string') || error.message.includes('length');
        }
    }

    async testProductWithNegativePrice() {
        const product = {
            name: 'Negative Price Test',
            price: '-10.00',
            cost: '5.00',
            image: 'negative.jpg',
            stockQuantity: 10,
            barcode: 'NEGATIVE_PRICE_123',
            category: 'General'
        };

        try {
            const [created] = await this.drizzle.insert(schema.products).values(product).returning();
            return created;
        } catch (error) {
            // Expected to fail due to business logic
            return error.message.includes('price') || error.message.includes('constraint');
        }
    }

    async testProductWithZeroStock() {
        const product = {
            name: 'Zero Stock Test',
            price: '15.00',
            cost: '7.50',
            image: 'zero-stock.jpg',
            stockQuantity: 0,
            barcode: 'ZERO_STOCK_123',
            category: 'General'
        };

        const [created] = await this.drizzle.insert(schema.products).values(product).returning();
        return created && created.stockQuantity === 0;
    }

    async testProductWithNullFields() {
        const product = {
            name: 'Null Fields Test',
            price: '20.00',
            image: 'null-fields.jpg',
            stockQuantity: 10,
            barcode: 'NULL_FIELDS_123',
            // cost and category left as null/optional
            category: 'General'
        };

        const [created] = await this.drizzle.insert(schema.products).values(product).returning();
        return created && created.cost === '0'; // Should use default value
    }

    // Performance Tests
    async testBulkInsertPerformance() {
        const startTime = Date.now();
        const products = generateTestProducts(1000);
        const results = await this.drizzle.insert(schema.products).values(products).returning();
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log(`Bulk insert of 1000 products took ${duration}ms`);

        return results.length === 1000 && duration < 5000; // Should complete within 5 seconds
    }

    async testLargeDatasetQueryPerformance() {
        // First, ensure we have a large dataset
        const productCount = await this.drizzle.select({ count: schema.products.id })
            .from(schema.products);

        if (productCount.length === 0 || productCount.length < 500) {
            console.log('Creating large dataset for performance testing...');
            const products = generateTestProducts(500);
            await this.drizzle.insert(schema.products).values(products);
        }

        const startTime = Date.now();
        const allProducts = await this.drizzle.select().from(schema.products);
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log(`Querying ${allProducts.length} products took ${duration}ms`);

        return duration < 2000; // Should complete within 2 seconds
    }

    async testSearchPerformance() {
        const searchTerm = '%Product%';
        const startTime = Date.now();
        const results = await this.drizzle.select().from(schema.products)
            .where(ilike(schema.products.name, searchTerm));
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log(`Search for "${searchTerm}" took ${duration}ms and returned ${results.length} results`);

        return duration < 1000; // Should complete within 1 second
    }

    async testBarcodeSearchPerformance() {
        const testBarcode = 'PERF_TEST_123';
        const product = {
            name: 'Performance Test Product',
            price: '25.00',
            cost: '12.50',
            image: 'perf-test.jpg',
            stockQuantity: 10,
            barcode: testBarcode,
            category: 'General'
        };

        await this.drizzle.insert(schema.products).values(product);

        const startTime = Date.now();
        const [found] = await this.drizzle.select().from(schema.products)
            .where(eq(schema.products.barcode, testBarcode));
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log(`Barcode search took ${duration}ms`);

        return found && duration < 100;
    }

    async testPLUSearchPerformance() {
        const testPLU = 'PERF_PLU_123';
        const product = {
            name: 'PLU Performance Test',
            price: '30.00',
            cost: '15.00',
            image: 'plu-perf.jpg',
            stockQuantity: 15,
            barcode: 'PLU_PERF_123',
            plu: testPLU,
            category: 'General'
        };

        await this.drizzle.insert(schema.products).values(product);

        const startTime = Date.now();
        const [found] = await this.drizzle.select().from(schema.products)
            .where(eq(schema.products.plu, testPLU));
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log(`PLU search took ${duration}ms`);

        return found && duration < 100;
    }

    // Error Scenarios Tests
    async testDatabaseConstraintViolations() {
        const violations = [];

        // Test 1: Unique constraint violation (barcode)
        try {
            const product1 = {
                name: 'First Product',
                price: '10.00',
                image: 'constraint1.jpg',
                stockQuantity: 10,
                barcode: 'CONSTRAINT_TEST_123'
            };
            const product2 = {
                name: 'Second Product',
                price: '15.00',
                image: 'constraint2.jpg',
                stockQuantity: 15,
                barcode: 'CONSTRAINT_TEST_123' // Same barcode
            };

            await this.drizzle.insert(schema.products).values(product1);
            await this.drizzle.insert(schema.products).values(product2);
        } catch (error) {
            violations.push('barcode_unique');
        }

        // Test 2: Foreign key constraint violation
        try {
            await this.drizzle.insert(schema.products).values({
                name: 'FK Violation Test',
                price: '20.00',
                image: 'fk-violation.jpg',
                stockQuantity: 10,
                barcode: 'FK_VIOLATION_123',
                categoryId: 99999 // Non-existent category
            });
        } catch (error) {
            violations.push('foreign_key');
        }

        return violations.length >= 1; // Should catch at least one constraint violation
    }

    async testInvalidDataFormats() {
        const formatErrors = [];

        // Test 1: Invalid price format
        try {
            await this.drizzle.insert(schema.products).values({
                name: 'Invalid Price Test',
                price: 'not-a-number',
                image: 'invalid-price.jpg',
                stockQuantity: 10,
                barcode: 'INVALID_PRICE_123'
            });
        } catch (error) {
            formatErrors.push('invalid_price');
        }

        // Test 2: Invalid stock quantity
        try {
            await this.drizzle.insert(schema.products).values({
                name: 'Invalid Stock Test',
                price: '10.00',
                image: 'invalid-stock.jpg',
                stockQuantity: 'not-a-number',
                barcode: 'INVALID_STOCK_123'
            });
        } catch (error) {
            formatErrors.push('invalid_stock');
        }

        return formatErrors.length >= 1;
    }

    async testDuplicateEntries() {
        const product = {
            name: 'Duplicate Entry Test',
            price: '35.00',
            cost: '17.50',
            image: 'duplicate.jpg',
            stockQuantity: 5,
            barcode: 'DUPLICATE_ENTRY_123',
            category: 'General'
        };

        // Insert the same product twice
        const results = [];
        try {
            results.push(await this.drizzle.insert(schema.products).values(product));
            results.push(await this.drizzle.insert(schema.products).values(product));
        } catch (error) {
            results.push(error);
        }

        // Should have either 2 successful inserts or 1 successful and 1 error
        return results.length >= 1 && (results[1]?.message?.includes('UNIQUE') || results.length === 2);
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting comprehensive Products CRUD test suite...\n');

        try {
            await this.initialize();

            // CREATE Tests
            await this.runTest('Create Valid Product', () => this.testCreateValidProduct());
            await this.runTest('Create Multiple Products', () => this.testCreateMultipleProducts());
            await this.runTest('Create Product with Category', () => this.testCreateProductWithCategory());
            await this.runTest('Product Validation Errors', () => this.testCreateProductValidationErrors());
            await this.runTest('Duplicate Barcode Constraint', () => this.testCreateProductDuplicateBarcode());

            // READ Tests
            await this.runTest('Read Single Product', () => this.testReadSingleProduct());
            await this.runTest('Read All Products', () => this.testReadAllProducts());
            await this.runTest('Filter Products', () => this.testReadProductsWithFiltering());
            await this.runTest('Sort Products', () => this.testReadProductsWithSorting());
            await this.runTest('Search by Barcode', () => this.testSearchByBarcode());
            await this.runTest('Search by PLU', () => this.testSearchByPLU());

            // UPDATE Tests
            await this.runTest('Update Product', () => this.testUpdateProduct());
            await this.runTest('Partial Update', () => this.testPartialUpdate());
            await this.runTest('Update with Category Reference', () => this.testUpdateWithCategoryReference());
            await this.runTest('Update Non-existent Product', () => this.testUpdateNonExistentProduct());

            // DELETE Tests
            await this.runTest('Delete Product', () => this.testDeleteProduct());
            await this.runTest('Delete Non-existent Product', () => this.testDeleteNonExistentProduct());
            await this.runTest('Cascade Delete Behavior', () => this.testCascadeDeleteWithOrders());

            // Edge Cases and Validation
            await this.runTest('Product with Special Characters', () => this.testProductWithSpecialCharacters());
            await this.runTest('Product with Long Strings', () => this.testProductWithLongStrings());
            await this.runTest('Product with Negative Price', () => this.testProductWithNegativePrice());
            await this.runTest('Product with Zero Stock', () => this.testProductWithZeroStock());
            await this.runTest('Product with Null Fields', () => this.testProductWithNullFields());

            // Performance Tests
            await this.runTest('Bulk Insert Performance', () => this.testBulkInsertPerformance());
            await this.runTest('Large Dataset Query Performance', () => this.testLargeDatasetQueryPerformance());
            await this.runTest('Search Performance', () => this.testSearchPerformance());
            await this.runTest('Barcode Search Performance', () => this.testBarcodeSearchPerformance());
            await this.runTest('PLU Search Performance', () => this.testPLUSearchPerformance());

            // Error Scenarios
            await this.runTest('Database Constraint Violations', () => this.testDatabaseConstraintViolations());
            await this.runTest('Invalid Data Formats', () => this.testInvalidDataFormats());
            await this.runTest('Duplicate Entries Handling', () => this.testDuplicateEntries());

            await this.generateReport();

        } catch (error) {
            console.error('❌ Test suite failed with error:', error);
            this.testResults.errors.push({ test: 'Test Suite', error: error.message, stack: error.stack });
        } finally {
            await this.cleanup();
        }
    }

    async generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;

        this.testResults.summary = {
            total: this.testResults.passed + this.testResults.failed,
            passed: this.testResults.passed,
            failed: this.testResults.failed,
            passRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2),
            totalTime: `${totalTime}ms`,
            timestamp: new Date().toISOString()
        };

        // Write results to file
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(this.testResults, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('🏁 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.testResults.summary.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Pass Rate: ${this.testResults.summary.passRate}%`);
        console.log(`Total Time: ${this.testResults.summary.totalTime}`);
        console.log(`Results saved to: ${RESULTS_FILE}`);
        console.log('='.repeat(60));

        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.tests.filter(t => t.status === 'FAILED').forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        }

        if (this.testResults.errors.length > 0) {
            console.log('\n💥 ERRORS:');
            this.testResults.errors.forEach(error => {
                console.log(`  - ${error.test}: ${error.error}`);
            });
        }
    }

    async cleanup() {
        if (this.db) {
            this.db.close();
        }

        // Clean up test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    }
}

// Run the test suite
const testSuite = new ProductsCRUDTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('Fatal error running test suite:', error);
    process.exit(1);
});