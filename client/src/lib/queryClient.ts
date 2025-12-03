import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { storage } from "@/lib/storage";

async function throwIfResNotOk(res: Response) {
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
  // Check if we're in client mode and need to redirect requests to server
  const settings = await storage.getSettings();
  let targetUrl = url;

  if (settings?.deviceRole === 'client' && settings.serverIpAddress) {
    // Redirect API requests to the server
    targetUrl = `http://${settings.serverIpAddress}:5001${url}`;
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

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      let targetUrl = queryKey[0] as string;

      // Only check for redirection if this is not a settings request
      // to avoid circular dependency
      if (!targetUrl.includes('/api/settings')) {
        // Check if we're in client mode and need to redirect requests to server
        const settings = await storage.getSettings();

        if (settings?.deviceRole === 'client' && settings.serverIpAddress) {
          // Redirect API requests to the server
          targetUrl = `http://${settings.serverIpAddress}:5001${targetUrl}`;
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
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
