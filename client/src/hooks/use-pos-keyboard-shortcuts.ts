import React from 'react';
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from './use-keyboard-shortcuts';
import { apiRequest } from '@/lib/queryClient';
import type { Product } from '../../../shared/types';

interface UsePOSKeyboardShortcutsProps {
    filteredProducts: Product[];
    handleAddToCart: (product: Product) => void;
    snackbar: (options: { title: string; description: string; variant?: 'success' | 'error' | 'info'; duration?: number }) => void;
    setIsCameraScanning: (scanning: boolean) => void;
    setShowAddItem: (show: boolean) => void;
    saveCart: () => void;
    setShowSavedCarts: (show: boolean) => void;
    setShowPayment: (show: boolean) => void;
    reprintLastReceipt: () => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    debouncedSearchTerm: string;
    products: Product[];
    cart: any[];
    formatPrice: (price: number) => string;
    user: any;
    showPayment: boolean;
    showReceipt: boolean;
    showAddItem: boolean;
    showSavedCarts: boolean;
    isCameraScanning: boolean;
    setSearchTerm: (term: string) => void;
    setCart: (cart: any[]) => void;
    setSelectedCustomer: (customer: any) => void;
    cartScrollRef: React.RefObject<HTMLElement>;
    setIsNumpadCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export function usePOSKeyboardShortcuts({
    filteredProducts,
    handleAddToCart,
    snackbar,
    setIsCameraScanning,
    setShowAddItem,
    saveCart,
    setShowSavedCarts,
    setShowPayment,
    reprintLastReceipt,
    searchInputRef,
    debouncedSearchTerm,
    products,
    cart,
    formatPrice,
    user,
    showPayment,
    showReceipt,
    showAddItem,
    showSavedCarts,
    isCameraScanning,
    setSearchTerm,
    setCart,
    setSelectedCustomer,
    cartScrollRef,
    setIsNumpadCollapsed,
}: UsePOSKeyboardShortcutsProps) {
    const shortcuts: KeyboardShortcut[] = React.useMemo(() => {
        // Only register shortcuts when no modal dialogs are open
        if (showPayment || showReceipt || showAddItem || showSavedCarts) {
            return [];
        }

        return [
            // Alt+number shortcuts for first 9 visible products
            {
                key: '1',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[0];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add first product to cart (Ctrl+1)'
            },
            {
                key: '2',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[1];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add second product to cart (Ctrl+2)'
            },
            {
                key: '3',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[2];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add third product to cart (Ctrl+3)'
            },
            {
                key: '4',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[3];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add fourth product to cart (Ctrl+4)'
            },
            {
                key: '5',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[4];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add fifth product to cart (Ctrl+5)'
            },
            {
                key: '6',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[5];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add sixth product to cart (Ctrl+6)'
            },
            {
                key: '7',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[6];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add seventh product to cart (Ctrl+7)'
            },
            {
                key: '8',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[7];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add eighth product to cart (Ctrl+8)'
            },
            {
                key: '9',
                ctrl: true,
                allowInInputs: true,
                action: () => {
                    const visibleProduct = filteredProducts[8];
                    if (visibleProduct) {
                        handleAddToCart(visibleProduct);
                        snackbar({
                            title: "Added to Cart",
                            description: `Added ${visibleProduct.name} to cart`,
                            duration: 1500
                        });
                    }
                },
                description: 'Add ninth product to cart (Ctrl+9)'
            },
            // F1: Focus search input
            {
                ...commonShortcuts.F1,
                action: () => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                        searchInputRef.current.select();
                    }
                },
                description: 'Focus search input'
            },
            // F2: Camera scan
            {
                ...commonShortcuts.F2,
                action: () => setIsCameraScanning(true),
                description: 'Start camera scan'
            },
            // F3: Add custom amount
            {
                ...commonShortcuts.F3,
                action: () => setShowAddItem(true),
                description: 'Add custom amount'
            },
            // F4: Save cart
            {
                ...commonShortcuts.F4,
                action: () => saveCart(),
                description: 'Save cart'
            },
            // F5: Load saved carts
            {
                ...commonShortcuts.F5,
                action: () => setShowSavedCarts(true),
                description: 'Load saved carts'
            },
            // F6: Checkout
            {
                ...commonShortcuts.F6,
                action: () => {
                    if (cart.length > 0) {
                        setShowPayment(true);
                    }
                },
                description: 'Checkout'
            },
            // F7: Clear cart
            {
                ...commonShortcuts.F7,
                action: () => {
                    if (cart.length > 0) {
                        setCart([]);
                        setSelectedCustomer(null);
                        snackbar({
                            title: 'Cart Cleared',
                            description: 'All items have been removed from the cart.',
                            variant: 'success',
                        });
                    }
                },
                description: 'Clear cart'
            },
            // F8: Reprint last receipt
            {
                ...commonShortcuts.F8,
                action: () => reprintLastReceipt(),
                description: 'Reprint last receipt'
            },
            // Ctrl+S: Save cart
            {
                ...commonShortcuts.SAVE,
                action: () => saveCart(),
                description: 'Save cart'
            },
            // Ctrl+L: Load saved carts
            {
                ...commonShortcuts.LOAD,
                action: () => setShowSavedCarts(true),
                description: 'Load saved carts'
            },
            // Ctrl+P: Print receipt
            {
                ...commonShortcuts.PRINT,
                action: () => reprintLastReceipt(),
                description: 'Print receipt'
            },
            // Enter: Add item to cart (when search input has focus and matches a product) - ONLY when NOT from scanner
            {
                key: 'Enter',
                action: () => {
                    // Check if scanner was recently active (within 100ms) - if so, don't trigger this shortcut
                    const now = Date.now();
                    const timeSinceLastScan = now - ((window as any).lastScannerActivityTime || 0);
                    if (timeSinceLastScan < 100) {
                        return;
                    }

                    // Only execute if search input is focused
                    if (document.activeElement !== searchInputRef.current) {
                        return;
                    }

                    if (debouncedSearchTerm) {
                        let product = products.find(p => p.barcode === debouncedSearchTerm);
                        if (!product) {
                            product = products.find(p => p.plu === debouncedSearchTerm);
                        }
                        if (!product) {
                            product = products.find(p => p.name.toLowerCase() === debouncedSearchTerm.toLowerCase());
                        }

                        if (product) {
                            handleAddToCart(product);
                            const existingItem = cart.find(item => item.product.id === product.id);
                            const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                            snackbar({
                                title: "Added to Cart",
                                description: existingItem
                                    ? `${product.name} quantity increased to ${newQuantity}`
                                    : `${product.name} added to cart`,
                                duration: 2000
                            });

                            setSearchTerm('');
                        } else {
                            apiRequest('GET', `/api/products/barcode/${debouncedSearchTerm}`)
                                .then((response: Response) => response.json())
                                .then((fetchedProduct: Product | null) => {
                                    if (fetchedProduct) {
                                        handleAddToCart(fetchedProduct);
                                        const existingItem = cart.find(item => item.product.id === fetchedProduct.id);
                                        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                                        snackbar({
                                            title: "Added to Cart",
                                            description: existingItem
                                                ? `${fetchedProduct.name} quantity increased to ${newQuantity}`
                                                : `${fetchedProduct.name} added to cart`,
                                            duration: 2000
                                        });

                                        setSearchTerm('');
                                    } else {
                                        snackbar({
                                            title: "Item Not Found",
                                            description: `No item found for: ${debouncedSearchTerm}`,
                                            variant: "error",
                                            duration: 3000
                                        });
                                    }
                                })
                                .catch((_error: Error) => {
                                    snackbar({
                                        title: "Item Not Found",
                                        description: `No item found for: ${debouncedSearchTerm}`,
                                        variant: "error",
                                        duration: 3000
                                    });
                                });
                        }
                    } else {
                        if (searchInputRef.current) {
                            searchInputRef.current.focus();
                        }
                    }
                },
                description: 'Add item to cart by barcode/name (when in search field, not from scanner)'
            },
            // Ctrl+Enter: Checkout (when cart has items and payment dialog is not open)
            {
                key: 'Enter',
                ctrl: true,
                action: () => {
                    if (cart.length > 0 && !showPayment && !showAddItem && !showSavedCarts && !isCameraScanning) {
                        setShowPayment(true);
                        snackbar({
                            title: 'Checkout Initiated',
                            description: `Processing ${cart.reduce((sum, item) => sum + item.quantity, 0)} items for ${formatPrice(cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0))}`,
                            variant: 'info',
                        });
                    } else if (cart.length === 0 && !showPayment && !showAddItem && !showSavedCarts && !isCameraScanning) {
                        snackbar({
                            title: 'Cart is Empty',
                            description: 'Add items to cart before checking out',
                            variant: 'error',
                            duration: 2000
                        });
                    }
                },
                description: 'Checkout with cart items'
            },
            // Shift+Enter: Confirm checkout if payment dialog is open
            {
                key: 'Enter',
                shift: true,
                action: () => {
                    if (showPayment && cart.length > 0) {
                        const checkoutButton = document.querySelector('[data-testid="checkout-button"]') as HTMLButtonElement;
                        if (checkoutButton) {
                            checkoutButton.click();
                        }
                    }
                },
                description: 'Confirm checkout in payment dialog'
            },
            // Alt+Enter: Alternative checkout shortcut (to avoid scanner conflicts)
            {
                key: 'Enter',
                alt: true,
                action: () => {
                    if (cart.length > 0 && !showPayment && !showAddItem && !showSavedCarts && !isCameraScanning) {
                        setShowPayment(true);
                        snackbar({
                            title: 'Checkout Initiated',
                            description: `Processing ${cart.reduce((sum, item) => sum + item.quantity, 0)} items for ${formatPrice(cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0))}`,
                            variant: 'info',
                        });
                    } else if (cart.length === 0 && !showPayment && !showAddItem && !showSavedCarts && !isCameraScanning) {
                        snackbar({
                            title: 'Cart is Empty',
                            description: 'Add items to cart before checking out',
                            variant: 'error',
                            duration: 2000
                        });
                    }
                },
                description: 'Alternative checkout with cart items (Alt+Enter)'
            },
            // Alt+A: Add item to cart from search (alternative to Enter)
            {
                key: 'a',
                alt: true,
                action: () => {
                    if (debouncedSearchTerm) {
                        let product = products.find(p => p.barcode === debouncedSearchTerm);
                        if (!product) {
                            product = products.find(p => p.plu === debouncedSearchTerm);
                        }
                        if (!product) {
                            product = products.find(p => p.name.toLowerCase() === debouncedSearchTerm.toLowerCase());
                        }

                        if (product) {
                            handleAddToCart(product);
                            const existingItem = cart.find(item => item.product.id === product.id);
                            const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                            snackbar({
                                title: "Added to Cart",
                                description: existingItem
                                    ? `${product.name} quantity increased to ${newQuantity}`
                                    : `${product.name} added to cart`,
                                duration: 2000
                            });

                            setSearchTerm('');
                        } else {
                            apiRequest('GET', `/api/products/barcode/${debouncedSearchTerm}`)
                                .then((response: Response) => response.json())
                                .then((fetchedProduct: Product | null) => {
                                    if (fetchedProduct) {
                                        handleAddToCart(fetchedProduct);
                                        const existingItem = cart.find(item => item.product.id === fetchedProduct.id);
                                        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                                        snackbar({
                                            title: "Added to Cart",
                                            description: existingItem
                                                ? `${fetchedProduct.name} quantity increased to ${newQuantity}`
                                                : `${fetchedProduct.name} added to cart`,
                                            duration: 2000
                                        });

                                        setSearchTerm('');
                                    } else {
                                        snackbar({
                                            title: "Item Not Found",
                                            description: `No item found for: ${debouncedSearchTerm}`,
                                            variant: "error",
                                            duration: 3000
                                        });
                                    }
                                })
                                .catch((_error: Error) => {
                                    snackbar({
                                        title: "Item Not Found",
                                        description: `No item found for: ${debouncedSearchTerm}`,
                                        variant: "error",
                                        duration: 3000
                                    });
                                });
                        }
                    } else {
                        if (searchInputRef.current) {
                            searchInputRef.current.focus();
                        }
                    }
                },
                description: 'Add item to cart by barcode/name (Alt+A as alternative to Enter)'
            },
            // Plus key: Add item to cart (when search input has focus and matches a product)
            {
                key: '+',
                action: () => {
                    const now = Date.now();
                    const timeSinceLastScan = now - ((window as any).lastScannerActivityTime || 0);
                    if (timeSinceLastScan < 100) {
                        return;
                    }

                    if (debouncedSearchTerm) {
                        let product = products.find(p => p.barcode === debouncedSearchTerm);
                        if (!product) {
                            product = products.find(p => p.plu === debouncedSearchTerm);
                        }
                        if (!product) {
                            product = products.find(p => p.name.toLowerCase() === debouncedSearchTerm.toLowerCase());
                        }

                        if (product) {
                            handleAddToCart(product);
                            const existingItem = cart.find(item => item.product.id === product.id);
                            const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                            snackbar({
                                title: "Added to Cart",
                                description: existingItem
                                    ? `${product.name} quantity increased to ${newQuantity}`
                                    : `${product.name} added to cart`,
                                duration: 2000
                            });

                            setSearchTerm('');
                        } else {
                            apiRequest('GET', `/api/products/barcode/${debouncedSearchTerm}`)
                                .then((response: Response) => response.json())
                                .then((fetchedProduct: Product | null) => {
                                    if (fetchedProduct) {
                                        handleAddToCart(fetchedProduct);
                                        const existingItem = cart.find(item => item.product.id === fetchedProduct.id);
                                        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                                        snackbar({
                                            title: "Added to Cart",
                                            description: existingItem
                                                ? `${fetchedProduct.name} quantity increased to ${newQuantity}`
                                                : `${fetchedProduct.name} added to cart`,
                                            duration: 2000
                                        });

                                        setSearchTerm('');
                                    } else {
                                        snackbar({
                                            title: "Item Not Found",
                                            description: `No item found for: ${debouncedSearchTerm}`,
                                            variant: "error",
                                            duration: 3000
                                        });
                                    }
                                })
                                .catch((_error: Error) => {
                                    snackbar({
                                        title: "Item Not Found",
                                        description: `No item found for: ${debouncedSearchTerm}`,
                                        variant: "error",
                                        duration: 3000
                                    });
                                });
                        }
                    } else {
                        if (searchInputRef.current) {
                            searchInputRef.current.focus();
                        }
                    }
                },
                description: 'Add item to cart by barcode/name (when in search field)'
            },
            // PageUp: Scroll cart up
            {
                key: 'PageUp',
                action: () => {
                    if (cartScrollRef.current) {
                        cartScrollRef.current.scrollBy({ top: -100, behavior: 'smooth' });
                    }
                },
                description: 'Scroll cart up'
            },
            // PageDown: Scroll cart down
            {
                key: 'PageDown',
                action: () => {
                    if (cartScrollRef.current) {
                        cartScrollRef.current.scrollBy({ top: 100, behavior: 'smooth' });
                    }
                },
                description: 'Scroll cart down'
            },
            // Home: Toggle numpad visibility
            {
                key: 'Home',
                action: () => {
                    setIsNumpadCollapsed((prev: boolean) => !prev);
                },
                description: 'Toggle numpad visibility'
            },
            // Escape: Close dialogs
            {
                ...commonShortcuts.ESCAPE,
                action: () => {
                    if (showPayment) setShowPayment(false);
                    else if (showSavedCarts) setShowSavedCarts(false);
                    else if (showAddItem) setShowAddItem(false);
                    else if (isCameraScanning) setIsCameraScanning(false);
                },
                description: 'Close dialogs'
            }
        ];
    }, [
        filteredProducts,
        handleAddToCart,
        snackbar,
        setIsCameraScanning,
        setShowAddItem,
        saveCart,
        setShowSavedCarts,
        setShowPayment,
        reprintLastReceipt,
        searchInputRef,
        debouncedSearchTerm,
        products,
        cart,
        formatPrice,
        user,
        showPayment,
        showReceipt,
        showAddItem,
        showSavedCarts,
        isCameraScanning,
        setSearchTerm,
        setCart,
        setSelectedCustomer,
        cartScrollRef,
        setIsNumpadCollapsed,
    ]);

    // Use the keyboard shortcuts hook
    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}