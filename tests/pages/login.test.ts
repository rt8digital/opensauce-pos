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

  // Fill in login form (using default PIN from setup)
  await page.getByTestId('login-pin-input').fill('123456');

  // Submit login
  await page.getByTestId('login-submit-button').click();

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

  // Fill in invalid PIN
  await page.getByTestId('login-pin-input').fill('000000');

  // Submit login
  await page.getByTestId('login-submit-button').click();

  // Check that error message is displayed
  await expect(page.getByTestId('login-error-message')).toContainText('Invalid PIN');
});
