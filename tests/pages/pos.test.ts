import { test, expect } from '@playwright/test';

test('POS page loads successfully', async ({ page }) => {
  await page.goto('/');

  // Check that we're on the POS page (navigation shows POS as active)
  await expect(page.getByTestId('nav-pos')).toBeVisible();

  // Check that product grid is visible
  await expect(page.getByTestId('product-grid')).toBeVisible();

  // Check that cart is visible
  await expect(page.getByTestId('cart')).toBeVisible();
});
