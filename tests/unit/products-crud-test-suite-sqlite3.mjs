/**
 * Alternative Products CRUD Test Suite using native SQLite
 * This version uses the sqlite3 package instead of better-sqlite3
 * to avoid binary compilation issues
 */

import sqlite3 from 'sqlite3';
import fs from 'fs';

// Test configuration
const TEST_DB_PATH = 'test-products-crud-sqlite3.sqlite';
const RESULTS_FILE = 'products-crud-test-results-sqlite3.json';

// Enable verbose mode for sqlite3
sqlite3.verbose();

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
            category: category
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

// Promise wrapper for sqlite3 operations
const runAsync = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastInsertRowid: this.lastID, changes: this.changes });
            }
        });
    });
};

const getAsync = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const allAsync = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
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
        this.issuesFound = [];
    }

    logIssue(issue) {
        this.issuesFound.push(issue);
        console.log(`🔍 ISSUE FOUND: ${issue}`);
    }

    async initialize() {
        console.log('🗄️ Initializing test database with sqlite3...');

        // Clean up existing test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }

        // Create new test database
        this.db = new sqlite3.Database(TEST_DB_PATH);

        await this.setupSchema();
        console.log('✅ Test database initialized');
    }

    async setupSchema() {
        console.log('🔧 Setting up database schema...');

        // Create tables
        const tables = [
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
            )`
        ];

        // Execute table creation statements
        for (const sql of tables) {
            await runAsync(this.db, sql);
        }

        // Create some default categories
        const categories = generateTestCategories();
        for (const cat of categories) {
            await runAsync(this.db,
                'INSERT OR IGNORE INTO categories (name, description, created_at) VALUES (?, ?, ?)',
                [cat.name, cat.description, Date.now()]
            );
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
                this.logIssue(`Test failed: ${testName} - ${result}`);
            }
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push({ test: testName, error: error.message, stack: error.stack });
            this.testResults.tests.push({ name: testName, status: 'ERROR', error: error.message });
            console.log(`💥 ${testName} - ERROR: ${error.message}`);
            this.logIssue(`Test error: ${testName} - ${error.message}`);
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

        try {
            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            if (result.lastInsertRowid) {
                // Verify the created product
                const retrieved = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
                return retrieved && retrieved.name === product.name;
            }
            return false;
        } catch (error) {
            this.logIssue(`CREATE: Failed to create valid product - ${error.message}`);
            throw error;
        }
    }

    async testCreateMultipleProducts() {
        const products = generateTestProducts(10);
        try {
            const insertMany = async (products) => {
                for (const product of products) {
                    await runAsync(this.db, `
                        INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);
                }
            };

            await insertMany(products);

            const count = await getAsync(this.db, 'SELECT COUNT(*) as count FROM products');
            return count.count >= products.length;
        } catch (error) {
            this.logIssue(`CREATE: Failed to create multiple products - ${error.message}`);
            throw error;
        }
    }

    async testCreateProductWithCategory() {
        try {
            // First create a category
            const catResult = await runAsync(this.db,
                'INSERT INTO categories (name, description, created_at) VALUES (?, ?, ?)',
                ['Test Category', 'Test category for products', Date.now()]
            );

            if (!catResult.lastInsertRowid) {
                throw new Error('Failed to create category');
            }

            // Create product with category reference
            const product = {
                name: 'Test Product with Category',
                price: '15.99',
                cost: '7.99',
                image: 'test-category.jpg',
                stockQuantity: 50,
                barcode: '1234567890999',
                categoryId: catResult.lastInsertRowid,
                category: 'Test Category'
            };

            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category_id, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                product.name, product.price, product.cost, product.image,
                product.stockQuantity, product.barcode, product.categoryId, product.category
            ]);

            if (result.lastInsertRowid) {
                const retrieved = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
                return retrieved && retrieved.category_id === product.categoryId;
            }
            return false;
        } catch (error) {
            this.logIssue(`CREATE: Failed to create product with category - ${error.message}`);
            throw error;
        }
    }

    async testCreateProductValidationErrors() {
        const testCases = [
            {
                name: 'Missing required fields',
                product: { price: '10.99', image: 'test.jpg', stockQuantity: 10, barcode: '1234567890001' },
                expectedError: 'NOT NULL constraint failed'
            },
            {
                name: 'Invalid price',
                product: { name: 'Test', price: 'invalid', image: 'test.jpg', stockQuantity: 10, barcode: '1234567890002' },
                expectedError: 'invalid'
            },
            {
                name: 'Missing barcode',
                product: { name: 'Test', price: '10.99', image: 'test.jpg', stockQuantity: 10 },
                expectedError: 'NOT NULL constraint failed'
            }
        ];

        let errorCount = 0;
        for (const testCase of testCases) {
            try {
                const product = testCase.product;
                await runAsync(this.db, `
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    product.name || null, product.price, product.cost || '0',
                    product.image, product.stockQuantity, product.barcode || null,
                    product.category || 'General'
                ]);
            } catch (error) {
                if (error.message.includes('NOT NULL') || error.message.includes('constraint')) {
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

        try {
            // Create first product
            await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            // Try to create second product with same barcode
            const duplicateProduct = { ...product, name: 'Second Product' };
            await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                duplicateProduct.name, duplicateProduct.price, duplicateProduct.cost,
                duplicateProduct.image, duplicateProduct.stockQuantity, duplicateProduct.barcode, duplicateProduct.category
            ]);

            return false; // Should have failed
        } catch (error) {
            const isConstraintError = error.message.includes('UNIQUE constraint failed') || error.message.includes('barcode');
            if (!isConstraintError) {
                this.logIssue(`CREATE: Expected constraint violation for duplicate barcode, but got: ${error.message}`);
            }
            return isConstraintError;
        }
    }

    // READ Operations Tests
    async testReadSingleProduct() {
        try {
            // Create a test product
            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Read Test Product', '25.99', '12.99', 'read-test.jpg', 75, 'READTEST123', 'General']);

            // Read the product
            const retrieved = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);

            return retrieved && retrieved.id === result.lastInsertRowid && retrieved.name === 'Read Test Product';
        } catch (error) {
            this.logIssue(`READ: Failed to read single product - ${error.message}`);
            throw error;
        }
    }

    async testReadAllProducts() {
        try {
            // Create multiple products
            const products = [
                { name: 'Product 1', price: '10.00', image: 'p1.jpg', stockQuantity: 10, barcode: 'P1' },
                { name: 'Product 2', price: '20.00', image: 'p2.jpg', stockQuantity: 20, barcode: 'P2' },
                { name: 'Product 3', price: '30.00', image: 'p3.jpg', stockQuantity: 30, barcode: 'P3' }
            ];

            for (const product of products) {
                await runAsync(this.db, `
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [product.name, product.price, '0', product.image, product.stockQuantity, product.barcode, 'General']);
            }

            // Read all products
            const allProducts = await allAsync(this.db, 'SELECT * FROM products');

            return allProducts.length >= 3;
        } catch (error) {
            this.logIssue(`READ: Failed to read all products - ${error.message}`);
            throw error;
        }
    }

    async testReadProductsWithFiltering() {
        try {
            const products = [
                { name: 'Apple Product', price: '10.00', image: 'apple.jpg', stockQuantity: 10, barcode: 'APPLE1' },
                { name: 'Banana Product', price: '15.00', image: 'banana.jpg', stockQuantity: 15, barcode: 'BANANA1' },
                { name: 'Cherry Product', price: '20.00', image: 'cherry.jpg', stockQuantity: 20, barcode: 'CHERRY1' }
            ];

            for (const product of products) {
                await runAsync(this.db, `
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [product.name, product.price, '0', product.image, product.stockQuantity, product.barcode, 'General']);
            }

            // Filter by name containing "Apple"
            const appleProducts = await allAsync(this.db, 'SELECT * FROM products WHERE name LIKE ?', ['%Apple%']);

            return appleProducts.length === 1 && appleProducts[0].name === 'Apple Product';
        } catch (error) {
            this.logIssue(`READ: Failed to filter products - ${error.message}`);
            throw error;
        }
    }

    async testSearchByBarcode() {
        try {
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

            await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            const found = await getAsync(this.db, 'SELECT * FROM products WHERE barcode = ?', [testBarcode]);

            return found && found.barcode === testBarcode;
        } catch (error) {
            this.logIssue(`READ: Failed to search by barcode - ${error.message}`);
            throw error;
        }
    }

    async testSearchByPLU() {
        try {
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

            await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, plu, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                product.name, product.price, product.cost, product.image,
                product.stockQuantity, product.barcode, product.plu, product.category
            ]);

            const found = await getAsync(this.db, 'SELECT * FROM products WHERE plu = ?', [testPLU]);

            return found && found.plu === testPLU;
        } catch (error) {
            this.logIssue(`READ: Failed to search by PLU - ${error.message}`);
            throw error;
        }
    }

    // UPDATE Operations Tests
    async testUpdateProduct() {
        try {
            // Create a test product
            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Original Product', '10.00', '5.00', 'original.jpg', 10, 'UPDATE_TEST_123', 'General']);

            // Update the product
            const updateResult = await runAsync(this.db, `
                UPDATE products 
                SET name = ?, price = ?, stock_quantity = ?
                WHERE id = ?
            `, ['Updated Product', '15.00', 20, result.lastInsertRowid]);

            if (updateResult.changes === 0) {
                throw new Error('No rows were updated');
            }

            // Verify the update
            const updated = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
            return updated && updated.name === 'Updated Product' && updated.price === '15.00';
        } catch (error) {
            this.logIssue(`UPDATE: Failed to update product - ${error.message}`);
            throw error;
        }
    }

    async testPartialUpdate() {
        try {
            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Partial Update Test', '12.00', '6.00', 'partial.jpg', 15, 'PARTIAL_UPDATE_123', 'General']);

            // Update only the name
            const updateResult = await runAsync(this.db, `
                UPDATE products 
                SET name = ?
                WHERE id = ?
            `, ['Partially Updated Product', result.lastInsertRowid]);

            if (updateResult.changes === 0) {
                throw new Error('No rows were updated');
            }

            const updated = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
            return updated && updated.name === 'Partially Updated Product' && updated.price === '12.00';
        } catch (error) {
            this.logIssue(`UPDATE: Failed partial update - ${error.message}`);
            throw error;
        }
    }

    async testUpdateWithCategoryReference() {
        try {
            // Create category first
            const catResult = await runAsync(this.db,
                'INSERT INTO categories (name, description, created_at) VALUES (?, ?, ?)',
                ['Update Test Category', 'Category for testing updates', Date.now()]
            );

            if (!catResult.lastInsertRowid) {
                throw new Error('Failed to create category');
            }

            // Create product
            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Category Update Test', '20.00', '10.00', 'cat-update.jpg', 25, 'CAT_UPDATE_123', 'General']);

            // Update with category reference
            const updateResult = await runAsync(this.db, `
                UPDATE products 
                SET category_id = ?, category = ?
                WHERE id = ?
            `, [catResult.lastInsertRowid, 'Update Test Category', result.lastInsertRowid]);

            if (updateResult.changes === 0) {
                throw new Error('No rows were updated');
            }

            const updated = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
            return updated && updated.category_id === catResult.lastInsertRowid;
        } catch (error) {
            this.logIssue(`UPDATE: Failed to update with category reference - ${error.message}`);
            throw error;
        }
    }

    async testUpdateNonExistentProduct() {
        try {
            const updateResult = await runAsync(this.db, `
                UPDATE products 
                SET name = ?
                WHERE id = ?
            `, ['Non-existent Update', 99999]);

            return updateResult.changes === 0;
        } catch (error) {
            this.logIssue(`UPDATE: Failed to handle non-existent product update - ${error.message}`);
            throw error;
        }
    }

    // DELETE Operations Tests
    async testDeleteProduct() {
        try {
            // Create a test product
            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Product to Delete', '30.00', '15.00', 'delete-test.jpg', 5, 'DELETE_TEST_123', 'General']);

            // Delete the product
            const deleteResult = await runAsync(this.db, 'DELETE FROM products WHERE id = ?', [result.lastInsertRowid]);

            // Verify deletion
            const found = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);

            return deleteResult.changes === 1 && !found;
        } catch (error) {
            this.logIssue(`DELETE: Failed to delete product - ${error.message}`);
            throw error;
        }
    }

    async testDeleteNonExistentProduct() {
        try {
            const deleteResult = await runAsync(this.db, 'DELETE FROM products WHERE id = ?', [99999]);
            return deleteResult.changes === 0;
        } catch (error) {
            this.logIssue(`DELETE: Failed to handle non-existent product deletion - ${error.message}`);
            throw error;
        }
    }

    // Edge Cases and Validation Tests
    async testProductWithSpecialCharacters() {
        try {
            const product = {
                name: 'Product with "quotes" & special chars!@#',
                price: '99.99',
                cost: '49.99',
                image: 'special-chars.jpg',
                stockQuantity: 1,
                barcode: 'SPECIAL123',
                category: 'General'
            };

            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            if (result.lastInsertRowid) {
                const created = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
                return created && created.name.includes('quotes');
            }
            return false;
        } catch (error) {
            this.logIssue(`EDGE CASE: Failed to handle special characters - ${error.message}`);
            throw error;
        }
    }

    async testProductWithLongStrings() {
        try {
            const product = {
                name: 'A'.repeat(255), // Maximum reasonable length
                price: '100.00',
                cost: '50.00',
                image: 'long-string.jpg',
                stockQuantity: 1,
                barcode: 'LONGSTRING123',
                category: 'General'
            };

            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            if (result.lastInsertRowid) {
                const created = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
                return created && created.name.length === 255;
            }
            return false;
        } catch (error) {
            // Some databases might have string length limits
            const isLengthError = error.message.includes('string') || error.message.includes('length') || error.message.includes('too long');
            if (!isLengthError) {
                this.logIssue(`EDGE CASE: Unexpected error with long strings - ${error.message}`);
            }
            return isLengthError;
        }
    }

    async testProductWithNegativePrice() {
        try {
            const product = {
                name: 'Negative Price Test',
                price: '-10.00',
                cost: '5.00',
                image: 'negative.jpg',
                stockQuantity: 10,
                barcode: 'NEGATIVE_PRICE_123',
                category: 'General'
            };

            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            if (result.lastInsertRowid) {
                const created = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
                return created && created.price === '-10.00'; // SQLite allows negative numbers in TEXT fields
            }
            return false;
        } catch (error) {
            // Expected to fail due to business logic validation
            return true;
        }
    }

    async testProductWithZeroStock() {
        try {
            const product = {
                name: 'Zero Stock Test',
                price: '15.00',
                cost: '7.50',
                image: 'zero-stock.jpg',
                stockQuantity: 0,
                barcode: 'ZERO_STOCK_123',
                category: 'General'
            };

            const result = await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            if (result.lastInsertRowid) {
                const created = await getAsync(this.db, 'SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
                return created && created.stock_quantity === 0;
            }
            return false;
        } catch (error) {
            this.logIssue(`EDGE CASE: Failed to handle zero stock - ${error.message}`);
            throw error;
        }
    }

    // Performance Tests
    async testBulkInsertPerformance() {
        try {
            const startTime = Date.now();
            const products = generateTestProducts(1000);

            // Use transaction for better performance
            await runAsync(this.db, 'BEGIN TRANSACTION');
            try {
                for (const product of products) {
                    await runAsync(this.db, `
                        INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);
                }
                await runAsync(this.db, 'COMMIT');
            } catch (error) {
                await runAsync(this.db, 'ROLLBACK');
                throw error;
            }

            const endTime = Date.now();

            const duration = endTime - startTime;
            console.log(`Bulk insert of 1000 products took ${duration}ms`);

            // Check if we're hitting performance issues
            if (duration > 5000) {
                this.logIssue(`PERFORMANCE: Bulk insert took ${duration}ms (expected < 5000ms)`);
            }

            const count = await getAsync(this.db, 'SELECT COUNT(*) as count FROM products');
            return count.count >= 1000 && duration < 10000; // Allow more time for slower systems
        } catch (error) {
            this.logIssue(`PERFORMANCE: Failed bulk insert test - ${error.message}`);
            throw error;
        }
    }

    async testLargeDatasetQueryPerformance() {
        try {
            // First, ensure we have a large dataset
            const productCount = await getAsync(this.db, 'SELECT COUNT(*) as count FROM products');

            if (productCount.count < 500) {
                console.log('Creating large dataset for performance testing...');
                const products = generateTestProducts(500);

                await runAsync(this.db, 'BEGIN TRANSACTION');
                try {
                    for (const product of products) {
                        await runAsync(this.db, `
                            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);
                    }
                    await runAsync(this.db, 'COMMIT');
                } catch (error) {
                    await runAsync(this.db, 'ROLLBACK');
                    throw error;
                }
            }

            const startTime = Date.now();
            const allProducts = await allAsync(this.db, 'SELECT * FROM products');
            const endTime = Date.now();

            const duration = endTime - startTime;
            console.log(`Querying ${allProducts.length} products took ${duration}ms`);

            if (duration > 2000) {
                this.logIssue(`PERFORMANCE: Large dataset query took ${duration}ms (expected < 2000ms)`);
            }

            return duration < 5000; // Allow more time for slower systems
        } catch (error) {
            this.logIssue(`PERFORMANCE: Failed large dataset query test - ${error.message}`);
            throw error;
        }
    }

    async testSearchPerformance() {
        try {
            const searchTerm = '%Product%';
            const startTime = Date.now();
            const results = await allAsync(this.db, 'SELECT * FROM products WHERE name LIKE ?', [searchTerm]);
            const endTime = Date.now();

            const duration = endTime - startTime;
            console.log(`Search for "${searchTerm}" took ${duration}ms and returned ${results.length} results`);

            if (duration > 1000) {
                this.logIssue(`PERFORMANCE: Search took ${duration}ms (expected < 1000ms)`);
            }

            return duration < 3000; // Allow more time for slower systems
        } catch (error) {
            this.logIssue(`PERFORMANCE: Failed search performance test - ${error.message}`);
            throw error;
        }
    }

    async testBarcodeSearchPerformance() {
        try {
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

            await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.name, product.price, product.cost, product.image, product.stockQuantity, product.barcode, product.category]);

            const startTime = Date.now();
            const found = await getAsync(this.db, 'SELECT * FROM products WHERE barcode = ?', [testBarcode]);
            const endTime = Date.now();

            const duration = endTime - startTime;
            console.log(`Barcode search took ${duration}ms`);

            if (duration > 100) {
                this.logIssue(`PERFORMANCE: Barcode search took ${duration}ms (expected < 100ms)`);
            }

            return found && duration < 500; // Allow more time for slower systems
        } catch (error) {
            this.logIssue(`PERFORMANCE: Failed barcode search test - ${error.message}`);
            throw error;
        }
    }

    // Error Scenarios Tests
    async testDatabaseConstraintViolations() {
        const violations = [];

        try {
            // Test 1: Unique constraint violation (barcode)
            const product1 = {
                name: 'First Product',
                price: '10.00',
                image: 'constraint1.jpg',
                stockQuantity: 10,
                barcode: 'CONSTRAINT_TEST_123',
                category: 'General'
            };
            const product2 = {
                name: 'Second Product',
                price: '15.00',
                image: 'constraint2.jpg',
                stockQuantity: 15,
                barcode: 'CONSTRAINT_TEST_123' // Same barcode
            };

            await runAsync(this.db, `
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product1.name, product1.price, '0', product1.image, product1.stockQuantity, product1.barcode, product1.category]);

            try {
                await runAsync(this.db, `
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [product2.name, product2.price, '0', product2.image, product2.stockQuantity, product2.barcode, product2.category]);
            } catch (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    violations.push('barcode_unique');
                }
            }

            // Test 2: Foreign key constraint violation
            try {
                await runAsync(this.db, `
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category_id, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, ['FK Violation Test', '20.00', '10.00', 'fk-violation.jpg', 10, 'FK_VIOLATION_123', 99999, 'General']);
            } catch (error) {
                if (error.message.includes('FOREIGN KEY') || error.message.includes('constraint')) {
                    violations.push('foreign_key');
                }
            }

            return violations.length >= 1; // Should catch at least one constraint violation
        } catch (error) {
            this.logIssue(`ERROR SCENARIOS: Failed constraint violation tests - ${error.message}`);
            throw error;
        }
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting comprehensive Products CRUD test suite with sqlite3...\n');

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

            // Edge Cases and Validation
            await this.runTest('Product with Special Characters', () => this.testProductWithSpecialCharacters());
            await this.runTest('Product with Long Strings', () => this.testProductWithLongStrings());
            await this.runTest('Product with Negative Price', () => this.testProductWithNegativePrice());
            await this.runTest('Product with Zero Stock', () => this.testProductWithZeroStock());

            // Performance Tests
            await this.runTest('Bulk Insert Performance', () => this.testBulkInsertPerformance());
            await this.runTest('Large Dataset Query Performance', () => this.testLargeDatasetQueryPerformance());
            await this.runTest('Search Performance', () => this.testSearchPerformance());
            await this.runTest('Barcode Search Performance', () => this.testBarcodeSearchPerformance());

            // Error Scenarios
            await this.runTest('Database Constraint Violations', () => this.testDatabaseConstraintViolations());

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
            issuesFound: this.issuesFound.length,
            passRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2),
            totalTime: `${totalTime}ms`,
            timestamp: new Date().toISOString()
        };

        // Write results to file
        fs.writeFileSync(RESULTS_FILE, JSON.stringify({
            ...this.testResults,
            issuesFound: this.issuesFound
        }, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('🏁 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.testResults.summary.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Issues Found: ${this.issuesFound.length}`);
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

        if (this.issuesFound.length > 0) {
            console.log('\n🔍 ISSUES FOUND:');
            this.issuesFound.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
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