import React from 'react';
import type { Product } from '../../../../shared/types';

export interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
    originalPrice?: string;
    discountedPrice?: string;
}

export const handleAddToCart = (
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
    product: Product
) => {
    setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
            return prev.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        }
        return [...prev, { product, quantity: 1 }];
    });
};

export const handleAddAmount = (
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
    amount: string
) => {
    setCart(prev => {
        // Count existing custom items to determine the next sequence number
        const customItemCount = prev.filter(item =>
            typeof item.product.name === 'string' &&
            item.product.name.startsWith('ITEM ')
        ).length;

        const nextItemNumber = customItemCount + 1;
        const id = Date.now();
        const item = {
            product: {
                id,
                name: `ITEM ${nextItemNumber}`,
                price: amount,
            },
            quantity: 1,
        };
        return [...prev, item];
    });
};

export const handleUpdateQuantity = (
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
    productId: number,
    delta: number
) => {
    setCart(prev =>
        prev.map(item =>
            item.product.id === productId
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
        )
    );
};

export const handleRemoveItem = (
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
    productId: number,
    setSelectedCartItemId?: React.Dispatch<React.SetStateAction<number | null>>,
    setIsMultiplicationMode?: React.Dispatch<React.SetStateAction<boolean>>,
    setMultiplicationMultiplier?: React.Dispatch<React.SetStateAction<string>>
) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    if (setSelectedCartItemId) {
        setSelectedCartItemId(prev => prev === productId ? null : prev);
    }
    if (setIsMultiplicationMode) setIsMultiplicationMode(false);
    if (setMultiplicationMultiplier) setMultiplicationMultiplier('');
};

export const handleSelectCartItem = (
    setSelectedCartItemId: React.Dispatch<React.SetStateAction<number | null>>,
    setIsMultiplicationMode: React.Dispatch<React.SetStateAction<boolean>>,
    setMultiplicationMultiplier: React.Dispatch<React.SetStateAction<string>>,
    productId: number
) => {
    setSelectedCartItemId(prev => prev === productId ? null : productId);
    setIsMultiplicationMode(false);
    setMultiplicationMultiplier('');
};

export const handleMultiplySelectedItem = (
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
    selectedCartItemId: number | null,
    multiplier: number,
    toast: any
) => {
    if (selectedCartItemId && multiplier > 0) {
        setCart(prev => prev.map(item =>
            item.product.id === selectedCartItemId
                ? { ...item, quantity: item.quantity * multiplier }
                : item
        ));

        toast({
            title: 'Quantity Multiplied',
            description: `Item quantity multiplied by ${multiplier}.`,
        });

        // Reset multiplication mode
        return true; // Indicate success
    } else {
        toast({
            title: 'No Item Selected',
            description: 'Please select an item in the cart first.',
            variant: 'destructive',
        });
        return false;
    }
};