import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  // General Settings
  storeName: text("store_name").notNull().default("OpenSauce P.O.S."),
  storeAddress: text("store_address"),
  storePhone: text("store_phone"),
  storeEmail: text("store_email"),
  storeLogo: text("store_logo"), // Base64 or URL
  currency: text("currency").notNull().default("$"),

  // Hardware Mapping
  printerName: text("printer_name"),
  printerIp: text("printer_ip"),
  scannerDeviceId: text("scanner_device_id"),
  scannerComPort: text("scanner_com_port"),
  cameraDeviceId: text("camera_device_id"),
  cashDrawerPort: text("cash_drawer_port"),
  customerDisplayType: text("customer_display_type"), // 'monitor' | 'ip'
  customerDisplayValue: text("customer_display_value"),
  scalePort: text("scale_port"),
  scaleDeviceId: text("scale_device_id"),

  // Receipt Layout
  receiptWidth: text("receipt_width").default("80mm"), // '58mm' | '80mm' | 'custom'
  receiptCustomWidth: integer("receipt_custom_width"), // in mm
  receiptHeaderText: text("receipt_header_text"),
  receiptFooterText: text("receipt_footer_text"),
  receiptFontSize: text("receipt_font_size").default("medium"), // 'small' | 'medium' | 'large'
  receiptShowLogo: boolean("receipt_show_logo").default(true),
  receiptShowOrderNumber: boolean("receipt_show_order_number").default(true),
  receiptShowDate: boolean("receipt_show_date").default(true),
  receiptShowCustomer: boolean("receipt_show_customer").default(true),
  receiptShowPaymentMethod: boolean("receipt_show_payment_method").default(true),
  receiptShowBarcode: boolean("receipt_show_barcode").default(false),

  // Payment QR Code
  paymentQrCode: text("payment_qr_code"), // Base64 image

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create the table
export const createSettingsTable = sql`
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'OpenSauce P.O.S.',
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  store_logo TEXT,
  currency TEXT NOT NULL DEFAULT '$',
  printer_name TEXT,
  printer_ip TEXT,
  scanner_device_id TEXT,
  scanner_com_port TEXT,
  camera_device_id TEXT,
  cash_drawer_port TEXT,
  customer_display_type TEXT,
  customer_display_value TEXT,
  scale_port TEXT,
  scale_device_id TEXT,
  receipt_width TEXT DEFAULT '80mm',
  receipt_custom_width INTEGER,
  receipt_header_text TEXT,
  receipt_footer_text TEXT,
  receipt_font_size TEXT DEFAULT 'medium',
  receipt_show_logo BOOLEAN DEFAULT true,
  receipt_show_order_number BOOLEAN DEFAULT true,
  receipt_show_date BOOLEAN DEFAULT true,
  receipt_show_customer BOOLEAN DEFAULT true,
  receipt_show_payment_method BOOLEAN DEFAULT true,
  receipt_show_barcode BOOLEAN DEFAULT false,
  payment_qr_code TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

// Insert default settings
export const insertDefaultSettings = sql`
INSERT INTO settings (
  store_name, currency, receipt_width, receipt_font_size, 
  receipt_show_logo, receipt_show_order_number, receipt_show_date,
  receipt_show_customer, receipt_show_payment_method, receipt_show_barcode
) VALUES (
  'OpenSauce P.O.S.', '$', '80mm', 'medium',
  true, true, true,
  true, true, false
)
ON CONFLICT (id) DO NOTHING;
`;