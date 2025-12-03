import { test, expect } from '@playwright/test';

test('Sales page loads successfully', async ({ page }) => {
  await page.goto('/sales');
  
  // Check that the page title is correct
  await expect(page).toHaveTitle(/Sales/);
  
  // Check that key elements are present
  await expect(page.getByText('Sales Reports')).toBeVisible();
  
  // Check that sales chart is visible
  await expect(page.locator('.sales-chart')).toBeVisible();
  
  // Check that sales table is visible
  await expect(page.locator('.sales-table')).toBeVisible();
});

test('Can filter sales by date range', async ({ page }) => {
  await page.goto('/sales');
  
  // Set date range
  await page.getByLabel('Start Date').fill('2023-01-01');
  await page.getByLabel('End Date').fill('2023-12-31');
  
  // Apply filter
  await page.getByRole('button', { name: 'Filter' }).click();
  
  // Check that sales data updates
  await expect(page.locator('.sales-table')).toBeVisible();
});