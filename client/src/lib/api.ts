export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if we're running in Electron and can use direct database access
  if (window.electronAPI) {
    // Use direct database functions via Electron IPC
    const electronAPI = window.electronAPI;

    // Map API endpoints to direct database functions
    if (url.startsWith('/api/orders')) {
      if (method === 'GET') {
        // Check if date range parameters are provided in the URL
        const urlObj = new URL(`http://localhost${url}`);
        const startDate = urlObj.searchParams.get('startDate');
        const endDate = urlObj.searchParams.get('endDate');

        let orders;
        if (startDate && endDate) {
          // Get orders by date range
          orders = await electronAPI.getOrdersByDateRange(startDate, endDate);
        } else if (url === '/api/orders') {
          // Get all orders (no date range parameters)
          orders = await electronAPI.getOrders();
        } else {
          // Handle specific order by ID case
          const id = parseInt(url.split('/').pop() || '0');
          if (!isNaN(id)) {
            const order = await electronAPI.getOrderById(id);
            return {
              ok: !!order,
              json: () => Promise.resolve(order),
              status: order ? 200 : 404,
              statusText: order ? 'OK' : 'Not Found'
            } as Response;
          } else {
            // Return empty array if invalid ID
            orders = [];
          }
        }

        // Simulate Response object for compatibility
        return {
          ok: true,
          json: () => Promise.resolve(orders),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/orders') {
        // Create order
        const order = await electronAPI.createOrder(data);
        return {
          ok: true,
          json: () => Promise.resolve(order),
          status: 201,
          statusText: 'Created'
        } as Response;
      } else if (method === 'GET' && url.includes('/api/orders/')) {
        // Get specific order by ID
        const id = parseInt(url.split('/').pop() || '0');
        const order = await electronAPI.getOrderById(id);
        return {
          ok: !!order,
          json: () => Promise.resolve(order),
          status: order ? 200 : 404,
          statusText: order ? 'OK' : 'Not Found'
        } as Response;
      }
    } else if (url.startsWith('/api/products')) {
      if (method === 'GET' && url === '/api/products') {
        // Get all products
        const products = await electronAPI.getProducts();
        return {
          ok: true,
          json: () => Promise.resolve(products),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'GET' && url.match(/^\/api\/products\/\d+$/)) {
        // Get specific product by ID
        const id = parseInt(url.split('/').pop() || '0');
        const product = await electronAPI.getProductById(id);
        return {
          ok: !!product,
          json: () => Promise.resolve(product),
          status: product ? 200 : 404,
          statusText: product ? 'OK' : 'Not Found'
        } as Response;
      } else if (method === 'POST' && url === '/api/products') {
        // Create product
        const product = await electronAPI.createProduct(data);
        return {
          ok: true,
          json: () => Promise.resolve(product),
          status: 201,
          statusText: 'Created'
        } as Response;
      } else if (method === 'PATCH' && url.includes('/api/products/')) {
        // Update product
        const id = parseInt(url.split('/').pop() || '0'); // /api/products/{id}
        const product = await electronAPI.updateProduct(id, data);
        return {
          ok: true,
          json: () => Promise.resolve(product),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'DELETE' && url.includes('/api/products/')) {
        // Delete product
        const id = parseInt(url.split('/').pop() || '0'); // /api/products/{id}
        await electronAPI.deleteProduct(id);
        return {
          ok: true,
          json: () => Promise.resolve({}),
          status: 204,
          statusText: 'No Content'
        } as Response;
      } else if (method === 'GET' && url.includes('/api/products/barcode/')) {
        // Get product by barcode
        const barcode = url.split('/').pop() || ''; // /api/products/barcode/{barcode}
        const product = await electronAPI.getProductByBarcode(barcode);
        return {
          ok: !!product,
          json: () => Promise.resolve(product),
          status: product ? 200 : 404,
          statusText: product ? 'OK' : 'Not Found'
        } as Response;
      }
    } else if (url.startsWith('/api/customers')) {
      if (method === 'GET' && url === '/api/customers') {
        // Get all customers
        const customers = await electronAPI.getCustomers();
        return {
          ok: true,
          json: () => Promise.resolve(customers),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/customers') {
        // Create customer
        const customer = await electronAPI.createCustomer(data);
        return {
          ok: true,
          json: () => Promise.resolve(customer),
          status: 201,
          statusText: 'Created'
        } as Response;
      } else if (method === 'GET' && url.match(/^\/api\/customers\/\d+$/)) {
        // Get specific customer by ID
        const id = parseInt(url.split('/').pop() || '0');
        const customer = await electronAPI.getCustomerById(id);
        return {
          ok: !!customer,
          json: () => Promise.resolve(customer),
          status: customer ? 200 : 404,
          statusText: customer ? 'OK' : 'Not Found'
        } as Response;
      } else if (method === 'PATCH' && url.includes('/api/customers/')) {
        // Update customer
        const id = parseInt(url.split('/').pop() || '0');
        const customer = await electronAPI.updateCustomer(id, data);
        return {
          ok: true,
          json: () => Promise.resolve(customer),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'DELETE' && url.includes('/api/customers/')) {
        // Delete customer
        const id = parseInt(url.split('/').pop() || '0');
        await electronAPI.deleteCustomer(id);
        return {
          ok: true,
          json: () => Promise.resolve({}),
          status: 204,
          statusText: 'No Content'
        } as Response;
      }
    } else if (url.startsWith('/api/categories')) {
      if (method === 'GET' && url === '/api/categories') {
        // Get all categories
        const categories = await electronAPI.getCategories();
        return {
          ok: true,
          json: () => Promise.resolve(categories),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/categories') {
        // Create category
        const category = await electronAPI.createCategory(data);
        return {
          ok: true,
          json: () => Promise.resolve(category),
          status: 201,
          statusText: 'Created'
        } as Response;
      } else if (method === 'DELETE' && url.includes('/api/categories/')) {
        // Delete category
        const id = parseInt(url.split('/').pop() || '0'); // /api/categories/{id}
        await electronAPI.deleteCategory(id);
        return {
          ok: true,
          json: () => Promise.resolve({}),
          status: 204,
          statusText: 'No Content'
        } as Response;
      }
    } else if (url.startsWith('/api/discounts')) {
      if (method === 'GET' && url === '/api/discounts') {
        // Get all discounts
        const discounts = await electronAPI.getDiscounts();
        return {
          ok: true,
          json: () => Promise.resolve(discounts),
          status: 200,
          statusText: 'OK'
        } as Response;
      }
    } else if (url.startsWith('/api/settings')) {
      if (method === 'GET' && url === '/api/settings') {
        // Get settings
        const settings = await electronAPI.getSettings();
        // Also update the local cache
        if (settings) {
          const { storage } = await import("@/lib/storage");
          await storage.updateSettings(settings);
        }
        return {
          ok: !!settings,
          json: () => Promise.resolve(settings),
          status: settings ? 200 : 404,
          statusText: settings ? 'OK' : 'Not Found'
        } as Response;
      } else if (method === 'PATCH' && url === '/api/settings') {
        // Update settings
        const settings = await electronAPI.updateSettings(data);
        // Also update the local cache
        if (settings) {
          const { storage } = await import("@/lib/storage");
          await storage.updateSettings(settings);
        }
        return {
          ok: true,
          json: () => Promise.resolve(settings),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/database/factory-reset') {
        // Factory reset database
        const result = await electronAPI.factoryReset();
        return {
          ok: true,
          json: () => Promise.resolve(result),
          status: 200,
          statusText: 'OK'
        } as Response;
      }
    } else if (url.startsWith('/api/users')) {
      if (method === 'GET' && url === '/api/users') {
        // Get all users
        const users = await electronAPI.getUsers();
        return {
          ok: true,
          json: () => Promise.resolve(users),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/users') {
        // Create user
        const user = await electronAPI.createUser(data);
        return {
          ok: true,
          json: () => Promise.resolve(user),
          status: 201,
          statusText: 'Created'
        } as Response;
      } else if (method === 'PATCH' && url.includes('/api/users/')) {
        // Check if it's changing the PIN
        if (url.includes('/pin')) {
          // Change user PIN
          const id = parseInt(url.split('/')[3]); // /api/users/{id}/pin
          const result = await electronAPI.changeUserPin(id, (data as any).pin);
          return {
            ok: true,
            json: () => Promise.resolve(result),
            status: 200,
            statusText: 'OK'
          } as Response;
        } else {
          // Update user
          const id = parseInt(url.split('/').pop() || '0'); // /api/users/{id}
          const user = await electronAPI.updateUser(id, data);
          return {
            ok: true,
            json: () => Promise.resolve(user),
            status: 200,
            statusText: 'OK'
          } as Response;
        }
      } else if (method === 'DELETE' && url.includes('/api/users/')) {
        // Delete user
        const id = parseInt(url.split('/').pop() || '0'); // /api/users/{id}
        await electronAPI.deleteUser(id);
        return {
          ok: true,
          json: () => Promise.resolve({}),
          status: 204,
          statusText: 'No Content'
        } as Response;
      }
    } else if (url.startsWith('/api/auth')) {
      if (method === 'POST' && url === '/api/auth/login') {
        // Login
        const loginData = data as { pin: string };
        const result = await electronAPI.login(loginData.pin);
        return {
          ok: true,
          json: () => Promise.resolve(result),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'HEAD' && url === '/api/auth/setup') {
        // Check if setup is needed
        const setupNeeded = await electronAPI.checkSetupNeeded();
        return {
          ok: setupNeeded,
          json: () => Promise.resolve({}),
          status: setupNeeded ? 200 : 404,
          statusText: setupNeeded ? 'OK' : 'Not Found'
        } as Response;
      } else if (method === 'POST' && url === '/api/auth/setup') {
        // Setup
        const result = await electronAPI.setup(data);
        return {
          ok: true,
          json: () => Promise.resolve(result),
          status: 201,
          statusText: 'Created'
        } as Response;
      }
    } else if (url.startsWith('/api/user-preferences')) {
      if (method === 'GET' && url.match(/^\/api\/user-preferences\/[^\/]+$/)) {
        // Get user preference by key
        const key = url.split('/').pop() || '';
        const preference = await electronAPI.getUserPreference(key);
        return {
          ok: true,
          json: () => Promise.resolve(preference),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/user-preferences') {
        // Set user preference
        const preference = await electronAPI.setUserPreference(data as { key: string; value: string });
        return {
          ok: true,
          json: () => Promise.resolve(preference),
          status: 201,
          statusText: 'Created'
        } as Response;
      }
    } else if (url.startsWith('/api/cash-outs')) {
      if (method === 'GET' && url.startsWith('/api/cash-outs/daily-summary')) {
        // Get daily cash out summary
        const urlObj = new URL(`http://localhost${url}`);
        const date = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const summary = await electronAPI.getDailyCashOutSummary(date);
        return {
          ok: true,
          json: () => Promise.resolve(summary),
          status: 200,
          statusText: 'OK'
        } as Response;
      } else if (method === 'POST' && url === '/api/cash-outs') {
        // Create cash out
        const cashOut = await electronAPI.createCashOut(data);
        return {
          ok: true,
          json: () => Promise.resolve(cashOut),
          status: 201,
          statusText: 'Created'
        } as Response;
      } else if (method === 'GET' && url === '/api/cash-outs') {
        // Get all cash outs
        const cashOuts = await electronAPI.getCashOuts();
        return {
          ok: true,
          json: () => Promise.resolve(cashOuts),
          status: 200,
          statusText: 'OK'
        } as Response;
      }
    } else if (url.startsWith('/api/printer')) {
      if (url === '/api/printer/print') {
        const result = await (data as any).printerType === 'bluetooth'
          ? { success: false, error: 'Bluetooth not handled by Electron' }
          : await (window as any).electronAPI.printEscPos(data);
        return {
          ok: result.success,
          json: () => Promise.resolve(result),
          status: result.success ? 200 : 500,
          statusText: result.success ? 'OK' : 'Error'
        } as Response;
      } else if (url === '/api/printer/test') {
        const { printerType, printerAddress } = data as any;
        const result = await (window as any).electronAPI.testPrinter(printerType, printerAddress);
        return {
          ok: result.success,
          json: () => Promise.resolve(result),
          status: result.success ? 200 : 500,
          statusText: result.success ? 'OK' : 'Error'
        } as Response;
      }
    }
  }

  // Fallback to original API request for web environments
  // Check if we're in client mode and need to redirect requests to server
  const { storage } = await import("@/lib/storage");
  const settings = await storage.getSettings();
  let targetUrl = url;

  if (settings?.deviceRole === 'client' && settings.serverIpAddress) {
    // Redirect API requests to the server
    targetUrl = `http://${settings.serverIpAddress}:5001${url}`;
  } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Browser development mode - connect directly to backend server
    targetUrl = `http://localhost:5001${url}`;
  }

  const res = await fetch(targetUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export async function getUserPreference(key: string) {
  const response = await apiRequest('GET', `/api/user-preferences/${key}`);
  return response.json();
}

export async function setUserPreference(data: { key: string; value: string }) {
  const response = await apiRequest('POST', '/api/user-preferences', data);
  return response.json();
}