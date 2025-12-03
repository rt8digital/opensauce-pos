import { test, expect } from '@playwright/test';

test('Customers page loads successfully', async ({ page }) => {
  await page.goto('/customers');
  
  // Check that the page title is correct
  await expect(page).toHaveTitle(/Customers/);
  
  // Check that key elements are present
  await expect(page.getByText('Customer Management')).toBeVisible();
  
  // Check that customers table is visible
  await expect(page.locator('.customers-table')).toBeVisible();
  
  // Check that add customer button is visible
  await expect(page.getByRole('button', { name: 'Add Customer' })).toBeVisible();
});

test('Can add new customer', async ({ page }) => {
  await page.goto('/customers');
  
  // Click add customer button
  await page.getByRole('button', { name: 'Add Customer' }).click();
  
  // Fill in customer form
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Phone').fill('123-456-7890');
  await page.getByLabel('Email').fill('john@example.com');
  
  // Submit form
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Check that customer appears in table
  await expect(page.getByText('John Doe')).toBeVisible();
});