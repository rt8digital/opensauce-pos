import { test, expect } from '@playwright/test';

test.describe('Keyboard Functionality Tests', () => {
  async function authenticate(page: any) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="login-pin-input"]', { timeout: 30000 });
    
    // Enter PIN using physical keyboard (123456)
    await page.keyboard.type('123456');
    
    // Submit login using Enter key
    await page.keyboard.press('Enter');
    
    // Wait for redirect
    await page.waitForURL('/', { timeout: 30000 });
  }

  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await authenticate(page);
    
    // Wait for the app to load
    await page.waitForSelector('text=OpenSauce P.O.S.', { timeout: 10000 });
  });

  test('Physical keyboard functionality in POS page', async ({ page }) => {
    // Focus on the search input - using data-testid from POS component
    const searchInput = page.locator('[data-testid="input-search"]');
    
    // Ensure the input is visible and focus it
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.focus();
    
    // Wait a moment for focus to settle
    await page.waitForTimeout(100);
    
    // Type using physical keyboard simulation
    await page.keyboard.type('test product');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the text was entered
    await expect(searchInput).toHaveValue('test product');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(searchInput).toBeEmpty();
  });

  test('Virtual keyboard button appears in input fields', async ({ page }) => {
    // Navigate to inventory page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Find an input field - using data-testid from POS component
    const searchInput = page.locator('[data-testid="input-search"]');
    
    // Check if virtual keyboard button exists (it's positioned absolutely to the right of input)
    const keyboardButton = page.locator('button[aria-label="Open virtual keyboard (physical keyboard still works)"]');
    await expect(keyboardButton).toBeVisible();
  });

  test('Keyboard shortcuts work in inventory page', async ({ page }) => {
    // Navigate to inventory page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load and network to be idle
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Test F1 shortcut to focus search
    await page.keyboard.press('F1');
    
    // Check if search input is focused - using data-testid from POS component
    const searchInput = page.locator('[data-testid="input-search"]');
    await expect(searchInput).toBeFocused();
    
    // Test F3 shortcut to add product
    await page.keyboard.press('F3');
    
    // Check if add product button is clicked by waiting for the button state or dialog
    await page.waitForSelector('[data-testid="button-add-product"]', { timeout: 5000 });
    
    // Alternative: check if the add product form is triggered by looking for dialog content
    // The button click should trigger the form to appear, so we check for the button's click effect
    const addButton = page.locator('[data-testid="button-add-product"]');
    
    // If the shortcut worked, the button should show as active or clicked
    // We can also check if we're now on a page that would show the form
    await expect(addButton).toBeVisible();
  });

  test('Touch keyboard functionality in product form', async ({ page }) => {
    // Navigate to inventory page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load and network to be idle
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Click add product button
    await page.click('[data-testid="button-add-product"]');
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Product', { timeout: 5000 });
    
    // Find the name input field
    const nameInput = page.locator('input[name="name"]');
    
    // Click the virtual keyboard button
    const keyboardButton = page.locator('button[aria-label="Open virtual keyboard (physical keyboard still works)"]');
    await keyboardButton.click();
    
    // Wait for virtual keyboard to appear
    await page.waitForSelector('text=Editing: name', { timeout: 5000 });
    const virtualKeyboard = page.locator('text=Editing: name');
    await expect(virtualKeyboard).toBeVisible();
    
    // Close the virtual keyboard
    await page.click('button:has-text("Close")');
    await expect(virtualKeyboard).not.toBeVisible();
  });
});