import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
export { apiRequest, throwIfResNotOk } from './api';
import { apiRequest, throwIfResNotOk } from './api';

console.log("queryClient.ts loaded successfully");

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const url = queryKey[0] as string;

      // Check if we're running in Electron and can use direct database access
      if (window.electronAPI) {
        const electronAPI = window.electronAPI;

        // Map API endpoints to direct database functions
        if (url.startsWith('/api/orders')) {
          // Check if date range parameters are provided in the URL
          const urlObj = new URL(`http://localhost${url}`);
          const startDate = urlObj.searchParams.get('startDate');
          const endDate = urlObj.searchParams.get('endDate');

          if (startDate && endDate) {
            // Get orders by date range
            return await electronAPI.getOrdersByDateRange(startDate, endDate);
          } else if (url === '/api/orders') {
            // Get all orders
            const orders = await electronAPI.getOrders();
            return orders;
          } else {
            // Handle specific order by ID case
            const id = parseInt(url.split('/').pop() || '0');
            if (!isNaN(id)) {
              return await electronAPI.getOrderById(id);
            } else {
              // Return empty array if invalid ID
              return [];
            }
          }
        } else if (url === '/api/products') {
          const products = await electronAPI.getProducts();
          return products;
        } else if (url.match(/^\/api\/products\/\d+$/)) {
          const id = parseInt(url.split('/').pop() || '0');
          return await electronAPI.getProductById(id);
        } else if (url === '/api/customers') {
          const customers = await electronAPI.getCustomers();
          return customers;
        } else if (url.match(/^\/api\/customers\/\d+$/)) {
          const id = parseInt(url.split('/').pop() || '0');
          return await electronAPI.getCustomerById(id);
        } else if (url === '/api/categories') {
          const categories = await electronAPI.getCategories();
          return categories;
        } else if (url.match(/^\/api\/categories\/\d+$/)) {
          const id = parseInt(url.split('/').pop() || '0');
          const categories = await electronAPI.getCategories();
          return categories.find((c: any) => c.id === id);
        } else if (url === '/api/discounts') {
          const discounts = await electronAPI.getDiscounts();
          return discounts;
        } else if (url === '/api/settings') {
          const settings = await electronAPI.getSettings();
          // Also update the local cache
          if (settings) {
            await storage.updateSettings(settings);
          }
          return settings;
        } else if (url === '/api/users') {
          const users = await electronAPI.getUsers();
          return users;
        } else if (url.match(/^\/api\/users\/\d+$/) && !url.includes('/pin')) {
          // Get specific user by ID - not typically used in getQueryFn since it's for lists
          const id = parseInt(url.split('/').pop() || '0');
          // This would be handled by a different query key, so we'll return the list
          const users = await electronAPI.getUsers();
          return users;
        } else if (url === '/api/auth/setup') {
          // This is a HEAD request, but we'll handle it as a check
          const setupNeeded = await electronAPI.checkSetupNeeded();
          return setupNeeded ? {} : null;
        } else if (url.startsWith('/api/cash-outs/daily-summary')) {
          // Get daily cash out summary
          const urlObj = new URL(`http://localhost${url}`);
          const date = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];
          return await electronAPI.getDailyCashOutSummary(date);
        }
      }

      // Fallback to original implementation for web environments
      // Only check for redirection if this is not a settings request
      // to avoid circular dependency
      let targetUrl = url;
      if (!url.includes('/api/settings')) {
        // Check if we're in client mode and need to redirect requests to server
        const settings = await storage.getSettings();

        if (settings?.deviceRole === 'client' && settings.serverIpAddress) {
          // Redirect API requests to the server
          targetUrl = `http://${settings.serverIpAddress}:5001${targetUrl}`;
        } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          // Browser development mode - connect directly to backend server
          targetUrl = `http://localhost:5001${targetUrl}`;
        }
      } else {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          // Browser development mode - connect directly to backend server
          targetUrl = `http://localhost:5001${targetUrl}`;
        }
      }

      const res = await fetch(targetUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch on window focus
      staleTime: 30 * 1000, // 30 seconds instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});