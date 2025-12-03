import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    pin: text('pin').notNull(),
    role: text('role').notNull(),
    isOwner: integer('is_owner', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    lastLogin: integer('last_login', { mode: 'timestamp' }),
});

export const customers = sqliteTable('customers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    loyaltyPoints: integer('loyalty_points').default(0),
    totalSpent: text('total_spent').default('0'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const products = sqliteTable('products', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    price: text('price').notNull(),
    image: text('image').notNull(),
    stockQuantity: integer('stock_quantity').notNull(),
    barcode: text('barcode').notNull().unique(),
    plu: text('plu'),
    category: text('category').default('General').notNull(),
});

export const discounts = sqliteTable('discounts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    value: text('value').notNull(),
    active: integer('active', { mode: 'boolean' }).default(true),
});

export const orders = sqliteTable('orders', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerId: integer('customer_id').references(() => customers.id),
    userId: integer('user_id').references(() => users.id),
    items: text('items').notNull(),
    total: text('total').notNull(),
    paymentMethod: text('payment_method').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable('order_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    price: text('price').notNull(),
});

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    storeName: text('store_name').default('OpenSauce P.O.S.').notNull(),
    storeAddress: text('store_address'),
    storePhone: text('store_phone'),
    storeEmail: text('store_email'),
    storeLogo: text('store_logo'),
    currency: text('currency').default('R').notNull(),
    printerName: text('printer_name'),
    printerType: text('printer_type').default('usb'),
    printerIp: text('printer_ip'),
    scannerDeviceId: text('scanner_device_id'),
    scannerComPort: text('scanner_com_port'),
    cameraDeviceId: text('camera_device_id'),
    cashDrawerPort: text('cash_drawer_port'),
    customerDisplayType: text('customer_display_type'),
    customerDisplayValue: text('customer_display_value'),
    scalePort: text('scale_port'),
    scaleDeviceId: text('scale_device_id'),
    receiptWidth: text('receipt_width').default('80mm'),
    receiptCustomWidth: integer('receipt_custom_width'),
    receiptHeaderText: text('receipt_header_text'),
    receiptFooterText: text('receipt_footer_text'),
    receiptFontSize: text('receipt_font_size').default('medium'),
    receiptShowLogo: integer('receipt_show_logo', { mode: 'boolean' }).default(true),
    receiptShowOrderNumber: integer('receipt_show_order_number', { mode: 'boolean' }).default(true),
    receiptShowDate: integer('receipt_show_date', { mode: 'boolean' }).default(true),
    receiptShowCustomer: integer('receipt_show_customer', { mode: 'boolean' }).default(true),
    receiptShowPaymentMethod: integer('receipt_show_payment_method', { mode: 'boolean' }).default(true),
    receiptShowBarcode: integer('receipt_show_barcode', { mode: 'boolean' }).default(false),
    paymentQrCode: text('payment_qr_code'),
    whatsappEnabled: integer('whatsapp_enabled', { mode: 'boolean' }).default(false),
    whatsappPhoneNumber: text('whatsapp_phone_number'),
    whatsappApiKey: text('whatsapp_api_key'),
    whatsappBusinessId: text('whatsapp_business_id'),
    whatsappSendReceipts: integer('whatsapp_send_receipts', { mode: 'boolean' }).default(false),
    theme: text('theme').default('light').notNull(),
    language: text('language').default('en').notNull(),
    deviceRole: text('device_role').default('standalone'),
    serverIpAddress: text('server_ip_address'),
    autoBackupEnabled: integer('autoBackupEnabled', { mode: 'boolean' }).default(false),
    backupFrequency: text('backupFrequency').default('daily'),
    backupLocation: text('backupLocation'),
    sessionTimeout: integer('sessionTimeout').default(30),
    passwordMinLength: integer('passwordMinLength').default(6),
    passwordRequireSpecial: integer('passwordRequireSpecial', { mode: 'boolean' }).default(false),
    lowStockThreshold: integer('lowStockThreshold').default(10),
    stockAlertEnabled: integer('stockAlertEnabled', { mode: 'boolean' }).default(true),
    auditLoggingEnabled: integer('auditLoggingEnabled', { mode: 'boolean' }).default(true),
    auditLogLevel: text('auditLogLevel').default('info'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const translations = sqliteTable('translations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sourceText: text('source_text').notNull(),
    language: text('language').notNull(),
    translatedText: text('translated_text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type Translation = typeof translations.$inferSelect;
export type NewTranslation = typeof translations.$inferInsert;

// Insert schemas for form validation
export const insertUserSchema = createInsertSchema(users);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertProductSchema = createInsertSchema(products);
export const insertDiscountSchema = createInsertSchema(discounts);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertSettingsSchema = createInsertSchema(settings);
export const insertTranslationSchema = createInsertSchema(translations);

// Extended types for API responses
export type OrderWithItems = Order & {
    customer?: Customer;
    user?: User;
    orderItems: (OrderItem & { product: Product })[];
};

export type OrderItemWithName = OrderItem & {
    productName: string;
};
