import type { Settings } from '@/../../shared/types';

/**
 * Unified receipt formatting system that ensures consistency
 * between preview and actual printing across all methods
 */

// Font size mapping based on receipt settings
export const fontSizeMap = {
    small: {
        header: 14,
        storeDetails: 10,
        content: 9,
        items: 10,
        itemsHeader: 12,
        total: 12
    },
    medium: {
        header: 16,
        storeDetails: 12,
        content: 11,
        items: 12,
        itemsHeader: 14,
        total: 14
    },
    large: {
        header: 18,
        storeDetails: 14,
        content: 13,
        items: 14,
        itemsHeader: 16,
        total: 16
    }
} as const;

// Divider styles for consistent use across all components
export const dividerStyles = {
    // Thin divider
    thin: {
        preview: 'border-t border-black/20',
        thermal: '-'.repeat(42), // Will be adjusted based on width
        pdf: '--------------------------------'
    },
    // Thick divider  
    thick: {
        preview: 'border-t border-black',
        thermal: '='.repeat(42), // Will be adjusted based on width
        pdf: '================================'
    },
    // Dashed divider
    dashed: {
        preview: 'border-t border-dashed border-black/30',
        thermal: '-'.repeat(42), // Will be adjusted based on width
        pdf: '--------------------------------'
    }
} as const;

// Standard spacing values
export const spacing = {
    small: 4,
    medium: 6,
    large: 8,
    section: 12
} as const;

// Store information formatting
export interface StoreInfo {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}

// Get font sizes based on settings
export function getFontSizes(settings?: Settings) {
    const fontSize = settings?.receiptFontSize || 'medium';
    return fontSizeMap[fontSize as keyof typeof fontSizeMap] || fontSizeMap.medium;
}

// Calculate separator length based on receipt width
export function getSeparatorLength(settings?: Settings): number {
    const receiptWidth = settings?.receiptWidth || '80mm';

    let separatorLength = 42; // Default for 80mm
    if (receiptWidth === '58mm') {
        separatorLength = 32;
    } else if (receiptWidth === 'custom') {
        const customWidth = settings?.receiptCustomWidth || 80;
        separatorLength = Math.min(Math.max(24, Math.floor(customWidth * 0.525)), 64);
    }

    return separatorLength;
}

// Get divider text for thermal printing
export function getThermalDivider(type: keyof typeof dividerStyles, settings?: Settings): string {
    const length = getSeparatorLength(settings);
    // const divider = dividerStyles[type];

    if (type === 'thick') {
        return '='.repeat(length);
    } else {
        return '-'.repeat(length);
    }
}

// Get CSS classes for preview dividers
export function getPreviewDivider(type: keyof typeof dividerStyles): string {
    return dividerStyles[type].preview;
}

// Format store information for display
export function formatStoreInfo(storeInfo: StoreInfo, _settings?: Settings): {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
} {
    // const fontSizes = getFontSizes(settings);

    return {
        name: storeInfo.name.toUpperCase(),
        address: storeInfo.address,
        phone: storeInfo.phone ? `Tel: ${storeInfo.phone}` : undefined,
        email: storeInfo.email
    };
}

// Generate CSS classes for receipt preview styling
export function getPreviewClasses(settings?: Settings) {
    const fontSizes = getFontSizes(settings);

    return {
        // Base container
        container: `font-mono ${getPreviewFontSize(settings)} break-words overflow-hidden bg-white text-black p-4 shadow-sm`,

        // Store information
        storeName: `font-bold text-[${fontSizes.header}px] break-words`,
        storeDetails: `text-[${fontSizes.storeDetails}px] font-medium break-words`,

        // Content sections
        content: `text-[${fontSizes.content}px] break-words`,
        items: `text-[${fontSizes.items}px] break-words`,
        total: `font-bold text-[${fontSizes.total}px] break-words`,

        // Dividers
        thinDivider: getPreviewDivider('thin'),
        thickDivider: getPreviewDivider('thick'),
        dashedDivider: getPreviewDivider('dashed'),

        // Layout
        center: 'text-center flex flex-col items-center',
        spaceBetween: 'flex justify-between gap-4',
        spaceY: 'space-y-1.5',
        marginY: 'my-2',
        padding: 'p-2',

        // Robust Font Mappings
        headerFont: getFontClass(settings?.receiptHeaderFont || 'standard'),
        itemsFont: getFontClass(settings?.receiptItemsFont || 'standard'),
        numbersFont: getFontClass(settings?.receiptNumbersFont || 'mono'),
        detailsFont: getFontClass(settings?.receiptDetailsFont || 'mono'),
        metadataFont: getFontClass(settings?.receiptMetadataFont || 'standard'),

        // Scaled Sizes (Base * Scale%)
        headerSize: settings?.receiptHeaderScale ? `${(fontSizes.header * (settings.receiptHeaderScale / 100)).toFixed(1)}px` : `${fontSizes.header}px`,
        itemsSize: settings?.receiptItemsScale ? `${(fontSizes.items * (settings.receiptItemsScale / 100)).toFixed(1)}px` : `${fontSizes.items}px`,
        numbersSize: settings?.receiptNumbersScale ? `${(fontSizes.total * (settings.receiptNumbersScale / 100)).toFixed(1)}px` : `${fontSizes.total}px`,
        detailsSize: settings?.receiptDetailsScale ? `${(fontSizes.content * (settings.receiptDetailsScale / 100)).toFixed(1)}px` : `${fontSizes.content}px`,
        metadataSize: settings?.receiptMetadataScale ? `${(fontSizes.storeDetails * (settings.receiptMetadataScale / 100)).toFixed(1)}px` : `${fontSizes.storeDetails}px`,
        logoScale: settings?.receiptLogoScale ? settings.receiptLogoScale / 100 : 1,
        qrCodeScale: settings?.qrCodeScale ? settings.qrCodeScale / 100 : 1,
        dividerOpacity: settings?.receiptDividerOpacity ? settings.receiptDividerOpacity / 100 : 0.5,

        // Raw Font Families (for custom system fonts)
        headerFamily: getFontFamily(settings?.receiptHeaderFont),
        itemsFamily: getFontFamily(settings?.receiptItemsFont),
        numbersFamily: getFontFamily(settings?.receiptNumbersFont),
        detailsFamily: getFontFamily(settings?.receiptDetailsFont),
        metadataFamily: getFontFamily(settings?.receiptMetadataFont),
    };
}

function getFontFamily(font?: string) {
    if (!font) return undefined;
    const presets: Record<string, string> = {
        'standard': "'ReceiptStandard', monospace",
        'modern': "'ReceiptModern', sans-serif",
        'condensed': "'ReceiptCondensed', sans-serif",
        'mono': "monospace"
    };
    return presets[font] || font; // Return preset family or raw custom font name
}

function getFontClass(font?: string) {
    switch (font) {
        case 'standard': return 'receipt-font-standard';
        case 'modern': return 'receipt-font-modern';
        case 'condensed': return 'receipt-font-condensed';
        case 'mono': return 'receipt-font-mono';
        default: return 'receipt-font-standard';
    }
}

// Get font size class for preview
function getPreviewFontSize(settings?: Settings): string {
    const fontSize = settings?.receiptFontSize || 'medium';

    switch (fontSize) {
        case 'small':
            return 'text-xs';
        case 'large':
            return 'text-base';
        default:
            return 'text-sm';
    }
}

// Format currency display
export function formatCurrency(amount: number, currency: string = 'R'): string {
    const curr = currency && currency !== '0' ? currency : 'R';
    return `${curr}${amount.toFixed(2)}`;
}

// Format item display for thermal printing
export function formatThermalItem(
    item: { productName?: string; quantity: number; price: number },
    currency: string,
    settings?: Settings
): string {
    const productName = item.productName || 'Item';
    const separatorLength = getSeparatorLength(settings);

    // Truncate product name if too long for thermal printer
    let displayName = productName;
    if (displayName.length > separatorLength - 10) {
        displayName = displayName.substring(0, separatorLength - 13) + '...';
    }

    const itemTotal = item.quantity * item.price;

    return `${displayName}
QTY: ${item.quantity} @ ${currency}${item.price.toFixed(2)} each
SUBTOTAL: ${currency}${itemTotal.toFixed(2)}`;
}

// Generate receipt header for thermal printing
export function generateThermalHeader(
    storeInfo: StoreInfo,
    settings?: Settings
): string {
    const separator = getThermalDivider('thick', settings);
    // const dashSeparator = getThermalDivider('thin', settings);

    let header = `${separator}\n\n`;
    header += `${storeInfo.name.toUpperCase()}\n\n`;
    header += `${separator}\n\n`;

    if (storeInfo.address) {
        header += `${storeInfo.address}\n\n`;
    }

    if (storeInfo.phone) {
        header += `Tel: ${storeInfo.phone}\n\n`;
    }

    if (storeInfo.email) {
        header += `Email: ${storeInfo.email}\n\n`;
    }

    return header;
}

// Generate receipt footer for thermal printing
export function generateThermalFooter(
    settings?: Settings,
    footerText?: string
): string {
    const separator = getThermalDivider('thick', settings);

    let footer = `${separator}\n\n`;

    if (footerText) {
        footer += `${footerText}\n\n`;
    } else {
        footer += `Thank you for your purchase!\n\n`;
    }

    footer += `${separator}\n\n`;

    return footer;
}

// Calculate receipt width in mm for PDF generation
export function getReceiptWidthMM(settings?: Settings): number {
    const receiptWidth = settings?.receiptWidth || '80mm';

    if (receiptWidth === '58mm') {
        return 58;
    } else if (receiptWidth === 'custom') {
        return settings?.receiptCustomWidth || 80;
    }

    return 80;
}

// Calculate dynamic receipt height for PDF based on content
export function calculateReceiptHeight(
    itemCount: number,
    baseHeight: number = 99,
    heightPerItem: number = 19
): number {
    // Formula: baseHeight + (itemCount * heightPerItem) - 6
    const calculatedHeight = baseHeight + (itemCount * heightPerItem) - 6;
    return Math.min(2000, Math.max(250, calculatedHeight));
}