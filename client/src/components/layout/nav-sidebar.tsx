import { Link, useLocation } from 'wouter';
import { ShoppingCart, Package, TrendingUp, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'POS', href: '/', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: TrendingUp },
];

export function NavSidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-card border-r h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6" />
          <h1 className="text-xl font-bold">POS System</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>v1.0.0</p>
      </div>
    </div>
  );
}
