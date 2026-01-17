import { Link, useLocation } from 'wouter';
import { ShoppingCart, Package, TrendingUp, Menu, Users, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen, RefreshCw, LogOut, Power, UserX, DollarSign, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Settings } from '../../../../shared/types';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/contexts/sidebar-context';
import { useAuth } from '@/contexts/auth-context';

const navigation = [
  { name: 'POS', href: '/', icon: ShoppingCart },
  { name: 'Stock', href: '/inventory', icon: Package },
  { name: 'Reports', href: '/sales', icon: TrendingUp },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function NavSidebar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Check if we're online before attempting to refresh
      if (!navigator.onLine) {
        toast({
          title: 'Offline',
          description: 'You are currently offline. Data will sync when you reconnect.',
          variant: 'destructive',
        });
        return;
      }

      // Determine which queries to invalidate based on the current page
      const queriesToInvalidate = [];

      // Common queries that should be refreshed on all pages (except settings)
      if (location !== '/settings') {
        queriesToInvalidate.push(
          { queryKey: ['/api/settings'] }
        );
      }

      switch (location) {
        case '/':
          // POS page - refresh products, categories, and orders
          queriesToInvalidate.push(
            { queryKey: ['/api/products'] },
            { queryKey: ['/api/categories'] },
            { queryKey: ['/api/orders'] },
            { queryKey: ['/api/customers'] },
            { queryKey: ['/api/discounts'] }
          );
          break;
        case '/inventory':
          // Inventory page - refresh products and categories
          queriesToInvalidate.push(
            { queryKey: ['/api/products'] },
            { queryKey: ['/api/categories'] },
            { queryKey: ['/api/products', 'low-stock'] }
          );
          break;
        case '/sales':
          // Sales/reports page - refresh orders and products
          queriesToInvalidate.push(
            { queryKey: ['/api/orders'] },
            { queryKey: ['/api/products'] },
            { queryKey: ['/api/customers'] }
          );
          break;
        case '/customers':
          // Customers page - refresh customers
          queriesToInvalidate.push(
            { queryKey: ['/api/customers'] }
          );
          break;
        case '/settings':
          // Settings page - refresh everything except settings to avoid losing unsaved changes
          queriesToInvalidate.push(
            { queryKey: ['/api/products'] },
            { queryKey: ['/api/categories'] },
            { queryKey: ['/api/orders'] },
            { queryKey: ['/api/customers'] },
            { queryKey: ['/api/discounts'] }
          );
          break;
        case '/discounts':
          // Discounts page - refresh discounts
          queriesToInvalidate.push(
            { queryKey: ['/api/discounts'] }
          );
          break;
        default:
          // Default - refresh common queries
          queriesToInvalidate.push(
            { queryKey: ['/api/products'] },
            { queryKey: ['/api/categories'] },
            { queryKey: ['/api/customers'] }
          );
      }

      // Invalidate all relevant queries and ensure at least 500ms of animation
      const [results] = await Promise.all([
        Promise.allSettled(
          queriesToInvalidate.map(query => queryClient.invalidateQueries(query))
        ),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);

      // Count successful and failed invalidations
      const failed = results.filter(result => result.status === 'rejected').length;

      if (failed > 0) {
        toast({
          title: 'Partial Refresh',
          description: `Data refresh completed with ${failed} error(s).`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Page Refreshed',
          description: 'Data has been refreshed successfully.',
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh data. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => {
    const { logout, isAdmin } = useAuth();
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const [showShutdownDialog, setShowShutdownDialog] = useState(false);

    const handleSignOut = () => { logout(); setShowSignOutDialog(false); };
    const handleShutdown = () => { window.electronAPI?.shutdown?.(); setShowShutdownDialog(false); };

    return (
      <div className="bg-card h-full flex flex-col">
        <div className={cn("flex items-center gap-2", collapsed ? "p-3 justify-center" : "p-4 md:p-6")}>
          <img src="logo.png" alt="Logo" className="h-5 w-5 md:h-6 md:w-6 object-contain dark:invert" />
          {!collapsed && <h1 className="text-lg font-bold md:text-xl">{settings?.storeName || 'OpenSauce P.O.S.'}</h1>}
        </div>

        <nav className={cn("flex-1 space-y-1", collapsed ? "px-2" : "px-2 md:px-4")}>
          {navigation.filter(item => {
            // Hide Settings for non-admins
            if (item.name === 'Settings') {
              return isAdmin;
            }
            return true;
          }).map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-2 py-2 md:px-3 md:py-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>
              </Link>
            );
          })}

          {/* Refresh Button */}
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-2 py-2 md:px-3 md:py-2',
              'hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="nav-refresh"
            title={isRefreshing ? 'Refreshing data...' : 'Refresh current page data'}
            aria-label={isRefreshing ? 'Refreshing data' : 'Refresh data'}
          >
            <RefreshCw className={cn(
              "h-4 w-4 md:h-5 md:w-5",
              isRefreshing ? "animate-spin text-orange-500" : "text-green-600"
            )} />
            {!collapsed && <span className="truncate">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>}
          </Button>
        </nav>

        {/* Cash Out Button - only on sales page */}
        {location === '/sales' && (
          <div className={cn("border-t", collapsed ? "p-2" : "p-2 md:p-4")}>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-2 py-2 md:px-3 md:py-2',
                'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => {
                // Navigate to sales and open cash out dialog
                // Since we're on sales, just open the dialog
                // But to trigger from sidebar, we need to communicate with sales page
                // For now, navigate to sales if not there, but since we check location === '/sales', we're there.
                // Ideally, we'd use a global state or context to open the dialog.
                // For simplicity, perhaps navigate to sales with a param, but better to use existing pattern.
                // Since the sales page manages its own state, we can use a custom event or context.
                // To keep it simple, let's use window.postMessage or similar.
                window.dispatchEvent(new CustomEvent('openCashOutDialog'));
              }}
            >
              <DollarSign className={cn("h-4 w-4 md:h-5 md:w-5")} />
              {!collapsed && <span className="truncate">Cash Out</span>}
            </Button>
          </div>
        )}

        {/* Camera Scan Button - only on POS page */}
        {location === '/' && (
          <div className={cn("border-t", collapsed ? "p-2" : "p-2 md:p-4")}>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-2 py-2 md:px-3 md:py-2',
                'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openCameraScan'));
              }}
              title="Camera Scan"
            >
              <Camera className={cn("h-4 w-4 md:h-5 md:w-5")} />
              {!collapsed && <span className="truncate">Camera Scan</span>}
            </Button>
          </div>
        )}

        <div className="border-t">
          <div className={cn("flex items-center", collapsed ? "justify-center p-2" : "gap-3 px-2 py-2 md:px-3 md:py-2")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-2 py-2 md:px-3 md:py-2',
                    'hover:bg-accent hover:text-accent-foreground'
                  )}
                  title="User menu"
                  aria-label="User menu"
                >
                  <UserX className="h-4 w-4 md:h-5 md:w-5" />
                  {!collapsed && <span className="truncate">User</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowSignOutDialog(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShutdownDialog(true)}>
                  <Power className="mr-2 h-4 w-4" />
                  Shutdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {collapsed ? (
            <div className="p-2 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(false)}
                className="h-8 w-8"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-3 md:p-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">v1.5.786</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? Any unsaved changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showShutdownDialog} onOpenChange={setShowShutdownDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Shutdown Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to shutdown the application? Any unsaved changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleShutdown}>Shutdown</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );

  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 md:hidden touch-target-min">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-60 md:w-64">
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("bg-card border-r h-screen flex flex-col hidden md:flex transition-all duration-300", isCollapsed ? "w-16" : "w-60 md:w-64")}>
      <SidebarContent collapsed={isCollapsed} />
    </div>
  );
}
