import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { triggerSelectionHaptic } from '@/utils/capacitor';
import {
    Home,
    Package,
    Users,
    Settings,
    ShoppingCart,
    BarChart3
} from 'lucide-react';

interface TabItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: number;
}

const tabs: TabItem[] = [
    {
        id: 'pos',
        label: 'POS',
        icon: <ShoppingCart className="w-6 h-6" />,
        href: '/',
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: <Package className="w-6 h-6" />,
        href: '/inventory',
    },
    {
        id: 'sales',
        label: 'Sales',
        icon: <BarChart3 className="w-6 h-6" />,
        href: '/sales',
    },
    {
        id: 'customers',
        label: 'Customers',
        icon: <Users className="w-6 h-6" />,
        href: '/customers',
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="w-6 h-6" />,
        href: '/settings',
    },
];

export const MobileTabBar: React.FC = () => {
    const [location] = useLocation();

    const handleTabClick = async () => {
        await triggerSelectionHaptic();
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
            <div className="flex items-center justify-around h-16">
                {tabs.map((tab) => {
                    const isActive = location === tab.href || (tab.href !== '/' && location.startsWith(tab.href));

                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            onClick={handleTabClick}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full transition-colors relative',
                                'touch-target-min',
                                isActive
                                    ? 'text-blue-600'
                                    : 'text-gray-600 active:text-blue-600'
                            )}
                        >
                            <div className="relative">
                                {tab.icon}
                                {tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {tab.badge > 9 ? '9+' : tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                'text-xs mt-1 font-medium',
                                isActive && 'font-semibold'
                            )}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
