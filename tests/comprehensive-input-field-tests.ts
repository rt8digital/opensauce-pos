import { test, expect } from '@playwright/test';

test.describe('Comprehensive Input Field Keyboard Tests', () => {
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

  test('Physical keyboard functionality in POS page search input', async ({ page }) => {
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

  test('Numpad functionality in POS page search input', async ({ page }) => {
    // Focus on the search input - using data-testid from POS component
    const searchInput = page.locator('[data-testid="input-search"]');
    
    // Ensure the input is visible and focus it
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.focus();
    
    // Wait a moment for focus to settle
    await page.waitForTimeout(100);
    
    // Type using numpad simulation (numbers only)
    await page.keyboard.type('12345');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the numbers were entered
    await expect(searchInput).toHaveValue('12345');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(searchInput).toBeEmpty();
  });

  test('Physical keyboard functionality in Inventory page search input', async ({ page }) => {
    // Navigate to inventory page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Focus on the search input - using data-testid from Inventory component
    const searchInput = page.locator('[data-testid="input-search"]');
    
    // Ensure the input is visible and focus it
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.focus();
    
    // Wait a moment for focus to settle
    await page.waitForTimeout(100);
    
    // Type using physical keyboard simulation
    await page.keyboard.type('inventory item');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the text was entered
    await expect(searchInput).toHaveValue('inventory item');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(searchInput).toBeEmpty();
  });

  test('Numpad functionality in Inventory page search input', async ({ page }) => {
    // Navigate to inventory page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Focus on the search input - using data-testid from Inventory component
    const searchInput = page.locator('[data-testid="input-search"]');
    
    // Ensure the input is visible and focus it
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.focus();
    
    // Wait a moment for focus to settle
    await page.waitForTimeout(100);
    
    // Type using numpad simulation (numbers only)
    await page.keyboard.type('67890');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the numbers were entered
    await expect(searchInput).toHaveValue('67890');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(searchInput).toBeEmpty();
  });

  test('Physical keyboard functionality in product form inputs', async ({ page }) => {
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
    
    // Test name input field
    const nameInput = page.locator('input[name="name"]');
    await nameInput.focus();
    await page.keyboard.type('Test Product Name');
    await expect(nameInput).toHaveValue('Test Product Name');
    
    // Clear and test with numpad
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Product 123');
    await expect(nameInput).toHaveValue('Product 123');
    
    // Test price input field
    const priceInput = page.locator('input[name="price"]');
    await priceInput.focus();
    await page.keyboard.type('29.99');
    await expect(priceInput).toHaveValue('29.99');
    
    // Test with numpad only
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('12345');
    await expect(priceInput).toHaveValue('12345');
  });

  test('Numpad functionality in product form price input', async ({ page }) => {
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
    
    // Test price input field with numpad
    const priceInput = page.locator('input[name="price"]');
    await priceInput.focus();
    
    // Type using numpad simulation (numbers and decimal)
    await page.keyboard.type('19.99');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the price was entered
    await expect(priceInput).toHaveValue('19.99');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(priceInput).toBeEmpty();
  });

  test('Physical keyboard functionality in customer form inputs', async ({ page }) => {
    // Navigate to customers page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-customers"]', { timeout: 10000 });
    await page.getByTestId('nav-customers').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Customer Management', { timeout: 10000 });
    
    // Click add customer button
    await page.getByRole('button', { name: 'Add Customer' }).click();
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Customer', { timeout: 5000 });
    
    // Test name input field
    const nameInput = page.locator('input[name="name"]');
    await nameInput.focus();
    await page.keyboard.type('John Doe');
    await expect(nameInput).toHaveValue('John Doe');
    
    // Test email input field
    const emailInput = page.locator('input[name="email"]');
    await emailInput.focus();
    await page.keyboard.type('john.doe@example.com');
    await expect(emailInput).toHaveValue('john.doe@example.com');
    
    // Test phone input field
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.focus();
    await page.keyboard.type('+1234567890');
    await expect(phoneInput).toHaveValue('+1234567890');
  });

  test('Numpad functionality in customer form phone input', async ({ page }) => {
    // Navigate to customers page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-customers"]', { timeout: 10000 });
    await page.getByTestId('nav-customers').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Customer Management', { timeout: 10000 });
    
    // Click add customer button
    await page.getByRole('button', { name: 'Add Customer' }).click();
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Customer', { timeout: 5000 });
    
    // Test phone input field with numpad
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.focus();
    
    // Type using numpad simulation (numbers only)
    await page.keyboard.type('1234567890');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the phone number was entered
    await expect(phoneInput).toHaveValue('1234567890');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(phoneInput).toBeEmpty();
  });

  test('Physical keyboard functionality in settings form inputs', async ({ page }) => {
    // Navigate to settings page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-settings"]', { timeout: 10000 });
    await page.getByTestId('nav-settings').click();
    
    // Wait for page to load
    await page.waitForSelector('text=System Settings', { timeout: 10000 });
    
    // Find business name input field (may need to scroll to find it)
    const businessNameInput = page.locator('input[name="businessName"]');
    
    // Ensure the input is visible and focus it
    await businessNameInput.waitFor({ state: 'visible' });
    await businessNameInput.focus();
    
    // Wait a moment for focus to settle
    await page.waitForTimeout(100);
    
    // Type using physical keyboard simulation
    await page.keyboard.type('Test Business');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the text was entered
    await expect(businessNameInput).toHaveValue('Test Business');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(businessNameInput).toBeEmpty();
  });

  test('Numpad functionality in settings form inputs', async ({ page }) => {
    // Navigate to settings page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-settings"]', { timeout: 10000 });
    await page.getByTestId('nav-settings').click();
    
    // Wait for page to load
    await page.waitForSelector('text=System Settings', { timeout: 10000 });
    
    // Find tax rate input field
    const taxRateInput = page.locator('input[name="taxRate"]');
    
    // Ensure the input is visible and focus it
    await taxRateInput.waitFor({ state: 'visible' });
    await taxRateInput.focus();
    
    // Wait a moment for focus to settle
    await page.waitForTimeout(100);
    
    // Type using numpad simulation (numbers and decimal)
    await page.keyboard.type('15.5');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the tax rate was entered
    await expect(taxRateInput).toHaveValue('15.5');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(taxRateInput).toBeEmpty();
  });

  test('Physical keyboard functionality in discount form inputs', async ({ page }) => {
    // Navigate to discounts page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-discounts"]', { timeout: 10000 });
    await page.getByTestId('nav-discounts').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Discount Management', { timeout: 10000 });
    
    // Click add discount button
    await page.getByRole('button', { name: 'Add Discount' }).click();
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Discount', { timeout: 5000 });
    
    // Test name input field
    const nameInput = page.locator('input[name="name"]');
    await nameInput.focus();
    await page.keyboard.type('Holiday Discount');
    await expect(nameInput).toHaveValue('Holiday Discount');
    
    // Test value input field
    const valueInput = page.locator('input[name="value"]');
    await valueInput.focus();
    await page.keyboard.type('25');
    await expect(valueInput).toHaveValue('25');
  });

  test('Numpad functionality in discount form value input', async ({ page }) => {
    // Navigate to discounts page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-discounts"]', { timeout: 10000 });
    await page.getByTestId('nav-discounts').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Discount Management', { timeout: 10000 });
    
    // Click add discount button
    await page.getByRole('button', { name: 'Add Discount' }).click();
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Discount', { timeout: 5000 });
    
    // Test value input field with numpad
    const valueInput = page.locator('input[name="value"]');
    await valueInput.focus();
    
    // Type using numpad simulation (numbers only)
    await page.keyboard.type('15');
    
    // Wait for the value to be set
    await page.waitForTimeout(100);
    
    // Verify the value was entered
    await expect(valueInput).toHaveValue('15');
    
    // Clear the input
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Verify it's cleared
    await expect(valueInput).toBeEmpty();
  });

  test('Virtual keyboard functionality across different input types', async ({ page }) => {
    // Navigate to inventory page using reliable nav selector
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Click add product button
    await page.click('[data-testid="button-add-product"]');
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Product', { timeout: 5000 });
    
    // Test virtual keyboard with text input (name field)
    const nameInput = page.locator('input[name="name"]');
    await nameInput.focus();
    
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
    
    // Test virtual keyboard with numeric input (price field)
    const priceInput = page.locator('input[name="price"]');
    await priceInput.focus();
    
    // Click the virtual keyboard button
    await keyboardButton.click();
    
    // Wait for virtual keyboard to appear
    await page.waitForSelector('text=Editing: price', { timeout: 5000 });
    const numericVirtualKeyboard = page.locator('text=Editing: price');
    await expect(numericVirtualKeyboard).toBeVisible();
    
    // Close the virtual keyboard
    await page.click('button:has-text("Close")');
    await expect(numericVirtualKeyboard).not.toBeVisible();
  });

  test('Keyboard shortcuts work across all pages', async ({ page }) => {
    // Test F1 shortcut on POS page (focus search)
    await page.keyboard.press('F1');
    
    // Check if search input is focused
    const posSearchInput = page.locator('[data-testid="input-search"]');
    await expect(posSearchInput).toBeFocused();
    
    // Navigate to inventory page
    await page.waitForSelector('[data-testid="nav-stock"]', { timeout: 10000 });
    await page.getByTestId('nav-stock').click();
    
    // Wait for page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 10000 });
    
    // Test F1 shortcut on Inventory page (focus search)
    await page.keyboard.press('F1');
    
    // Check if search input is focused
    const inventorySearchInput = page.locator('[data-testid="input-search"]');
    await expect(inventorySearchInput).toBeFocused();
    
    // Test F3 shortcut to add product
    await page.keyboard.press('F3');
    
    // Check if add product form appears
    await page.waitForSelector('text=Add New Product', { timeout: 5000 });
    const addProductForm = page.locator('text=Add New Product');
    await expect(addProductForm).toBeVisible();
  });
});