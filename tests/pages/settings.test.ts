import { test, expect } from '@playwright/test';

test('Settings page loads successfully', async ({ page }) => {
  // Navigate to login page first
  await page.goto('/login');
  
  // Wait for login form to be ready
  await page.waitForSelector('[data-testid="login-pin-input"]', { timeout: 30000 });
  
  // Login with valid PIN
  await page.getByRole('button', { name: '1' }).click();
  await page.getByRole('button', { name: '2' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByRole('button', { name: '6' }).click();
  await page.getByRole('button', { name: 'Enter' }).click();
  
  // Wait for redirect to main page
  await page.waitForURL('/', { timeout: 30000 });
  
  // Now navigate to settings page
  await page.goto('/settings');
  
  // Wait for the page to load with a longer timeout
  await page.waitForSelector('text=Settings', { timeout: 30000 });
  
  // Check that key sections are present (using more specific selectors to avoid strict mode violations)
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByText('General Settings')).toBeVisible();
  await expect(page.getByText('Printer Settings')).toBeVisible();
  await expect(page.getByText('Bluetooth Settings')).toBeVisible();
});