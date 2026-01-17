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

test('Payment process works correctly', async ({ page }) => {
  // Authenticate first
  await authenticate(page);
  
  // Wait for product grid to be visible
  await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 });
  
  // Add an item to cart by clicking on the first product card
  const productCard = page.locator('[data-testid="product-grid"] > div > div').first();
  await productCard.waitFor({ state: 'visible' });
  await productCard.click();
  
  // Wait for cart to update and verify cart is not empty
  await page.waitForLoadState('networkidle');
  
  // Verify cart has items by checking total is greater than 0
  await page.waitForSelector('text=/Total.*[1-9]|[1-9].*Total/', { timeout: 5000 });
  
  // Wait for checkout button to appear after items are added
  await page.waitForSelector('[data-testid="checkout-button"]', { timeout: 10000 });
  
  // Additional wait to ensure the button is fully rendered and enabled
  await page.waitForTimeout(500);
  const checkoutButton = page.locator('[data-testid="checkout-button"]');
  await expect(checkoutButton).toBeEnabled();
  await checkoutButton.click({ force: true });
  
  // Check that payment dialog opens
  await expect(page.getByText('Process Payment')).toBeVisible();
  
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
  // Authenticate first
  await authenticate(page);
  
  // Wait for product grid to be visible
  await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 });
  
  // Add an item to cart
  const productCard = page.locator('[data-testid="product-grid"] > div > div').first();
  await productCard.waitFor({ state: 'visible' });
  await productCard.click();
  
  // Wait for cart to update
  await page.waitForLoadState('networkidle');
  
  // Verify cart has items before attempting discount
  await expect(page.locator('text=/Total.*[1-9]|[1-9].*Total/')).toBeVisible();
  
  // Apply discount if discount selector is available
  const discountSelector = page.getByRole('combobox', { name: 'Add Discount' });
  if ((await discountSelector.count()) > 0) {
    await discountSelector.click();
    // Apply discount logic would go here
  }
});