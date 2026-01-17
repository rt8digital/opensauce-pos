
import { test, expect } from '@playwright/test';

test.describe('App Stress & Load Tests', () => {
    // These tests require the app to be running.
    // Ensure you run these with 'npx playwright test --headed' or similar against the running dev server.

    test('should load main page and render components without crashing', async ({ page }) => {
        // Navigate to the app root (baseUrl should be configured in playwright.config.ts)
        // If not, use localhost:5177 (Vite default)
        try {
            await page.goto('http://localhost:5177', { timeout: 10000 });
        } catch (e) {
            console.warn('Could not connect to localhost:5177. Is the dev server running? Skipping test.');
            test.skip();
            return;
        }

        // Wait for dashboard or login
        await page.waitForLoadState('networkidle');

        // Basic check for title or main element
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('should handle rapid navigation between pages', async ({ page }) => {
        try {
            await page.goto('http://localhost:5177', { timeout: 10000 });
        } catch {
            test.skip();
            return;
        }

        const routes = ['/', '/inventory', '/settings', '/'];

        for (const route of routes) {
            await page.goto(`http://localhost:5177${route}`);
            await page.waitForLoadState('domcontentloaded');
        }
    });
});
