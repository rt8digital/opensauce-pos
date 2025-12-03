import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { NetworkStatusIndicator } from "@/components/network-status-indicator";
import { offlineSync } from "@/lib/offline-sync";
import NotFound from "@/pages/not-found";
import POS from "@/pages/pos";
import Inventory from "@/pages/inventory";
import Sales from "@/pages/sales";
import Customers from "@/pages/customers";
import Discounts from "@/pages/discounts";
import CustomerDisplay from "@/pages/customer-display";
import Settings from "@/pages/settings";
import Setup from "@/pages/setup";
import Login from "@/pages/login";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Settings as SettingsType, User } from "@shared/schema";
import { TranslationProvider } from "@/hooks/use-translation";

function Router() {
  return (
    <Switch>
      <Route path="/setup" component={Setup} />
      <Route path="/login" component={Login} />
      <Route path="/" component={POS} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/sales" component={Sales} />
      <Route path="/customers" component={Customers} />
      <Route path="/discounts" component={Discounts} />
      <Route path="/customer-display" component={CustomerDisplay} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Check if first-time setup is needed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.status === 401 || response.status === 403) {
          // No authentication, check if setup is needed
          const setupResponse = await fetch('/api/auth/setup', {
            method: 'HEAD'
          });
          if (setupResponse.status === 200) {
            // Setup is needed
            navigate('/setup');
          } else {
            // Setup is complete, user needs to login
            navigate('/login');
          }
        } else if (!isAuthenticated && window.location.pathname !== '/login') {
          // Setup is complete but user needs to login
          navigate('/login');
        }
      } catch (error) {
        // If error, assume setup might be needed
        console.error('Setup check error:', error);
        navigate('/setup');
      }
    };

    checkSetup();
  }, [isAuthenticated, navigate]);

  return <>{children}</>;
}

function AppContent() {
  const { data: settings } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    // Initialize offline sync system
    offlineSync.initialize().catch(console.error);
  }, []);

  useEffect(() => {
    if (settings?.theme) {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(settings.theme);
    }
  }, [settings?.theme]);

  return (
    <AuthProvider>
      <CurrencyProvider>
        <TranslationProvider>
          <AuthWrapper>
            <Router />
            <Toaster />
            <NetworkStatusIndicator />
          </AuthWrapper>
        </TranslationProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
