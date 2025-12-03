import { Link, useLocation } from 'wouter';
import { ShoppingCart, Package, TrendingUp, Home, Menu, Users, Tag, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Settings } from '@shared/schema';

const navigation = [
  { name: 'POS', href: '/', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: TrendingUp },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Discounts', href: '/discounts', icon: Tag },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function NavSidebar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="bg-card h-full flex flex-col">
      <div className={cn("flex items-center gap-2", collapsed ? "p-3 justify-center" : "p-4 md:p-6")}>
        <Home className="h-5 w-5 md:h-6 md:w-6" />
        {!collapsed && <h1 className="text-lg font-bold md:text-xl">{settings?.storeName || 'OpenSauce P.O.S.'}</h1>}
      </div>

      <nav className={cn("flex-1 space-y-1", collapsed ? "px-2" : "px-2 md:px-4")}>
        {navigation.map((item) => {
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
      </nav>

      <div className="border-t">
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
            <p className="text-xs text-muted-foreground">v1.0.0</p>
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
    </div>
  );

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
