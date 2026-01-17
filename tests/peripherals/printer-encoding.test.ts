import { test, expect } from '@playwright/test';
import { PrinterEncoding } from '../../client/src/lib/printer-encoding';

test.describe('Printer Encoding Tests', () => {
    test('should encode text with CP437 codepage', async () => {
        const text = 'Hello World!';
        const result = PrinterEncoding.encodeText(text, 'cp437');
        
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    test('should handle special characters with sanitization', async () => {
        const text = 'Price: €10.00 (TM)';
        const result = PrinterEncoding.encodeText(text, 'cp437');
        
        expect(result).toBeInstanceOf(Uint8Array);
        // Should contain ASCII representation after sanitization
        const decoded = new TextDecoder().decode(result);
        expect(decoded).toContain('EUR'); // € should become EUR
        expect(decoded).toContain('(TM)'); // ™ should remain (TM)
    });

    test('should detect best encoding for text', async () => {
        const asciiText = 'Simple ASCII text';
        const europeanText = 'Café résumé naïve';
        const mixedText = 'Mixed: Café & naïve';

        expect(PrinterEncoding.detectBestEncoding(asciiText)).toBe('cp437');
        expect(PrinterEncoding.detectBestEncoding(europeanText)).toBe('cp850');
        expect(PrinterEncoding.detectBestEncoding(mixedText)).toBe('cp850'); // Contains European chars, so cp850
    });

    test('should generate correct codepage commands', async () => {
        const cp437Command = PrinterEncoding.getCodepageCommand('cp437');
        const cp850Command = PrinterEncoding.getCodepageCommand('cp850');
        const cp1252Command = PrinterEncoding.getCodepageCommand('cp1252');

        // ESC t n format: [0x1B, 0x74, codepage_number]
        expect(cp437Command).toEqual([0x1B, 0x74, 0x00]);
        expect(cp850Command).toEqual([0x1B, 0x74, 0x02]);
        expect(cp1252Command).toEqual([0x1B, 0x74, 0x10]);
    });

    test('should sanitize text for specific codepages', async () => {
        const text = 'Mixed: Café € ™';
        
        const cp437Sanitized = PrinterEncoding.sanitizeForEncoding(text, 'cp437');
        const cp850Sanitized = PrinterEncoding.sanitizeForEncoding(text, 'cp850');
        const cp1252Sanitized = PrinterEncoding.sanitizeForEncoding(text, 'cp1252');

        // CP437 should have more replacements due to limited character set
        expect(cp437Sanitized).toContain('EUR');
        expect(cp437Sanitized).toContain('(TM)');
        
        // CP850 and CP1252 should preserve more characters
        expect(cp850Sanitized).toContain('Café');
        expect(cp1252Sanitized).toContain('Café');
    });

    test('should provide available codepages', async () => {
        const codepages = PrinterEncoding.getAvailableCodepages();
        
        expect(Array.isArray(codepages)).toBe(true);
        expect(codepages.length).toBeGreaterThan(0);
        
        const cp437 = codepages.find(cp => cp.value === 'cp437');
        expect(cp437).toBeDefined();
        expect(cp437?.label).toBe('CP437 (USA/Europe)');
    });

    test('should validate supported codepages', async () => {
        expect(PrinterEncoding.isSupportedCodepage('cp437')).toBe(true);
        expect(PrinterEncoding.isSupportedCodepage('cp850')).toBe(true);
        expect(PrinterEncoding.isSupportedCodepage('cp1252')).toBe(true);
        expect(PrinterEncoding.isSupportedCodepage('invalid')).toBe(false);
        expect(PrinterEncoding.isSupportedCodepage('auto')).toBe(true); // Auto-detect is supported
    });

    test('should generate initialization commands', async () => {
        const commands = PrinterEncoding.getInitializationCommands('cp437');
        
        // Should include initialize command (ESC @) and codepage command
        expect(commands).toContain(0x1B); // ESC
        expect(commands).toContain(0x40); // @ (initialize)
        expect(commands).toContain(0x74); // t (codepage)
        expect(commands.length).toBeGreaterThan(6); // At least ESC @ + ESC t 0 + spacing commands
    });
});