import React, { useEffect, useState } from 'react';
import { useCurrency } from '@/contexts/currency-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@shared/schema';

interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
}

export default function CustomerDisplay() {
    const { currency } = useCurrency();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // Listen for cart updates from the main POS window
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'pos_cart') {
                const newCart = JSON.parse(e.newValue || '[]');
                setCart(newCart);
                calculateTotal(newCart);
            }
        };

        // Initial load
        const savedCart = localStorage.getItem('pos_cart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
            calculateTotal(parsedCart);
        }

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const calculateTotal = (items: CartItem[]) => {
        const newTotal = items.reduce((sum, item) =>
            sum + (Number(item.product.price) * item.quantity), 0
        );
        setTotal(newTotal);
    };

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Cart Items */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-3xl">Your Order</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {cart.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xl">
                                Welcome! Please start your order.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-xl">
                                        <div>
                                            <div className="font-semibold">{item.product.name}</div>
                                            <div className="text-muted-foreground text-lg">
                                                {item.quantity} x {currency.symbol}{Number(item.product.price).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="font-bold">
                                            {currency.symbol}{(Number(item.product.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Side: Total and Branding */}
                <div className="flex flex-col gap-8">
                    <Card className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-primary text-primary-foreground">
                        <h1 className="text-5xl font-bold mb-4">Total to Pay</h1>
                        <div className="text-9xl font-bold">
                            {currency.symbol}{total.toFixed(2)}
                        </div>
                    </Card>

                    <Card className="p-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold">Thank You!</h2>
                            <p className="text-xl text-muted-foreground">
                                Please review your items on the screen.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
