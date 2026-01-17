import type { Product } from '../../../../shared/types';

interface CartItem {
    product: Product | { id: number; name: string; price: string };
    quantity: number;
    originalPrice?: string;
    discountedPrice?: string;
}

interface ToastOptions {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

type ToastFunction = (options: ToastOptions) => void;

type ApiRequestFunction = (method: string, url: string) => Promise<Response>;

type SetCartFunction = (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;

/**
 * Unified function for product lookup and cart addition.
 * Searches for a product by barcode, PLU, or name, adds it to the cart if found,
 * and provides user feedback via toast notifications.
 *
 * @param identifier - The barcode, PLU, or product name to search for
 * @param products - Array of available products
 * @param cart - Current cart items
 * @param setCart - Function to update the cart state
 * @param showToast - Function to display toast notifications
 * @param apiRequest - Function to make API requests
 * @param playBeep - Optional function to play a beep sound (for scanner inputs)
 * @returns The found product or null if not found
 */
export const addProductByIdentifier = async (
    identifier: string,
    products: Product[],
    cart: CartItem[],
    setCart: SetCartFunction,
    showToast: ToastFunction,
    apiRequest: ApiRequestFunction,
    playBeep?: () => void
): Promise<Product | null> => {
    // First try to find in local products by barcode
    let product: Product | undefined = products.find(p => p.barcode === identifier);

    // If not found by barcode, try by PLU
    if (!product) {
        product = products.find(p => p.plu === identifier);
    }

    // If not found by PLU, try by name (exact match, case-insensitive)
    if (!product) {
        product = products.find(p => p.name.toLowerCase() === identifier.toLowerCase());
    }

    if (product) {
        // Add product to cart
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product!.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product!.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });

        // Play beep if provided (for scanner inputs)
        playBeep?.();

        // Enhanced feedback with quantity information
        const existingItem = cart.find(item => item.product.id === product.id);
        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

        showToast({
            title: "Added to Cart",
            description: existingItem
                ? `${product.name} quantity increased to ${newQuantity}`
                : `${product.name} added to cart`,
            duration: 2000
        });

        return product;
    } else {
        // Try to fetch from API by barcode
        try {
            const response = await apiRequest('GET', `/api/products/barcode/${identifier}`);
            const fetchedProduct: Product | null = await response.json();

            if (fetchedProduct) {
                // Add fetched product to cart
                setCart(prev => {
                    const existing = prev.find(item => item.product.id === fetchedProduct.id);
                    if (existing) {
                        return prev.map(item =>
                            item.product.id === fetchedProduct.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        );
                    }
                    return [...prev, { product: fetchedProduct, quantity: 1 }];
                });

                // Play beep if provided (for scanner inputs)
                playBeep?.();

                // Enhanced feedback with quantity information
                const existingItem = cart.find(item => item.product.id === fetchedProduct.id);
                const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                showToast({
                    title: "Added to Cart",
                    description: existingItem
                        ? `${fetchedProduct.name} quantity increased to ${newQuantity}`
                        : `${fetchedProduct.name} added to cart`,
                    duration: 2000
                });

                return fetchedProduct;
            } else {
                // Product not found
                showToast({
                    title: "Item Not Found",
                    description: `No item found for: ${identifier}`,
                    variant: "destructive",
                    duration: 3000
                });
                return null;
            }
        } catch (error) {
            console.log('Product not found via API lookup');
            showToast({
                title: "Item Not Found",
                description: `No item found for: ${identifier}`,
                variant: "destructive",
                duration: 3000
            });
            return null;
        }
    }
};