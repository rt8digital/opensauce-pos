import { z } from 'zod';

// Type definitions (kept simple and serializable)
export type User = {
  id: number;
  name: string;
  pin: string;
  role: string;
  isOwner?: boolean;
  createdAt?: string | number;
  lastLogin?: string | number;
};

export type Customer = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  loyaltyPoints?: number;
  totalSpent?: string;
  createdAt?: string | number;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string | number;
};

export type UpdateCategory = Partial<Pick<Category, 'name' | 'description'>>;

export type Product = {
  id: number;
  name: string;
  price: string;
  cost?: string;
  image?: string;
  stockQuantity?: number;
  barcode?: string | null;
  plu?: string | null;
  categoryId?: number | null;
  category?: string;
  weight?: number | null;
  weightUnit?: string | null;
};

export type Discount = {
  id: number;
  name: string;
  type: string;
  value: string;
  active?: boolean;
};

export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  originalPrice?: string;
  discountedPrice?: string;
};

export type Order = {
  id: number;
  customerId?: number | null;
  userId?: number | null;
  items: string;
  total: string;
  paymentMethod: string;
  source?: 'pos' | 'whatsapp' | 'web';
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'voided';
  notes?: string;
  createdAt?: string | number;
  cashReceived?: string;
  change?: string;
  discount?: string;
};

export type Settings = {
  id?: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeLogo?: string;
  currency?: string;
  theme?: string;
  language?: string;
  deviceRole?: string;
  serverIpAddress?: string;
  receiptWidth?: string;
  receiptCustomWidth?: number;
  receiptHeaderText?: string;
  receiptFooterText?: string;
  receiptFontSize?: string;
  receiptShowLogo?: boolean;
  receiptShowOrderNumber?: boolean;
  receiptShowDate?: boolean;
  receiptShowCustomer?: boolean;
  receiptShowPaymentMethod?: boolean;
  receiptShowBarcode?: boolean;
  receiptLogoSize?: number;
  qrCodeScale?: number;
  receiptShowQrCode?: boolean;
  receiptContinuousPrinting?: boolean;
  receiptPreventScaling?: boolean;
  receiptMaxLinesPerPage?: number;
  printerType?: string;
  printerIp?: string;
  printerDeviceId?: string;
  paymentQrCode?: string;
  adviceList?: string;
  autoLaunchEnabled?: boolean;
  taxRate?: number;
  vatPercentage?: number;
  vatNumber?: string;
  enableCustomerDisplay?: boolean;
  enableBluetoothPeripherals?: boolean;
  cashDrawerPulse?: number;
  cameraScannerEnabled?: boolean;
  cameraFacing?: string;
  cameraResolution?: string;
  cameraTorchEnabled?: boolean;
  cameraContinuousScan?: boolean;
  cameraSupportedFormats?: string;
  cameraDeviceId?: string;
  scannerType?: string;
  scannerDeviceId?: string;
  scannerComPort?: string;
  whatsappEnabled?: boolean;
  whatsappPhoneNumber?: string;
  whatsappApiKey?: string;
  whatsappBusinessId?: string;
  whatsappSendReceipts?: boolean;

  // Robust Receipt Customization
  receiptHeaderFont?: string;
  receiptHeaderScale?: number;
  receiptItemsFont?: string;
  receiptItemsScale?: number;
  receiptNumbersFont?: string;
  receiptNumbersScale?: number;
  receiptDetailsFont?: string;
  receiptDetailsScale?: number;
  receiptMetadataFont?: string;
  receiptMetadataScale?: number;
  receiptLogoScale?: number;
  receiptDividerOpacity?: number;
  receiptShowItemDivider?: boolean;
  receiptItemDividerStyle?: 'solid' | 'dashed' | 'dotted';
  receiptShowTotalDivider?: boolean;
  receiptCompactMode?: boolean;
  [key: string]: any;
};

export type BotSettings = import('./schema').BotSettings;

export type OrderWithItems = import('./schema').OrderWithItems;
export type OrderItemWithName = import('./schema').OrderItemWithName;

// Zod schemas for frontend validation (compatible with react-hook-form zodResolver)
export const insertProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().min(1, 'Price is required'),
  cost: z.string().optional(),
  image: z.string().optional(),
  stockQuantity: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().nonnegative().max(1000000000)).optional(), // Max 1 billion
  barcode: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  plu: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  categoryId: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().optional()).optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const insertCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const insertDiscountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  value: z.string().min(1),
  active: z.boolean().optional(),
});

export const insertUserSchema = z.object({
  name: z.string().min(1),
  pin: z.string().min(4),
  role: z.string().min(1),
  isOwner: z.boolean().optional(),
});

export const insertOrderSchema = z.object({
  customerId: z.number().optional(),
  userId: z.number().optional(),
  items: z.string().min(1),
  total: z.string().min(1),
  paymentMethod: z.string().min(1),
  cashReceived: z.string().optional(),
  change: z.string().optional(),
});

export const insertOrderItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().int().min(1),
  price: z.string().min(1),
});

export const insertSettingsSchema = z.object({
  storeName: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  receiptShowQrCode: z.boolean().optional(),
  receiptHeaderFont: z.string().optional(),
  receiptHeaderScale: z.number().optional(),
  receiptItemsFont: z.string().optional(),
  receiptItemsScale: z.number().optional(),
  receiptNumbersFont: z.string().optional(),
  receiptNumbersScale: z.number().optional(),
  receiptDetailsFont: z.string().optional(),
  receiptDetailsScale: z.number().optional(),
  receiptMetadataFont: z.string().optional(),
  receiptMetadataScale: z.number().optional(),
  receiptLogoScale: z.number().optional(),
  receiptDividerOpacity: z.number().optional(),
  receiptShowItemDivider: z.boolean().optional(),
  receiptItemDividerStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  receiptShowTotalDivider: z.boolean().optional(),
  receiptCompactMode: z.boolean().optional(),
});

export const insertTranslationSchema = z.object({
  sourceText: z.string().min(1),
  language: z.string().min(1),
  translatedText: z.string().min(1),
});

export const insertBotSettingsSchema = z.object({
  welcomeMessage: z.string().optional(),
  helpMessage: z.string().optional(),
  unknownCommandMessage: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

// Types inferred from zod schemas for convenient imports
export type NewProduct = z.infer<typeof insertProductSchema>;
export type NewCategory = z.infer<typeof insertCategorySchema>;
export type NewCustomer = z.infer<typeof insertCustomerSchema>;
export type NewDiscount = z.infer<typeof insertDiscountSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type NewOrder = z.infer<typeof insertOrderSchema>;
export type NewOrderItem = z.infer<typeof insertOrderItemSchema>;
export type NewSettings = z.infer<typeof insertSettingsSchema>;
export type NewBotSettings = z.infer<typeof insertBotSettingsSchema>;
