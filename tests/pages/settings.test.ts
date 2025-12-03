import { test, expect } from '@playwright/test';

test('Settings page loads successfully', async ({ page }) => {
  await page.goto('/settings');
  
  // Check that key sections are present
  await expect(page.getByText('Settings')).toBeVisible();
  await expect(page.getByText('General Settings')).toBeVisible();
  await expect(page.getByText('Printer Settings')).toBeVisible();
  await expect(page.getByText('Bluetooth Settings')).toBeVisible();
});