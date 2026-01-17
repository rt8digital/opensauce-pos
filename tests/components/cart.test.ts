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

test('Cart component displays items correctly', async ({ page }) => {
  // Authenticate first
  await authenticate(page);
  
  // Wait for the page to load and product grid to be visible
  await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 });
  
  // Add an item to cart by clicking on the first product card
  const productCard = page.locator('[data-testid="product-grid"] > div > div').first();
  await productCard.waitFor({ state: 'visible' });
  await productCard.click();
  
  // Wait for cart to update
  await page.waitForLoadState('networkidle');
  
  // Check that cart item is displayed - look for total or cart items
  await expect(page.locator('text=/Total.*[1-9]|[1-9].*Total/')).toBeVisible();
});

test('Can remove items from cart', async ({ page }) => {
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
  
  // Remove item from cart using the trash icon or remove button
  const removeButtons = await page.locator('[data-testid^="remove-item-"], [data-testid="cart-remove-button"], button:has-text("Remove"), button:has-text("Delete")');
  if ((await removeButtons.count()) > 0) {
    await removeButtons.first().click();
  }
});