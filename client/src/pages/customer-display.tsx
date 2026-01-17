import { useEffect, useState } from 'react';
import { useCurrency } from '@/contexts/currency-context';
import { Product } from '../../../shared/types';
import { ShoppingCart, Star, CheckCircle2 } from 'lucide-react';

import { Cart } from '@/components/pos/cart';

interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
}

export default function CustomerDisplay() {
    const { formatPrice } = useCurrency();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [storeName, setStoreName] = useState('OpenSauce POS');

    useEffect(() => {
        // Load settings for store name
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const settings = await response.json();
                if (settings && settings.storeName) {
                    setStoreName(settings.storeName);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();

        // Listen for IPC updates (Electron)
        if (window.electronAPI && window.electronAPI.onCustomerDisplayUpdate) {
            const removeUpdateListener = window.electronAPI.onCustomerDisplayUpdate((_event, content) => {
                if (content && Array.isArray(content.items)) {
                    setCart(content.items);
                    setTotal(content.total || 0);
                }
            });

            const removeClearListener = window.electronAPI.onCustomerDisplayClear?.(() => {
                setCart([]);
                setTotal(0);
            });

            return () => {
                removeUpdateListener();
                removeClearListener?.();
            };
        }

        // Fallback for Web/Storage events
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'pos_cart') {
                const newCart = JSON.parse(e.newValue || '[]');
                setCart(newCart);
                calculateTotal(newCart);
            }
        };

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
        <div className="min-h-screen bg-[#050505] text-white p-6 flex flex-col font-sans overflow-hidden">
            {/* Header Branding */}
            <div className="flex justify-between items-center mb-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <ShoppingCart className="text-black w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase">{storeName}</h2>
                        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase opacity-80">Premium Experience</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Secure Payment System</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                {/* Left Side: Order Details (8 cols) */}
                <div className="lg:col-span-7 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <h3 className="text-xl font-bold uppercase tracking-tight">Purchase Summary</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                    </div>

                    <div className="flex-1 overflow-auto pr-4 scrollbar-hide space-y-3 custom-scrollbar rounded-xl bg-white/[0.02] border border-white/5 p-4">
                        <Cart
                            cart={cart}
                            onUpdateQuantity={() => { }}
                            onRemoveItem={() => { }}
                            readOnly={true}
                        />
                    </div>
                </div>

                {/* Right Side: Totals (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-primary text-black flex flex-col justify-between shadow-2xl shadow-primary/20 aspect-square lg:aspect-auto flex-1">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16" />

                        <div className="relative">
                            <h1 className="text-2xl font-black uppercase tracking-tighter opacity-70 mb-1">Amount Due</h1>
                            <div className="h-1 w-12 bg-black/20 rounded-full" />
                        </div>

                        <div className="relative text-center py-8">
                            <span className="text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter block drop-shadow-sm">
                                {formatPrice(total)}
                            </span>
                        </div>

                        <div className="relative flex justify-between items-end border-t border-black/10 pt-6 mt-6">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-60">Total Items</p>
                                <p className="text-2xl font-black">{cart.reduce((acc, item) => acc + item.quantity, 0)}</p>
                            </div>
                            <div className="px-5 py-2 bg-black rounded-full text-primary text-xs font-black uppercase tracking-[0.2em]">
                                Pay Now
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white/[0.05] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-center space-y-4">
                            <div className="flex justify-center mb-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight">Thank you for shopping!</h4>
                            <p className="text-muted-foreground font-medium">
                                Please confirm your items on this display. We appreciate your business.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-50 text-[10px] font-bold uppercase tracking-[0.3em]">
                <div>OS-SYSTEM: STABLE</div>
                <div className="flex gap-8">
                    <span>IP: 192.168.1.1</span>
                    <span>SESSION: {new Date().toLocaleTimeString()}</span>
                </div>
                <div>SECURE TRANSMISSION</div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
}
