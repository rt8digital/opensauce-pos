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

export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const products = sqliteTable('products', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    price: text('price').notNull(),
    cost: text('cost').default('0'),
    image: text('image').notNull(),
    stockQuantity: integer('stock_quantity').notNull(),
    barcode: text('barcode').unique(), // Make barcode optional by removing .notNull()
    plu: text('plu'),
    categoryId: integer('category_id').references(() => categories.id),
    category: text('category').default('General').notNull(), // Keep for backward compatibility
    weight: real('weight'), // Add weight field
    weightUnit: text('weight_unit'), // Add weight unit field (mg, g, kg, etc.)
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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
    source: text('source', { enum: ['pos', 'whatsapp', 'web'] }).default('pos').notNull(),
    status: text('status', { enum: ['pending', 'confirmed', 'completed', 'cancelled', 'voided'] }).default('pending').notNull(),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    cashReceived: text('cash_received'),
    change: text('change'),
    discount: text('discount').default('0'),
});

export const orderItems = sqliteTable('order_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    price: text('price').notNull(),
    originalPrice: text('original_price'),
    discountedPrice: text('discounted_price'),
    voided: integer('voided', { mode: 'boolean' }).default(false),
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
    printerDeviceId: text('printer_device_id'),
    scannerDeviceId: text('scanner_device_id'),
    scannerComPort: text('scanner_com_port'),
    cameraDeviceId: text('camera_device_id'),
    cameraScannerEnabled: integer('cameraScannerEnabled', { mode: 'boolean' }).default(true),
    cameraFacing: text('cameraFacing').default('back'),
    cameraResolution: text('cameraResolution').default('auto'),
    cameraTorchEnabled: integer('cameraTorchEnabled', { mode: 'boolean' }).default(false),
    cameraContinuousScan: integer('cameraContinuousScan', { mode: 'boolean' }).default(false),
    cameraSupportedFormats: text('cameraSupportedFormats').default('qr_code,code_128,code_39,ean_13,ean_8,upc_a,upc_e'),
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
    receiptLogoSize: integer('receipt_logo_size').default(100),
    qrCodeScale: integer('qr_code_scale').default(100),
    receiptContinuousPrinting: integer('receipt_continuous_printing', { mode: 'boolean' }).default(false),
    receiptPreventScaling: integer('receipt_prevent_scaling', { mode: 'boolean' }).default(false),
    receiptMaxLinesPerPage: integer('receipt_max_lines_per_page').default(50),
    receiptShowQrCode: integer('receipt_show_qr_code', { mode: 'boolean' }).default(false),
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
    vatPercentage: real('vat_percentage'),
    vatNumber: text('vat_number'),
    adviceList: text('advice_list').default('[]').notNull(),
    // Printer encoding settings
    printerCodepage: text('printer_codepage').default('cp437'),
    printerModel: text('printer_model'),
    printerManufacturer: text('printer_manufacturer'),
});

export const translations = sqliteTable('translations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sourceText: text('source_text').notNull(),
    language: text('language').notNull(),
    translatedText: text('translated_text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const botSettings = sqliteTable('bot_settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    welcomeMessage: text('welcome_message').default('Welcome to our store! How can I help you today?'),
    helpMessage: text('help_message').default('Available commands: menu, order [item], help'),
    unknownCommandMessage: text('unknown_command_message').default('Sorry, I didn\'t understand that command. Type "help" for available commands.'),
    orderConfirmationMessage: text('order_confirmation_message').default('Your order has been placed successfully!'),
    isEnabled: integer('is_enabled', { mode: 'boolean' }).default(false),
    businessName: text('business_name'),
    businessPhone: text('business_phone'),
    autoReply: integer('auto_reply', { mode: 'boolean' }).default(true),
    queueOrders: integer('queue_orders', { mode: 'boolean' }).default(true),
    maxConcurrentChats: integer('max_concurrent_chats').default(10),
    responseDelay: integer('response_delay').default(1),
});

export const whatsappQueue = sqliteTable('whatsapp_queue', {
    id: text('id').primaryKey(),
    phoneNumber: text('phone_number').notNull(),
    message: text('message').notNull(),
    status: text('status', { enum: ['pending', 'processing', 'sent', 'failed'] }).default('pending').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    attempts: integer('attempts').default(0),
    maxAttempts: integer('max_attempts').default(3),
});

export const whatsappConsent = sqliteTable('whatsapp_consent', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    phoneNumber: text('phone_number').notNull().unique(),
    consentStatus: text('consent_status', { enum: ['opted_in', 'opted_out'] }).notNull(),
    consentGivenAt: integer('consent_given_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    consentRevokedAt: integer('consent_revoked_at', { mode: 'timestamp' }),
    consentSource: text('consent_source').default('whatsapp_bot').notNull(), // whatsapp_bot, admin_ui, api, etc.
    notes: text('notes'),
});

export const cashOuts = sqliteTable('cash_outs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    openingCash: text('opening_cash').default('0'),
    cashReceived: text('cash_received').notNull(),
    changeGiven: text('change_given').notNull(),
    expectedCash: text('expected_cash').notNull(),
    actualCash: text('actual_cash'),
    discrepancy: text('discrepancy'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userPreferences = sqliteTable('user_preferences', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    preferenceKey: text('preference_key').notNull(),
    preferenceValue: text('preference_value'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    reason: text('reason'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

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

export type BotSettings = typeof botSettings.$inferSelect;
export type NewBotSettings = typeof botSettings.$inferInsert;

export type WhatsappQueue = typeof whatsappQueue.$inferSelect;
export type NewWhatsappQueue = typeof whatsappQueue.$inferInsert;

export type WhatsappConsent = typeof whatsappConsent.$inferSelect;
export type NewWhatsappConsent = typeof whatsappConsent.$inferInsert;

export type CashOut = typeof cashOuts.$inferSelect;
export type NewCashOut = typeof cashOuts.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Insert schemas for form validation
export const insertUserSchema = createInsertSchema(users);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertDiscountSchema = createInsertSchema(discounts);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertSettingsSchema = createInsertSchema(settings);
export const insertTranslationSchema = createInsertSchema(translations);
export const insertBotSettingsSchema = createInsertSchema(botSettings);
export const insertWhatsappQueueSchema = createInsertSchema(whatsappQueue);
export const insertWhatsappConsentSchema = createInsertSchema(whatsappConsent);
export const insertCashOutsSchema = createInsertSchema(cashOuts);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertAuditLogsSchema = createInsertSchema(auditLogs);

// Extended types for API responses
export type OrderWithItems = Order & {
    customer?: Customer;
    user?: User;
    orderItems: (OrderItem & { product: Product })[];
};

export type OrderItemWithName = OrderItem & {
    productName: string;
};