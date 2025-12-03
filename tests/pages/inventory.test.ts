import { test, expect } from '@playwright/test';

test('Inventory page loads successfully', async ({ page }) => {
  await page.goto('/inventory');
  
  // Check that key elements are present
  await expect(page.getByText('Inventory Management')).toBeVisible();
  
  // Check that product table is visible
  await expect(page.locator('table')).toBeVisible();
  
  // Check that add product button is visible
  await expect(page.getByTestId('button-add-product')).toBeVisible();
});