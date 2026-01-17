import { z } from 'zod';

// Product schemas
export const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().nonnegative().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.number().optional(),
  stock: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
  taxRate: z.number().min(0).max(1).default(0),
});

export const ProductIdSchema = z.object({
  id: z.number().positive(),
});

export const ProductUpdateSchema = ProductIdSchema.extend({
  updates: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    cost: z.number().nonnegative().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    categoryId: z.number().optional(),
    stock: z.number().int().nonnegative().optional(),
    active: z.boolean().optional(),
    taxRate: z.number().min(0).max(1).optional(),
  }).partial(),
});

export const ProductBarcodeSchema = z.object({
  barcode: z.string().min(1),
});

// Order schemas
export const OrderSchema = z.object({
  customerId: z.number().optional(),
  userId: z.number().optional(),
  items: z.array(z.object({
    productId: z.number().positive(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    discount: z.number().nonnegative().optional(),
  })),
  discount: z.object({
    type: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().nonnegative().optional(),
  }).optional(),
  taxRate: z.number().min(0).max(1).default(0),
  payment: z.object({
    method: z.enum(['cash', 'card', 'transfer']),
    amount: z.number().positive(),
    reference: z.string().optional(),
  }),
});

export const OrderIdSchema = z.object({
  id: z.number().positive(),
});

export const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Customer schemas
export const CustomerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  loyaltyPoints: z.number().int().nonnegative().default(0),
});

export const CustomerIdSchema = z.object({
  id: z.number().positive(),
});

export const CustomerSearchSchema = z.object({
  searchTerm: z.string().min(1),
  limit: z.number().int().positive().max(100).default(50),
});

export const CustomerUpdateSchema = CustomerIdSchema.extend({
  updates: z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    loyaltyPoints: z.number().int().nonnegative().optional(),
  }).partial(),
});

// User schemas
export const UserSchema = z.object({
  name: z.string().min(1).max(255),
  pin: z.string().length(4), // Assuming 4-digit PIN
  role: z.enum(['admin', 'manager', 'cashier']).default('cashier'),
  active: z.boolean().default(true),
});

export const UserIdSchema = z.object({
  id: z.number().positive(),
});

export const UserPinSchema = z.object({
  pin: z.string().length(4),
});

export const UserUpdateSchema = UserIdSchema.extend({
  updates: z.object({
    name: z.string().min(1).max(255).optional(),
    pin: z.string().length(4).optional(),
    role: z.enum(['admin', 'manager', 'cashier']).optional(),
    active: z.boolean().optional(),
  }).partial(),
});

// Category schemas
export const CategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // Hex color
});

export const CategoryIdSchema = z.object({
  id: z.number().positive(),
});

// Settings schemas
export const SettingsUpdateSchema = z.object({
  updates: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
  ])),
});

// File dialog schemas
export const OpenFileDialogSchema = z.object({
  options: z.object({
    title: z.string().optional(),
    defaultPath: z.string().optional(),
    buttonLabel: z.string().optional(),
    filters: z.array(z.object({
      name: z.string(),
      extensions: z.array(z.string()),
    })).optional(),
    properties: z.array(z.enum([
      'openFile', 'openDirectory', 'multiSelections', 
      'showHiddenFiles', 'createDirectory', 'promptToCreate'
    ])).optional(),
  }).optional(),
});

export const SaveFileDialogSchema = OpenFileDialogSchema;

// Peripheral schemas
export const PrinterTestSchema = z.object({
  type: z.enum(['network', 'usb', 'bluetooth']),
  address: z.string(),
});

export const PrintReceiptSchema = z.object({
  order: z.any(), // Complex order object - validated separately
  silent: z.boolean().default(true),
});

export const CashDrawerSchema = z.object({
  port: z.string(),
  pulseDuration: z.number().int().min(100).max(500).default(200),
});

export const CustomerDisplaySchema = z.object({
  content: z.any(),
  displayType: z.string().optional(),
});

export const ScaleConnectSchema = z.object({
  port: z.string(),
});

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
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
export function validateIPCInput<T extends z.ZodSchema>(
  schema: T, 
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// Type exports for use in handlers
export type ProductInput = z.infer<typeof ProductSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
export type CustomerInput = z.infer<typeof CustomerSchema>;
export type UserInput = z.infer<typeof UserSchema>;