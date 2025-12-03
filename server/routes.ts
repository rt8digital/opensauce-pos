import express from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from './db.ts';
import * as schema from '../shared/schema.ts';

const router = express.Router();

// Orders API
router.get('/api/orders', async (req, res) => {
    try {
        const orders = await db
            .select({
                id: schema.orders.id,
                customerId: schema.orders.customerId,
                userId: schema.orders.userId,
                items: schema.orders.items,
                total: schema.orders.total,
                paymentMethod: schema.orders.paymentMethod,
                createdAt: schema.orders.createdAt,
                customer: {
                    id: schema.customers.id,
                    name: schema.customers.name,
                    email: schema.customers.email,
                    phone: schema.customers.phone,
                },
                user: {
                    id: schema.users.id,
                    name: schema.users.name,
                },
            })
            .from(schema.orders)
            .leftJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
            .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
            .orderBy(desc(schema.orders.createdAt))
            .limit(100);

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

router.post('/api/orders', async (req, res) => {
    try {
        const { customerId, userId, items, total, paymentMethod } = req.body;

        const [order] = await db
            .insert(schema.orders)
            .values({
                customerId: customerId || null,
                userId: userId || null,
                items: JSON.stringify(items),
                total: total.toString(),
                paymentMethod,
            })
            .returning();

        // Update customer loyalty points and total spent if customer exists
        if (customerId) {
            const [customer] = await db
                .select()
                .from(schema.customers)
                .where(eq(schema.customers.id, customerId));

            if (customer) {
                const currentTotalSpent = parseFloat(customer.totalSpent || '0');
                const orderTotal = parseFloat(total);
                const newTotalSpent = currentTotalSpent + orderTotal;
                const loyaltyPoints = Math.floor(newTotalSpent / 10); // 1 point per R10 spent

                await db
                    .update(schema.customers)
                    .set({
                        totalSpent: newTotalSpent.toString(),
                        loyaltyPoints,
                    })
                    .where(eq(schema.customers.id, customerId));
            }
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Products API
router.get('/api/products', async (req, res) => {
    try {
        const products = await db
            .select()
            .from(schema.products)
            .orderBy(schema.products.name);

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.post('/api/products', async (req, res) => {
    try {
        const { name, price, image, stockQuantity, barcode, plu, category } = req.body;

        const [product] = await db
            .insert(schema.products)
            .values({
                name,
                price: price.toString(),
                image,
                stockQuantity,
                barcode,
                plu,
                category,
            })
            .returning();

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Barcode already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
});

router.patch('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Convert price to string if present
        if (updates.price) {
            updates.price = updates.price.toString();
        }

        const [product] = await db
            .update(schema.products)
            .set(updates)
            .where(eq(schema.products.id, parseInt(id)))
            .returning();

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Barcode already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update product' });
        }
    }
});

router.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db
            .delete(schema.products)
            .where(eq(schema.products.id, parseInt(id)));

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Customers API
router.get('/api/customers', async (req, res) => {
    try {
        const customers = await db
            .select()
            .from(schema.customers)
            .orderBy(schema.customers.name);

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.post('/api/customers', async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const [customer] = await db
            .insert(schema.customers)
            .values({
                name,
                email,
                phone,
            })
            .returning();

        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

router.patch('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const [customer] = await db
            .update(schema.customers)
            .set(updates)
            .where(eq(schema.customers.id, parseInt(id)))
            .returning();

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

router.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db
            .delete(schema.customers)
            .where(eq(schema.customers.id, parseInt(id)));

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Discounts API
router.get('/api/discounts', async (req, res) => {
    try {
        const discounts = await db
            .select()
            .from(schema.discounts)
            .where(eq(schema.discounts.active, true))
            .orderBy(schema.discounts.name);

        res.json(discounts);
    } catch (error) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({ error: 'Failed to fetch discounts' });
    }
});

router.post('/api/discounts', async (req, res) => {
    try {
        const { name, type, value } = req.body;

        const [discount] = await db
            .insert(schema.discounts)
            .values({
                name,
                type,
                value: value.toString(),
            })
            .returning();

        res.status(201).json(discount);
    } catch (error) {
        console.error('Error creating discount:', error);
        res.status(500).json({ error: 'Failed to create discount' });
    }
});

router.patch('/api/discounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Convert value to string if present
        if (updates.value) {
            updates.value = updates.value.toString();
        }

        const [discount] = await db
            .update(schema.discounts)
            .set(updates)
            .where(eq(schema.discounts.id, parseInt(id)))
            .returning();

        if (!discount) {
            return res.status(404).json({ error: 'Discount not found' });
        }

        res.json(discount);
    } catch (error) {
        console.error('Error updating discount:', error);
        res.status(500).json({ error: 'Failed to update discount' });
    }
});

router.delete('/api/discounts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db
            .delete(schema.discounts)
            .where(eq(schema.discounts.id, parseInt(id)));

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Discount not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting discount:', error);
        res.status(500).json({ error: 'Failed to delete discount' });
    }
});

// Settings API
router.get('/api/settings', async (req, res) => {
    try {
        const settings = await db
            .select()
            .from(schema.settings)
            .limit(1);

        if (settings.length === 0) {
            return res.status(404).json({ error: 'Settings not found' });
        }

        res.json(settings[0]);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.patch('/api/settings', async (req, res) => {
    try {
        const updates = req.body;

        // Update the single settings record (assuming only one exists)
        const [settings] = await db
            .update(schema.settings)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .returning();

        if (!settings) {
            return res.status(404).json({ error: 'Settings not found' });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Users API (for authentication)
router.get('/api/users', async (req, res) => {
    try {
        const users = await db
            .select({
                id: schema.users.id,
                name: schema.users.name,
                role: schema.users.role,
                isOwner: schema.users.isOwner,
                createdAt: schema.users.createdAt,
                lastLogin: schema.users.lastLogin,
            })
            .from(schema.users)
            .orderBy(schema.users.name);

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/api/auth/login', async (req, res) => {
    try {
        const { pin } = req.body;

        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.pin, pin))
            .limit(1);

        if (!user) {
            return res.status(401).json({ error: 'Invalid PIN' });
        }

        // Update last login
        await db
            .update(schema.users)
            .set({ lastLogin: new Date() })
            .where(eq(schema.users.id, user.id));

        // Return user without PIN
        const { pin: _, ...userWithoutPin } = user;
        res.json(userWithoutPin);
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

export default router;
