import React, { useState } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Cart } from "./cart";
import type { Product, Discount } from "@shared/schema";

interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
}

interface CartDrawerProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: number, delta: number) => void;
    onRemoveItem: (productId: number) => void;
    onCheckout: () => void;
    currency?: string;
    discounts?: Discount[];
    selectedDiscount?: Discount | null;
    onSelectDiscount?: (discount: Discount | null) => void;
}

export function CartDrawer({
    cart,
    onUpdateQuantity,
    onRemoveItem,
    onCheckout,
    currency = '$',
    discounts,
    selectedDiscount,
    onSelectDiscount
}: CartDrawerProps) {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button
                    size="lg"
                    className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50 touch-target-min md:bottom-6 md:right-6 md:h-14 md:w-14"
                >
                    <ShoppingCart className="h-6 w-6" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-background md:-top-2 md:-right-2 md:h-6 md:w-6">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[70vh] overflow-hidden">
                <DrawerHeader>
                    <DrawerTitle>Shopping Cart</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-hidden">
                    <Cart
                        cart={cart}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemoveItem={onRemoveItem}
                        onCheckout={onCheckout}
                        discounts={discounts}
                        selectedDiscount={selectedDiscount}
                        onSelectDiscount={onSelectDiscount}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
