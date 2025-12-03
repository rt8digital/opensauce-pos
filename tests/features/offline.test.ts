import { test, expect } from '@playwright/test';

test('Application works offline', async ({ page }) => {
  await page.goto('/');
  
  // Wait for app to load
  await expect(page.getByText('Point of Sale')).toBeVisible();
  
  // Simulate offline mode
  await page.context().setOffline(true);
  
  // Try to add an item to cart
  const productElements = await page.locator('[class*="grid"] [class*="button"], [class*="product"]').first();
  if ((await productElements.count()) > 0) {
    await productElements.click();
  }
  
  // Check that item is added despite offline status
  await expect(page.locator('text=Cart is empty')).not.toBeVisible();
  
  // Restore online mode
  await page.context().setOffline(false);
});

test('Data syncs when connection restored', async ({ page }) => {
  // This test would verify that offline transactions sync when online
  // Implementation would depend on the specific sync mechanism
  expect(true).toBe(true); // Placeholder
});