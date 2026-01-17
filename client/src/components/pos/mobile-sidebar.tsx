import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, ShoppingCart, Calculator } from 'lucide-react';
import type { Customer, Product } from '../../../../shared/types';

interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
    originalPrice?: string;
    discountedPrice?: string;
}

interface MobileSidebarProps {
    currentMobileView: 'inventory' | 'keypad' | 'cart';
    onViewChange: (view: 'inventory' | 'keypad' | 'cart') => void;
    cart: CartItem[];
    selectedCustomer?: Customer | null;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
    currentMobileView,
    onViewChange,
    cart,
    selectedCustomer
}) => {
    return (
        <div className={`fixed left-0 top-0 bottom-0 w-16 bg-background border-r z-30 flex flex-col items-center py-4 space-y-4 md:hidden`}>
            <div className="h-12 w-12 flex items-center justify-center">
                <img src="logo.png" alt="Logo" className="h-6 w-6 object-contain" />
            </div>

            <Button
                variant={currentMobileView === 'inventory' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('inventory')}
                className="h-10 w-10"
            >
                <Grid3X3 className="h-5 w-5" />
            </Button>

            <Button
                variant={currentMobileView === 'cart' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('cart')}
                className="h-10 w-10 relative"
            >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-background">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                )}
            </Button>

            <Button
                variant={currentMobileView === 'keypad' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('keypad')}
                className="h-10 w-10"
            >
                <Calculator className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            {selectedCustomer && (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-200" title={selectedCustomer.name}>
                    {selectedCustomer.name.charAt(0)}
                </div>
            )}
        </div>
    );
};

export default MobileSidebar;