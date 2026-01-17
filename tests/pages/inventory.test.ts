import { test, expect } from '@playwright/test';

test('Inventory page loads successfully', async ({ page }) => {
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
  
  // Now navigate to inventory page
  await page.goto('/inventory');
  
  // Wait for the page to load with a longer timeout
  await page.waitForSelector('text=Inventory Management', { timeout: 30000 });
  
  // Check that key elements are present
  await expect(page.getByText('Inventory Management')).toBeVisible();
  
  // Check that product table is visible
  await expect(page.locator('table')).toBeVisible();
  
  // Check that add product button is visible
  await expect(page.getByTestId('button-add-product')).toBeVisible();
});