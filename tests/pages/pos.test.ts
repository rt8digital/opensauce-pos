import { test, expect } from '@playwright/test';

test('POS page loads successfully', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to be fully loaded and network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for React app to hydrate and render
  await page.waitForSelector('[data-testid="nav-pos"]', { timeout: 30000 });

  // Check that we're on the POS page (navigation shows POS as active)
  await expect(page.getByTestId('nav-pos')).toBeVisible();

  // Check that product grid is visible
  await expect(page.getByTestId('product-grid')).toBeVisible();

  // Check that cart is visible
  await expect(page.getByTestId('cart')).toBeVisible();
});
