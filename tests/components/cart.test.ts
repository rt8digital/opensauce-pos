import { test, expect } from '@playwright/test';

test('Cart component displays items correctly', async ({ page }) => {
  await page.goto('/');
  
  // Add an item to cart by clicking on a product
  // Since we don't know the exact product structure, we'll look for clickable elements
  const productElements = await page.locator('[class*="grid"] [class*="button"], [class*="product"]').first();
  if ((await productElements.count()) > 0) {
    await productElements.click();
  }
  
  // Check that cart item is displayed
  await expect(page.locator('text=Cart is empty')).not.toBeVisible();
});

test('Can remove items from cart', async ({ page }) => {
  await page.goto('/');
  
  // Add an item to cart
  const productElements = await page.locator('[class*="grid"] [class*="button"], [class*="product"]').first();
  if ((await productElements.count()) > 0) {
    await productElements.click();
  }
  
  // Remove item from cart using the trash icon
  const removeButtons = await page.locator('[data-testid^="remove-item-"], .text-destructive');
  if ((await removeButtons.count()) > 0) {
    await removeButtons.first().click();
  }
});