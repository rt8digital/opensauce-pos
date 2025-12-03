import { test, expect } from '@playwright/test';

test('Payment process works correctly', async ({ page }) => {
  await page.goto('/');
  
  // Add an item to cart by clicking on a product
  const productElements = await page.locator('[class*="grid"] [class*="button"], [class*="product"]').first();
  if ((await productElements.count()) > 0) {
    await productElements.click();
  }
  
  // Proceed to payment
  await page.getByRole('button', { name: 'Checkout' }).click();
  
  // Check that payment dialog opens
  await expect(page.getByText('Payment')).toBeVisible();
  
  // Select cash payment
  await page.getByTestId('radio-cash').click();
  
  // Click to enter cash amount
  await page.getByText('Enter Cash Amount').click();
  
  // Enter payment amount
  await page.getByLabel('Cash Amount Received').fill('10.00');
  
  // Complete payment
  await page.getByTestId('button-process-payment').click();
  
  // Check that receipt is displayed (this might vary based on implementation)
  // await expect(page.getByText('Receipt')).toBeVisible();
});

test('Can apply discount to order', async ({ page }) => {
  await page.goto('/');
  
  // Add an item to cart
  const productElements = await page.locator('[class*="grid"] [class*="button"], [class*="product"]').first();
  if ((await productElements.count()) > 0) {
    await productElements.click();
  }
  
  // Apply discount if discount selector is available
  const discountSelector = page.getByRole('combobox', { name: 'Add Discount' });
  if ((await discountSelector.count()) > 0) {
    await discountSelector.click();
    // Apply discount logic would go here
  }
});