import { test, expect } from '@playwright/test';

test('Basic page load test', async ({ page }) => {
  await page.goto('/login');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Just check if the page loads and has a title
  await expect(page).toHaveTitle(/OpenSauce/);
});

test('Successful login redirects to POS', async ({ page }) => {
  await page.goto('/login');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for login form to be ready
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

  // Wait for redirect and check that we're on POS page
  await page.waitForURL('/', { timeout: 30000 });
  await expect(page.getByTestId('nav-pos')).toBeVisible();
});

test('Invalid login shows error message', async ({ page }) => {
  await page.goto('/login');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for login form to be ready
  await page.waitForSelector('[data-testid="login-pin-input"]', { timeout: 30000 });

  // Enter invalid PIN using PinKeypad buttons (000000)
  await page.getByRole('button', { name: '0' }).click();
  await page.getByRole('button', { name: '0' }).click();
  await page.getByRole('button', { name: '0' }).click();
  await page.getByRole('button', { name: '0' }).click();
  await page.getByRole('button', { name: '0' }).click();
  await page.getByRole('button', { name: '0' }).click();

  // Submit login
  await page.getByRole('button', { name: 'Enter' }).click();

  // Check that error message is displayed
  await expect(page.getByTestId('login-error-message')).toContainText('Invalid PIN');
});
