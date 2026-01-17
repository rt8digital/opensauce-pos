
import { test, expect } from '@playwright/test';
import { Scale } from '../../client/src/lib/scale';

test.describe('Scale Peripheral Tests', () => {
    let mockElectronAPI: any;

    test.beforeEach(() => {
        mockElectronAPI = {
            connectScale: async () => true,
            disconnectScale: async () => true,
            readScaleWeight: async () => ({
                weight: 1.5,
                unit: 'kg',
                stable: true,
                timestamp: new Date().toISOString()
            }),
            tareScale: async () => true,
            getScaleStatus: async () => true
        };

        (global as any).window = {
            electronAPI: mockElectronAPI
        };
    });

    test('should connect to scale via Electron IPC', async () => {
        const scale = Scale.getInstance();
        const result = await scale.connect('COM1');
        expect(result).toBe(true);
    });

    test('should read weight from scale', async () => {
        const scale = Scale.getInstance();
        const reading = await scale.readWeight();
        expect(reading).not.toBeNull();
        expect(reading?.weight).toBe(1.5);
        expect(reading?.unit).toBe('kg');
    });

    test('should disconnect from scale', async () => {
        const scale = Scale.getInstance();
        const result = await scale.disconnect();
        expect(result).toBe(true);
    });
});
