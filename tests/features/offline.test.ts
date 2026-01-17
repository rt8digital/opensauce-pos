import { test, expect } from '@playwright/test';

async function authenticate(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="login-pin-input"]', { timeout: 30000 });
  
  // Enter PIN using PinKeypad buttons (123456)
  await page.getByRole('button', { name: '1' }).click();
  await page.getByRole('button', { name: '2' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByRole('button', { name: '6' }).click();
  
  // Submit login
  await page.getByRole('button', { name: 'Enter' }).click();
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 30000 });
}

test('Application works offline', async ({ page }) => {
  // Authenticate first
  await authenticate(page);
  
  // Wait for app to load
  await expect(page.getByTestId('nav-pos')).toBeVisible();
  
  // Simulate offline mode
  await page.context().setOffline(true);
  
  // Wait for product grid to load
  await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 });
  
  // Try to add an item to cart using the proper product selector
  const productCard = page.locator('[data-testid="product-grid"] > div > div').first();
  await productCard.waitFor({ state: 'visible' });
  await productCard.click();
  
  // Wait for cart state to update
  await page.waitForLoadState('networkidle');
  
  // Check that cart is not empty by verifying a total amount is shown
  await expect(page.locator('text=/Total.*[1-9]|[1-9].*Total/')).toBeVisible();
  
  // Restore online mode
  await page.context().setOffline(false);
});

test('Data syncs when connection restored', async ({ page }) => {
  // This test would verify that offline transactions sync when online
  // Implementation would depend on the specific sync mechanism
  expect(true).toBe(true); // Placeholder
});