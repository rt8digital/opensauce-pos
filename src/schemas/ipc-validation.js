"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_CONFIG = exports.ScaleConnectSchema = exports.CustomerDisplaySchema = exports.CashDrawerSchema = exports.PrintReceiptSchema = exports.PrinterTestSchema = exports.SaveFileDialogSchema = exports.OpenFileDialogSchema = exports.SettingsUpdateSchema = exports.CategoryIdSchema = exports.CategorySchema = exports.UserUpdateSchema = exports.UserPinSchema = exports.UserIdSchema = exports.UserSchema = exports.CustomerUpdateSchema = exports.CustomerSearchSchema = exports.CustomerIdSchema = exports.CustomerSchema = exports.DateRangeSchema = exports.OrderIdSchema = exports.OrderSchema = exports.ProductBarcodeSchema = exports.ProductUpdateSchema = exports.ProductIdSchema = exports.ProductSchema = void 0;
exports.validateIPCInput = validateIPCInput;
const zod_1 = require("zod");
// Product schemas
exports.ProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    cost: zod_1.z.number().nonnegative().optional(),
    sku: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    categoryId: zod_1.z.number().optional(),
    stock: zod_1.z.number().int().nonnegative().default(0),
    active: zod_1.z.boolean().default(true),
    taxRate: zod_1.z.number().min(0).max(1).default(0),
});
exports.ProductIdSchema = zod_1.z.object({
    id: zod_1.z.number().positive(),
});
exports.ProductUpdateSchema = exports.ProductIdSchema.extend({
    updates: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive().optional(),
        cost: zod_1.z.number().nonnegative().optional(),
        sku: zod_1.z.string().optional(),
        barcode: zod_1.z.string().optional(),
        categoryId: zod_1.z.number().optional(),
        stock: zod_1.z.number().int().nonnegative().optional(),
        active: zod_1.z.boolean().optional(),
        taxRate: zod_1.z.number().min(0).max(1).optional(),
    }).partial(),
});
exports.ProductBarcodeSchema = zod_1.z.object({
    barcode: zod_1.z.string().min(1),
});
// Order schemas
exports.OrderSchema = zod_1.z.object({
    customerId: zod_1.z.number().optional(),
    userId: zod_1.z.number().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.number().positive(),
        quantity: zod_1.z.number().positive(),
        price: zod_1.z.number().positive(),
        discount: zod_1.z.number().nonnegative().optional(),
    })),
    discount: zod_1.z.object({
        type: zod_1.z.enum(['percentage', 'fixed']).optional(),
        value: zod_1.z.number().nonnegative().optional(),
    }).optional(),
    taxRate: zod_1.z.number().min(0).max(1).default(0),
    payment: zod_1.z.object({
        method: zod_1.z.enum(['cash', 'card', 'transfer']),
        amount: zod_1.z.number().positive(),
        reference: zod_1.z.string().optional(),
    }),
});
exports.OrderIdSchema = zod_1.z.object({
    id: zod_1.z.number().positive(),
});
exports.DateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
// Customer schemas
exports.CustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    loyaltyPoints: zod_1.z.number().int().nonnegative().default(0),
});
exports.CustomerIdSchema = zod_1.z.object({
    id: zod_1.z.number().positive(),
});
exports.CustomerSearchSchema = zod_1.z.object({
    searchTerm: zod_1.z.string().min(1),
    limit: zod_1.z.number().int().positive().max(100).default(50),
});
exports.CustomerUpdateSchema = exports.CustomerIdSchema.extend({
    updates: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        loyaltyPoints: zod_1.z.number().int().nonnegative().optional(),
    }).partial(),
});
// User schemas
exports.UserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    pin: zod_1.z.string().length(4), // Assuming 4-digit PIN
    role: zod_1.z.enum(['admin', 'manager', 'cashier']).default('cashier'),
    active: zod_1.z.boolean().default(true),
});
exports.UserIdSchema = zod_1.z.object({
    id: zod_1.z.number().positive(),
});
exports.UserPinSchema = zod_1.z.object({
    pin: zod_1.z.string().length(4),
});
exports.UserUpdateSchema = exports.UserIdSchema.extend({
    updates: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        pin: zod_1.z.string().length(4).optional(),
        role: zod_1.z.enum(['admin', 'manager', 'cashier']).optional(),
        active: zod_1.z.boolean().optional(),
    }).partial(),
});
// Category schemas
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // Hex color
});
exports.CategoryIdSchema = zod_1.z.object({
    id: zod_1.z.number().positive(),
});
// Settings schemas
exports.SettingsUpdateSchema = zod_1.z.object({
    updates: zod_1.z.record(zod_1.z.string(), zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.number(),
        zod_1.z.boolean(),
        zod_1.z.null()
    ])),
});
// File dialog schemas
exports.OpenFileDialogSchema = zod_1.z.object({
    options: zod_1.z.object({
        title: zod_1.z.string().optional(),
        defaultPath: zod_1.z.string().optional(),
        buttonLabel: zod_1.z.string().optional(),
        filters: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            extensions: zod_1.z.array(zod_1.z.string()),
        })).optional(),
        properties: zod_1.z.array(zod_1.z.enum([
            'openFile', 'openDirectory', 'multiSelections',
            'showHiddenFiles', 'createDirectory', 'promptToCreate'
        ])).optional(),
    }).optional(),
});
exports.SaveFileDialogSchema = exports.OpenFileDialogSchema;
// Peripheral schemas
exports.PrinterTestSchema = zod_1.z.object({
    type: zod_1.z.enum(['network', 'usb', 'bluetooth']),
    address: zod_1.z.string(),
});
exports.PrintReceiptSchema = zod_1.z.object({
    order: zod_1.z.any(), // Complex order object - validated separately
    silent: zod_1.z.boolean().default(true),
});
exports.CashDrawerSchema = zod_1.z.object({
    port: zod_1.z.string(),
    pulseDuration: zod_1.z.number().int().min(100).max(500).default(200),
});
exports.CustomerDisplaySchema = zod_1.z.object({
    content: zod_1.z.any(),
    displayType: zod_1.z.string().optional(),
});
exports.ScaleConnectSchema = zod_1.z.object({
    port: zod_1.z.string(),
});
// Rate limiting configuration
exports.RATE_LIMIT_CONFIG = {
    global: {
        points: 1000, // requests
        duration: 60, // seconds
    },
    perIp: {
        points: 100,
        duration: 60,
    },
    perUser: {
        points: 50,
        duration: 60,
    },
};
// Validation utility functions
function validateIPCInput(schema, data) {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        throw error;
    }
}
