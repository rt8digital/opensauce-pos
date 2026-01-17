/**
 * Printer Encoding Utility
 * Handles character encoding conversion for thermal printers
 * Supports multiple codepages and provides fallback mechanisms
 */

// Codepage mappings for ESC/POS command codes
const CODEPAGE_COMMANDS = {
  'cp437': 0x00,    // PC437 (USA, Standard Europe)
  'cp850': 0x02,    // PC850 (Multilingual)
  'cp858': 0x13,    // PC858 (Multilingual Latin 1 + Euro)
  'cp860': 0x03,    // PC860 (Portuguese)
  'cp863': 0x04,    // PC863 (Canadian-French)
  'cp865': 0x05,    // PC865 (Nordic)
  'cp1252': 0x10,   // Windows-1252 (Latin 1)
  'iso8859_1': 0x11, // ISO 8859-1 (Western Europe)
  'iso8859_2': 0x12, // ISO 8859-2 (Central Europe)
  'utf8': 0xFF      // UTF-8 (special handling required)
};

// Character mapping for common problematic characters
const CHARACTER_REPLACEMENTS = {
  // Currency symbols
  '\u20AC': 'EUR',  // €
  '\u00A3': 'GBP',  // £
  '\u00A5': 'JPY',  // ¥
  '\u00A2': 'CENT', // ¢
  
  // Trademark and copyright symbols
  '\u2122': '(TM)', // ™
  '\u00AE': '(R)',  // ®
  '\u00A9': '(C)',  // ©
  
  // Special punctuation
  '\u2013': '-',    // en dash
  '\u2014': '--',   // em dash
  '\u2026': '...',  // ellipsis
  '\u2022': '*',    // bullet
  
  // Smart quotes
  '\u201C': '"',    // Left double quotation mark
  '\u201D': '"',    // Right double quotation mark
  '\u2018': "'",    // Left single quotation mark
  '\u2019': "'",    // Right single quotation mark
  
  // Fractions
  '\u00BD': '1/2',  // ½
  '\u00BC': '1/4',  // ¼
  '\u00BE': '3/4',  // ¾
  
  // Other symbols
  '\u00B0': 'deg',  // °
  '\u00B1': '+/-',  // ±
  '\u00B2': '^2',   // ²
  '\u00B3': '^3'    // ³
};

export class PrinterEncoding {
  /**
   * Get ESC/POS command bytes for selecting a codepage
   * @param codepage - Codepage identifier (e.g., 'cp437', 'cp850')
   * @returns Array of command bytes
   */
  static getCodepageCommand(codepage: string): number[] {
    const commandCode = CODEPAGE_COMMANDS[codepage.toLowerCase()];
    if (commandCode === undefined) {
      console.warn(`Unknown codepage: ${codepage}, defaulting to CP437`);
      return [0x1B, 0x74, 0x00]; // ESC t 0 (CP437)
    }
    
    return [0x1B, 0x74, commandCode]; // ESC t n
  }

  /**
   * Sanitize text for a specific codepage by replacing unsupported characters
   * @param text - Input text
   * @param codepage - Target codepage
   * @returns Sanitized text with unsupported characters replaced
   */
  static sanitizeForEncoding(text: string, codepage: string): string {
    let sanitized = text;
    
    // Apply character replacements
    for (const [original, replacement] of Object.entries(CHARACTER_REPLACEMENTS)) {
      sanitized = sanitized.replace(new RegExp(original, 'g'), replacement);
    }
    
    // Additional codepage-specific sanitization
    switch (codepage.toLowerCase()) {
      case 'cp437':
        // CP437 has limited characters, remove most Unicode
        sanitized = sanitized.replace(/[^\x00-\x7F]/g, '?');
        break;
        
      case 'cp850':
        // CP850 supports more European characters
        sanitized = sanitized.replace(/[^\x00-\xFF]/g, '?');
        break;
        
      case 'cp1252':
        // Windows-1252 supports extended Latin characters
        sanitized = sanitized.replace(/[^\x00-\xFF]/g, '?');
        break;
        
      default:
        // For other codepages, be conservative
        sanitized = sanitized.replace(/[^\x00-\x7F]/g, '?');
    }
    
    return sanitized;
  }

  /**
   * Encode text for thermal printer using specified codepage
   * @param text - Text to encode
   * @param codepage - Target codepage
   * @returns Uint8Array of encoded bytes
   */
  static encodeText(text: string, codepage: string): Uint8Array {
    try {
      // First sanitize the text for the target codepage
      const sanitizedText = this.sanitizeForEncoding(text, codepage);
      
      // Convert to bytes using TextEncoder (UTF-8)
      // The printer driver will handle the actual codepage conversion
      const encoder = new TextEncoder();
      return encoder.encode(sanitizedText);
    } catch (error) {
      console.error('Encoding error:', error);
      // Fallback to ASCII-only encoding
      const asciiText = text.replace(/[^\x00-\x7F]/g, '?');
      const encoder = new TextEncoder();
      return encoder.encode(asciiText);
    }
  }

  /**
   * Detect the best codepage for given text based on character content
   * @param text - Text to analyze
   * @returns Recommended codepage
   */
  static detectBestEncoding(text: string): string {
    const unicodeChars = text.match(/[^\x00-\x7F]/g);
    
    if (!unicodeChars || unicodeChars.length === 0) {
      return 'cp437'; // ASCII-only text, CP437 is fine
    }
    
    const unicodeCount = unicodeChars.length;
    const totalCount = text.length;
    const unicodeRatio = unicodeCount / totalCount;
    
    // If mostly ASCII, use CP437
    if (unicodeRatio < 0.1) {
      return 'cp437';
    }
    
    // Check for common European characters
    const europeanPattern = /[À-ÿ]/;
    if (europeanPattern.test(text)) {
      return 'cp850'; // Better European character support
    }
    
    // Default to Windows-1252 for mixed content
    return 'cp1252';
  }

  /**
   * Get available codepages with descriptions
   * @returns Array of codepage objects
   */
  static getAvailableCodepages(): Array<{value: string, label: string, description: string}> {
    return [
      { value: 'auto', label: 'Auto-detect', description: 'Automatically detect best codepage' },
      { value: 'cp437', label: 'CP437 (USA/Europe)', description: 'Standard US/European characters' },
      { value: 'cp850', label: 'CP850 (Multilingual)', description: 'Better European language support' },
      { value: 'cp858', label: 'CP858 (Euro Symbol)', description: 'Includes Euro currency symbol' },
      { value: 'cp1252', label: 'Windows-1252', description: 'Extended Latin characters' },
      { value: 'iso8859_1', label: 'ISO-8859-1', description: 'Western European languages' },
      { value: 'utf8', label: 'UTF-8', description: 'Full Unicode support (experimental)' }
    ];
  }

  /**
   * Validate if a codepage is supported
   * @param codepage - Codepage to validate
   * @returns Boolean indicating support status
   */
  static isSupportedCodepage(codepage: string): boolean {
    return codepage === 'auto' || codepage in CODEPAGE_COMMANDS;
  }

  /**
   * Get printer initialization commands including codepage selection
   * @param codepage - Target codepage
   * @returns Array of initialization command bytes
   */
  static getInitializationCommands(codepage: string): number[] {
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ (Initialize)
    
    // Set codepage
    commands.push(...this.getCodepageCommand(codepage));
    
    // Set character spacing (normal)
    commands.push(0x1B, 0x20, 0x00); // ESC SP 0
    
    return commands;
  }
}

// Export character replacement map for external use
export { CHARACTER_REPLACEMENTS };

// Export codepage commands for reference
export { CODEPAGE_COMMANDS };