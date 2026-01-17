import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "@/hooks/use-hash-location";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SnackbarProvider } from "@/components/ui/snackbar-provider";
import { offlineSync } from "@/lib/offline-sync";
import { socketClient } from "@/lib/socket";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { useEffect, Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Settings as SettingsType } from "../../shared/types";
import { TranslationProvider } from "@/hooks/use-translation";
import React from "react";
import { VirtualKeyboardProvider } from "@/contexts/virtual-keyboard-context";
import { VirtualKeyboard } from "@/components/virtual-keyboard/virtual-keyboard";
import { NavigationProvider } from "@/contexts/navigation-context";
import { SidebarProvider } from "@/contexts/sidebar-context";

// Lazy load pages for better performance
const POS = lazy(() => import("@/pages/pos"));
const Inventory = lazy(() => import("@/pages/inventory"));
const Sales = lazy(() => import("@/pages/sales"));
const Customers = lazy(() => import("@/pages/customers"));
const CustomerDisplay = lazy(() => import("@/pages/customer-display"));
const Settings = lazy(() => import("@/pages/settings"));
const Setup = lazy(() => import("@/pages/setup"));
const Login = lazy(() => import("@/pages/login"));
const MobileLink = lazy(() => import("@/pages/mobile-link"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Orders, BotSettings, and WhatsAppAdmin removed for core POS focus

function AppRouter() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium animate-pulse">Loading OpenSauce POS...</p>
        </div>
      </div>
    }>
      <Switch>
        <Route path="/setup" component={Setup} />
        <Route path="/login" component={Login} />
        <Route path="/" component={POS} />
        <Route path="/inventory" component={Inventory} />
        {/* Orders route removed for core POS focus */}
        <Route path="/sales" component={Sales} />
        <Route path="/customers" component={Customers} />
        <Route path="/customer-display" component={CustomerDisplay} />
        <Route path="/settings" component={Settings} />
        {/* BotSettings and WhatsAppAdmin routes removed for core POS focus */}
        <Route path="/mobile-link" component={MobileLink} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  console.log('AuthWrapper: rendering');
  const { isAuthenticated } = useAuth();
  console.log('AuthWrapper: useAuth return', { isAuthenticated });

  const [location, navigate] = useLocation();

  // Check database health and handle unauthorized access
  useEffect(() => {
    const initApp = async () => {
      try {
        if (window.electronAPI) {
          const api = window.electronAPI;
          // checkSetupNeeded now throws if DB is missing
          await api.checkSetupNeeded();

          if (!isAuthenticated && location !== '/login' && location !== '/setup' && location !== '/customer-display') {
            navigate('/login');
          }
        }
      } catch (error: any) {
        console.error('Database connection error:', error);
        // Any error here means the DB is physically broken or unreachable
        navigate('/setup'); // This is our red error page
      }
    };

    initApp();
  }, [isAuthenticated, navigate, location]);

  return <>{children}</>;
}

function AppContent() {
  // Debug log for electronAPI availability
  console.log('window.electronAPI:', typeof window.electronAPI, window.electronAPI ? 'defined' : 'undefined');

  const { data: settings } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
    retry: 1, // Only retry once to avoid endless retries when database is not initialized
  });

  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize offline sync system
    offlineSync.initialize().catch(console.error);
  }, []);

  // Setup menu event listeners for Electron
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onMenuNavigate) {
      const cleanupNavigate = window.electronAPI.onMenuNavigate((_event, path) => {
        navigate(path);
      });

      const cleanupRefresh = window.electronAPI.onMenuRefresh(() => {
        // Trigger a refresh by invalidating queries based on current location
        const currentPath = location;
        let queriesToInvalidate = ['/api/settings']; // Common queries

        switch (currentPath) {
          case '/':
            queriesToInvalidate.push('/api/products', '/api/categories', '/api/orders', '/api/customers', '/api/discounts');
            break;
          case '/inventory':
            queriesToInvalidate.push('/api/products', '/api/categories');
            break;
          case '/sales':
            queriesToInvalidate.push('/api/orders', '/api/products', '/api/customers');
            break;
          case '/customers':
            queriesToInvalidate.push('/api/customers');
            break;
          case '/settings':
            // Avoid refreshing settings to prevent losing unsaved changes
            break;
          default:
            queriesToInvalidate.push('/api/products', '/api/categories', '/api/customers');
        }

        queriesToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      });

      const cleanupAbout = window.electronAPI.onMenuAbout(() => {
        // Show about dialog or navigate to about page
        alert('OpenSauce POS v1.5.786\nPoint of Sale System');
      });

      return () => {
        cleanupNavigate();
        cleanupRefresh();
        cleanupAbout();
      };
    }
  }, [navigate, queryClient]);

  useEffect(() => {
    if (settings?.theme) {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(settings.theme);
    }
  }, [settings?.theme]);

  // Initialize socket client and remote scan handling
  useEffect(() => {
    // Initialize socket connection
    socketClient.reconnect();

    // Listen for remote barcode scans
    const removeRemoteScanListener = socketClient.onRemoteScan((data) => {
      console.log('Remote scan received:', data);

      // Dispatch a custom event that POS page can listen to
      const event = new CustomEvent('remoteBarcodeScan', {
        detail: { barcode: data.barcode, deviceId: data.deviceId }
      });
      window.dispatchEvent(event);
    });

    return () => {
      removeRemoteScanListener();
      socketClient.disconnect();
    };
  }, []);

  return (
    <AuthProvider>
      <CurrencyProvider>
        <TranslationProvider>
          <SidebarProvider>
            <AuthWrapper>
              <VirtualKeyboardProvider>
                <NavigationProvider>
                  <AppRouter />
                  <SnackbarProvider />
                  <VirtualKeyboard />
                </NavigationProvider>
              </VirtualKeyboardProvider>
            </AuthWrapper>
          </SidebarProvider>
        </TranslationProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

function App() {
  const isElectron = !!window.electronAPI;

  const content = (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );

  // Always use Router, but conditionally use hash routing for Electron
  if (isElectron) {
    return (
      <Router hook={useHashLocation}>
        {content}
      </Router>
    );
  }

  // For non-Electron environments, use default browser routing
  return (
    <Router>
      {content}
    </Router>
  );
}

export default App;