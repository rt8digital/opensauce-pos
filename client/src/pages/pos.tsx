import React from 'react';
import './pos-responsive.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ProductGrid } from '@/components/pos/product-grid';
import { ProductList } from '@/components/pos/product-list';
import { Cart } from '@/components/pos/cart';
import { CameraScanner } from '@/components/pos/camera-scanner';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { Receipt } from '@/components/pos/receipt';
import { NumericKeypad } from '@/components/pos/numeric-keypad';
import { ProductForm } from '@/components/inventory/product-form';

import { ProductSearchControls } from '@/components/pos/product-search-controls';
import { SavedCartsDialog } from '@/components/pos/saved-carts-dialog';
import { OrderSelectionDialog } from '@/components/sales/order-selection-dialog';
import { PinConfirmationDialog } from '@/components/sales/pin-confirmation-dialog';
import MobileSidebar from '@/components/pos/mobile-sidebar';
import { MainLayout } from '@/components/layout/main-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { offlineDataManager } from '@/lib/offline-data-manager';
import { scanner } from '@/lib/scanner';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { ChevronUp, ChevronDown, ShoppingCart, Save } from 'lucide-react';
import type { Product, Order, Customer } from '../../../shared/types';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { indexedDB } from '@/lib/db';
import { useSnackbar } from '@/hooks/use-snackbar';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
// WhatsApp service removed for core POS focus
import { storage } from '@/lib/storage';
import { enhancedFocus } from '@/lib/focus-utils';
import { usePOSKeyboardShortcuts } from '@/hooks/use-pos-keyboard-shortcuts';
import { useScanner } from '@/hooks/use-scanner';
import { usePeripherals } from '@/hooks/use-peripherals';

import {
  handleAddToCart as addToCartAction,
  handleAddAmount as addAmountAction,
  handleUpdateQuantity as updateQuantityAction,
  handleRemoveItem as removeItemAction,
  handleSelectCartItem as selectCartItemAction,
  handleMultiplySelectedItem as multiplyItemAction,
  CartItem
} from '@/lib/pos-cart-handlers';
import { addProductByIdentifier } from '@/lib/pos-scanning-handlers';

export default function POS() {

  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = React.useState<number>(0); // 0 = all categories
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);


  const [currentNumpadDisplay, setCurrentNumpadDisplay] = React.useState('');
  const [isNumpadCollapsed, setIsNumpadCollapsed] = React.useState(false);
  const [selectedCartItemId, setSelectedCartItemId] = React.useState<number | null>(null);
  const [isMultiplicationMode, setIsMultiplicationMode] = React.useState(false);
  const [multiplicationMultiplier, setMultiplicationMultiplier] = React.useState('');
  const [showSavedCarts, setShowSavedCarts] = React.useState(false);
  const [showVoidDialog, setShowVoidDialog] = React.useState(false);
  const [pinConfirmationDialogOpen, setPinConfirmationDialogOpen] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = React.useState<number[]>([]);
  const [voidOperationType, setVoidOperationType] = React.useState<'order' | 'items' | null>(null);
  const [savedCarts, setSavedCarts] = React.useState<any[]>([]);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>((localStorage.getItem('viewMode') as 'grid' | 'list') || 'list');
  const cameraVideoRef = React.useRef<HTMLVideoElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const cartScrollRef = React.useRef<HTMLElement>(null);
  const { snackbar } = useSnackbar();
  const { formatPrice } = useCurrency();

  const [rightPanelWidth, setRightPanelWidth] = React.useState(450);
  const [isResizing, setIsResizing] = React.useState(false);
  const [sizes, setSizes] = React.useState([60, 40]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.is_owner || (user as any)?.isOwner;
  const { printReceipt } = usePeripherals();

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const total = subtotal;

  // Sync cart with customer display
  React.useEffect(() => {
    const syncWithCustomerDisplay = async () => {
      if (window.electronAPI && window.electronAPI.updateCustomerDisplay) {
        try {
          await window.electronAPI.updateCustomerDisplay({ items: cart, total });
        } catch (error) {
          console.error('Failed to sync with customer display:', error);
        }
      }
      // Also update localStorage for web compatibility/fallback
      localStorage.setItem('pos_cart', JSON.stringify(cart));
    };

    syncWithCustomerDisplay();
  }, [cart, total]);

  const renderSummary = (showActions = true) => (
    <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 dark:bg-black bg-card h-full flex flex-col border-t">
      <div className="space-y-1 sm:space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium uppercase tracking-wider">Subtotal</span>
          <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <Separator className="bg-border/50" />
        <div className="flex justify-between items-baseline pt-1">
          <span className="font-bold text-sm sm:text-base md:text-lg uppercase tracking-tight">Total Due</span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tighter transition-all">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSavedCarts(true)}
            className="h-10 sm:h-12 md:h-14 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm"
            title="Saved Carts"
          >
            <ShoppingCart className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={cart.length === 0}
            onClick={saveCart}
            className="h-10 sm:h-12 md:h-14 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm"
            title="Save Cart"
          >
            <Save className="h-6 w-6" />
          </Button>
          <Button
            className="w-full h-10 sm:h-12 md:h-14 text-lg sm:text-xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.97] transition-all bg-primary hover:bg-primary/90"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
          >
            PAY
          </Button>
        </div>
      )}
    </div>
  );

  const loadSavedCarts = React.useCallback(() => {
    try {
      const saved = localStorage.getItem('savedCarts');
      if (saved) {
        setSavedCarts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved carts', e);
    }
  }, []);

  const handleAddToCart = React.useCallback((product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    addToCartAction(setCart, product);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

    snackbar({
      title: "Added to Cart",
      description: existingItem
        ? `${product.name} quantity increased to ${newQuantity}`
        : `${product.name} added to cart`,
      duration: 2000
    });
  }, [cart, snackbar]);

  const handleAddAmount = React.useCallback((amount: string) => {
    addAmountAction(setCart, amount);
  }, []);

  const handleUpdateQuantity = React.useCallback((productId: number, delta: number) => {
    updateQuantityAction(setCart, productId, delta);
  }, []);

  const handleRemoveItem = React.useCallback((productId: number) => {
    removeItemAction(setCart, productId, setSelectedCartItemId, setIsMultiplicationMode, setMultiplicationMultiplier);
  }, []);

  const handleSelectCartItem = React.useCallback((productId: number) => {
    selectCartItemAction(setSelectedCartItemId, setIsMultiplicationMode, setMultiplicationMultiplier, productId);
  }, []);

  const handleMultiplySelectedItem = React.useCallback((multiplier: number) => {
    const success = multiplyItemAction(setCart, selectedCartItemId, multiplier, toast);
    if (success) {
      setIsMultiplicationMode(false);
      setMultiplicationMultiplier('');
      setSelectedCartItemId(null);
    }
  }, [selectedCartItemId]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => offlineDataManager.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: dbCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const lowStockThreshold = settings?.lowStockThreshold ?? 10;



  // Handle responsive behavior
  const [mobileView, setMobileView] = React.useState<'inventory' | 'keypad' | 'cart'>('inventory');

  React.useEffect(() => {
    const checkMobile = () => {
      // Logic for mobile check could be here if needed
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);





  // Initialize scanner activity tracking and enable hardware scanner when component mounts
  React.useEffect(() => {
    // Initialize the last scanner activity time to a value that ensures no conflicts at startup
    (window as any).lastScannerActivityTime = 0;

    scanner.enableHardwareScanner((barcode: string) => {
      handleBarcodeScanned(barcode, 'remote', '');
    });

    return () => {
      scanner.disableHardwareScanner();
    };
  }, []);

  // Listen for remote barcode scans
  React.useEffect(() => {
    const handleRemoteScan = (event: CustomEvent) => {
      const { barcode, deviceId: _deviceId } = event.detail;
      handleBarcodeScanned(barcode, 'remote', _deviceId);
    };

    window.addEventListener('remoteBarcodeScan', handleRemoteScan as EventListener);

    return () => {
      window.removeEventListener('remoteBarcodeScan', handleRemoteScan as EventListener);
    };
  }, [products]);

  // Listen for sidebar camera scan button
  React.useEffect(() => {
    const handleCameraScan = () => {
      setIsCameraScanning(true);
    };

    window.addEventListener('openCameraScan', handleCameraScan as EventListener);

    return () => {
      window.removeEventListener('openCameraScan', handleCameraScan as EventListener);
    };
  }, []);

  // Load saved carts on mount
  React.useEffect(() => {
    loadSavedCarts();
  }, []);

  // Update panel sizes when numpad collapse state changes
  React.useEffect(() => {
    // Proportions: [Cart+Summary], [Numpad]
    setSizes(isNumpadCollapsed ? [100, 0] : [55, 45]);
  }, [isNumpadCollapsed]);

  // Save viewMode to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Scanner functionality
  const handleBarcodeScanned = React.useCallback(async (barcode: string, type: 'camera' | 'remote', _deviceId?: string) => {
    const playBeep = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1000;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    };

    await addProductByIdentifier(
      barcode,
      products,
      cart,
      setCart,
      ({ title, description, variant, duration }) => {
        if ((variant as any) === 'destructive' || (variant as any) === 'error') {
          snackbar({ title, description, variant: 'error' });
        } else {
          snackbar({ title, description, duration });
        }
      },
      apiRequest,
      type === 'camera' ? playBeep : undefined
    );
  }, [products, cart, setCart, snackbar, apiRequest]);

  const {
    isCameraScanning,
    setIsCameraScanning,
    videoDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useScanner({
    videoRef: cameraVideoRef,
    onBarcodeScanned: handleBarcodeScanned,
  });

  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory !== 0) {
      result = result.filter(p => p.categoryId === selectedCategory);
    }
    if (debouncedSearchTerm) {
      const lower = debouncedSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.barcode?.includes(lower) ||
        p.plu?.includes(lower)
      );
    }
    return result;
  }, [products, selectedCategory, debouncedSearchTerm]);





  const categories = React.useMemo(() => {
    // Create categories array with 'All Categories' option (id: 0)
    return [{ id: 0, name: 'All Categories' }, ...dbCategories];
  }, [dbCategories]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Delete') {
      setSearchTerm('');
      enhancedFocus(searchInputRef.current, true, 10);
    }
    if (e.key === 'Enter') {
      const now = Date.now();
      const timeSinceLastScan = now - (window as any).lastScannerActivityTime;
      if (timeSinceLastScan < 100) return;

      if (debouncedSearchTerm) {
        // First try to find by barcode
        let product = products.find(p => p.barcode === debouncedSearchTerm);

        // If not found by barcode, try to find by PLU
        if (!product) {
          product = products.find(p => p.plu === debouncedSearchTerm);
        }

        // If not found by PLU, try to find by name (exact match)
        if (!product) {
          product = products.find(p => p.name.toLowerCase() === debouncedSearchTerm.toLowerCase());
        }

        if (product) {
          handleAddToCart(product);

          // Enhanced feedback with quantity information
          const existingItem = cart.find(item => item.product.id === product.id);
          const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

          snackbar({
            title: "Added to Cart",
            description: existingItem
              ? `${product.name} quantity increased to ${newQuantity}`
              : `${product.name} added to cart`,
            duration: 2000
          });

          // Clear the search term after successful addition
          setSearchTerm('');
        } else {
          // Try to fetch from API by barcode
          apiRequest('GET', `/api/products/barcode/${debouncedSearchTerm}`)
            .then((response: Response) => {
              if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
              }
              return response.json();
            })
            .then((fetchedProduct: Product | null) => {
              if (fetchedProduct) {
                handleAddToCart(fetchedProduct);

                // Enhanced feedback with quantity information
                const existingItem = cart.find(item => item.product.id === fetchedProduct.id);
                const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                snackbar({
                  title: "Added to Cart",
                  description: existingItem
                    ? `${fetchedProduct.name} quantity increased to ${newQuantity}`
                    : `${fetchedProduct.name} added to cart`,
                  duration: 2000
                });

                // Clear the search term after successful addition
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
            .catch((error: Error) => {
              console.error('API lookup error:', error);
              snackbar({
                title: "Search Error",
                description: "Unable to search online inventory. Please check your connection and try again.",
                variant: "error",
                duration: 3000
              });
            });
        }
      } else {
        // If no search term, just focus the search input with enhanced focus
        enhancedFocus(searchInputRef.current, true, 10);
      }
    }
  };



  const createOrderMutation = useMutation({
    mutationFn: async ({ method, cashReceived, change, updatedCart }: { method: string; cashReceived?: string; change?: string; updatedCart?: CartItem[] }) => {
      // Use the updated cart if provided (for discounted items), otherwise use the regular cart
      const itemsToProcess = updatedCart || cart;

      const orderItems = itemsToProcess.map(item => {
        // Check if this item has discount information
        const hasDiscountInfo = 'discountedPrice' in item && item.discountedPrice !== undefined;
        const priceToUse = hasDiscountInfo ? item.discountedPrice : item.product.price;
        const originalPrice = hasDiscountInfo ? item.originalPrice : undefined;

        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: priceToUse,
          cost: (item.product as any).cost || '0', // Record current cost
          ...(originalPrice && { originalPrice }) // Include original price if there's a discount
        };
      });

      const total = itemsToProcess.reduce((sum, item) => {
        const priceToUse = 'discountedPrice' in item && item.discountedPrice ? item.discountedPrice : item.product.price;
        return sum + (Number(priceToUse) * item.quantity);
      }, 0);

      const response = await apiRequest('POST', '/api/orders', {
        items: orderItems,
        total,
        paymentMethod: method,
        userId: user?.id,
        customerId: selectedCustomer?.id || null,
        cashReceived,
        change
      });

      const orderData = await response.json();
      return { order: orderData, itemsToProcess };
    },
    onSuccess: async ({ order, itemsToProcess }) => {
      // Update stock only after order is successfully created
      for (const item of itemsToProcess) {
        const product = item.product as Product;
        const currentStock = product.stockQuantity ?? (product as any).stock_quantity ?? 0;

        await apiRequest('PATCH', `/api/products/${product.id}`, {
          stockQuantity: currentStock - item.quantity
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setCurrentOrder(order);
      setShowReceipt(true);
      setCart([]);
      try {
        await indexedDB.saveOrder(order);
      } catch (error) {
        console.warn('Failed to save order to IndexedDB:', error);
      }

      // Save the last receipt for re-printing
      await storage.saveLastReceipt(order);

      // Automatically print the receipt through the server
      await printReceipt(order);

      // WhatsApp invoice sending removed for core POS focus

      snackbar({
        title: 'Order Completed',
        description: `Order #${order.id} processed successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to process the order.',
        variant: 'destructive',
      });
    }
  });





  const handleNumpadNumber = (num: string) => {
    if (isMultiplicationMode) {
      setMultiplicationMultiplier(prev => {
        const newValue = prev + num;
        const multiplier = parseInt(newValue);
        if (!isNaN(multiplier) && multiplier > 0) {
          // Auto-apply multiplication when reasonable number is entered
          if (multiplier <= 100) {
            setTimeout(() => handleMultiplySelectedItem(multiplier), 100);
          }
        }
        return newValue;
      });
    }
  };

  const handleNumpadEnter = () => {
    if (isMultiplicationMode && multiplicationMultiplier) {
      const multiplier = parseInt(multiplicationMultiplier);
      if (!isNaN(multiplier) && multiplier > 0) {
        handleMultiplySelectedItem(multiplier);
      } else {
        toast({
          title: 'Invalid Multiplier',
          description: 'Please enter a valid positive number.',
          variant: 'destructive',
        });
        setIsMultiplicationMode(false);
        setMultiplicationMultiplier('');
      }
    }
  };

  const handleVoidOrderConfirmed = async (orderId: number) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to void orders.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await window.electronAPI.voidOrder(orderId, user.id, 'Voided from POS interface');
      toast({
        title: 'Order Voided',
        description: `Order #${orderId} has been voided successfully.`,
      });
      setPinConfirmationDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error: any) {
      console.error('Error voiding order:', error);
      toast({
        title: 'Void Failed',
        description: error.message || 'Failed to void the order.',
        variant: 'destructive',
      });
    }
  };

  const handleVoidItemsConfirmed = async () => {
    if (!user || !selectedOrderId || selectedItemIds.length === 0) {
      toast({
        title: 'Invalid Request',
        description: 'Missing required information for item voiding.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await window.electronAPI.voidItems(selectedItemIds, user.id, 'Voided from POS interface');
      toast({
        title: 'Items Voided',
        description: `Successfully voided ${selectedItemIds.length} item(s) from order #${selectedOrderId}.`,
      });
      setPinConfirmationDialogOpen(false);
      setVoidOperationType(null);
      setSelectedItemIds([]);
      setSelectedOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error: any) {
      console.error('Error voiding items:', error);
      toast({
        title: 'Void Failed',
        description: error.message || 'Failed to void the items.',
        variant: 'destructive',
      });
    }
  };

  const handleOrderSelected = (orderId: number) => {
    setVoidOperationType('order');
    setSelectedOrderId(orderId);
    setShowVoidDialog(false);
    if (!isAdmin && !isOwner) {
      setPinConfirmationDialogOpen(true);
    } else {
      handleVoidOrderConfirmed(orderId);
    }
  };

  const handleProcessPayment = (method: string, cashReceived?: string, change?: string, updatedCart?: CartItem[]) => {
    createOrderMutation.mutate({ method, cashReceived, change, updatedCart });
  };

  const handlePLUSubmit = async (plu: string) => {
    // First try to find in local products by barcode or PLU
    let product = products.find(p => p.barcode === plu || p.plu === plu);

    // If not found locally, try to fetch from API by barcode
    if (!product) {
      try {
        const response = await apiRequest('GET', `/api/products/barcode/${plu}`);
        product = await response.json();
      } catch (error) {
        console.log('Product not found via API lookup either');
      }
    }

    if (product) {
      handleAddToCart(product);

      // Enhanced feedback with quantity information
      const existingItem = cart.find(item => item.product.id === product.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      snackbar({
        title: "Added to Cart",
        description: existingItem
          ? `${product.name} quantity increased to ${newQuantity}`
          : `${product.name} added to cart`,
        duration: 2000
      });
    } else {
      // Enhanced error message with PLU number for debugging
      toast({
        title: "Item Not Found",
        description: `No item found for PLU/barcode: ${plu}`,
        variant: "destructive",
        duration: 3000
      });
    }
  };


  const saveCart = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cannot Save Empty Cart',
        description: 'Please add items to the cart before saving.',
        variant: 'destructive',
      });
      return;
    }

    // Generate a unique ID and name for the saved cart
    const cartId = `cart_${Date.now()}`;
    const cartName = `Saved Cart - ${new Date().toLocaleString()}`;

    try {
      await storage.saveCart(cartId, cartName, cart, selectedCustomer);
      toast({
        title: 'Cart Saved Successfully',
        description: `Cart "${cartName}" has been saved.`,
      });
      setCart([]);  // Clear the cart after saving
      setSelectedCustomer(null); // Clear selected customer as well
    } catch (error) {
      console.error('Error saving cart:', error);
      toast({
        title: 'Save Cart Failed',
        description: 'There was an error saving the cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const reprintLastReceipt = async () => {
    try {
      const lastReceipt = await storage.getLastReceipt();
      if (!lastReceipt) {
        toast({
          title: 'No Previous Receipt',
          description: 'There is no previous receipt to print.',
          variant: 'destructive',
        });
        return;
      }

      // Create a temporary order to show the receipt
      setCurrentOrder(lastReceipt);
      setShowReceipt(true);

      // Automatically print the receipt through the server
      await printReceipt(lastReceipt);

      toast({
        title: 'Receipt Retrieved',
        description: 'Previous receipt has been loaded for printing.',
      });
    } catch (error) {
      console.error('Error retrieving last receipt:', error);
      toast({
        title: 'Reprint Failed',
        description: 'There was an error retrieving the last receipt. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePageUp = React.useCallback(() => {
    // Scroll cart
    if (cartScrollRef.current) {
      cartScrollRef.current.scrollBy({ top: -200, behavior: 'smooth' });
    }
    // Scroll entire page/window
    window.scrollBy({ top: -200, behavior: 'smooth' });
  }, []);

  const handlePageDown = React.useCallback(() => {
    // Scroll cart
    if (cartScrollRef.current) {
      cartScrollRef.current.scrollBy({ top: 200, behavior: 'smooth' });
    }
    // Scroll entire page/window
    window.scrollBy({ top: 200, behavior: 'smooth' });
  }, []);

  const loadSavedCart = async (cartId: string) => {
    try {
      const savedCart = await storage.loadCart(cartId);
      if (savedCart) {
        setCart(savedCart.cart);
        setSelectedCustomer(savedCart.customer || null);
        toast({
          title: 'Cart Loaded Successfully',
          description: `Cart "${savedCart.name}" has been loaded.`,
        });
      } else {
        toast({
          title: 'Cart Not Found',
          description: 'The requested cart could not be found.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading saved cart:', error);
      toast({
        title: 'Load Cart Failed',
        description: 'There was an error loading the cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteSavedCart = async (cartId: string) => {
    try {
      await storage.deleteCart(cartId);
      toast({
        title: 'Cart Deleted',
        description: 'The saved cart has been deleted.',
      });
      loadSavedCarts();
    } catch (error) {
      console.error('Error deleting saved cart:', error);
      toast({
        title: 'Delete Failed',
        description: 'There was an error deleting the cart. Please try again.',
        variant: 'destructive',
      });
    }
  };



  // Handle mobile view change
  const handleMobileViewChange = (view: 'inventory' | 'keypad' | 'cart') => {
    setMobileView(view);
  };

  // Keyboard shortcuts
  usePOSKeyboardShortcuts({
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
    setIsNumpadCollapsed
  });

  return (
    <MainLayout>
      <div className="flex h-full overflow-hidden relative">
        {isCameraScanning && (
          <CameraScanner
            isCameraScanning={isCameraScanning}
            onClose={() => setIsCameraScanning(false)}
            videoDevices={videoDevices}
            selectedDeviceId={selectedDeviceId}
            setSelectedDeviceId={setSelectedDeviceId}
            cameraVideoRef={cameraVideoRef}
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => setShowPayment(true)}
            onSaveCart={saveCart}
            onShowSavedCarts={() => setShowSavedCarts(true)}
            currentDisplay={currentNumpadDisplay}
            selectedCartItemId={selectedCartItemId}
            onSelectCartItem={handleSelectCartItem}
            isMultiplicationMode={isMultiplicationMode}
            multiplicationMultiplier={multiplicationMultiplier}
          />
        )}

        <div
          className="flex-1 overflow-hidden flex relative"
          onMouseMove={(e) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
              setRightPanelWidth(newWidth);
            }
          }}
          onMouseUp={() => setIsResizing(false)}
          onMouseLeave={() => setIsResizing(false)}
        >
          {/* Main Inventory Area */}
          <div className={`flex-1 flex flex-col h-full overflow-hidden ${mobileView !== 'inventory' ? 'hidden' : ''} md:flex`}>
            <div className="p-4 flex flex-col h-full">
              <ProductSearchControls
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearchKeyDown}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                onCameraScan={() => setIsCameraScanning(true)}
                searchInputRef={searchInputRef}
                autoFocusSearch={true}
              />

              <div className="flex-1 overflow-auto">
                {viewMode === 'grid' ? (
                  <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} lowStockThreshold={lowStockThreshold} />
                ) : (
                  <ProductList products={filteredProducts} onAddToCart={handleAddToCart} lowStockThreshold={lowStockThreshold} />
                )}
              </div>
            </div>
          </div>

          {/* Custom Horizontal Resizer Handle */}
          <div
            className="hidden md:flex w-1 hover:w-1.5 bg-border hover:bg-primary cursor-col-resize transition-all items-center justify-center z-50"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          >
            <div className="w-1 h-8 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Right Panel: Cart & Numpad */}
          <div
            className={`hidden md:flex flex-col border-l bg-card overflow-hidden shrink-0 h-full`}
            style={{ width: `${rightPanelWidth}px` }}
          >
            <ResizablePanelGroup
              key={`panels-${isNumpadCollapsed}`}
              direction="vertical"
              className="h-full"
              onLayout={(newSizes) => setSizes(newSizes)}
            >
              {/* Main Panel: Cart + Summary */}
              <ResizablePanel
                defaultSize={sizes[0]}
                minSize={30}
                className="transition-[flex-grow] duration-300 ease-in-out"
              >
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Cart Header */}
                  <div className="flex items-center justify-between p-4 border-b shrink-0 bg-card">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Cart
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsNumpadCollapsed(!isNumpadCollapsed)}
                        className="hidden md:flex gap-1.5 h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all active:scale-95 border-primary/20"
                      >
                        {isNumpadCollapsed ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Show Pad</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Hide Pad</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileView('inventory')}
                        className="md:hidden"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {cart.length > 0 && !showPayment && !showAddItem && !showSavedCarts && !isCameraScanning && (
                    <div className="px-4 py-1.5 bg-blue-50/10 border-b border-blue-500/20 shrink-0">
                      <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-center">
                        ENTER: ADD • CTRL+ENTER: PAY
                      </div>
                    </div>
                  )}

                  {/* Scrollable Cart List */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <Cart
                      cart={cart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      currentDisplay={currentNumpadDisplay}
                      selectedCartItemId={selectedCartItemId}
                      onSelectCartItem={handleSelectCartItem}
                      isMultiplicationMode={isMultiplicationMode}
                      multiplicationMultiplier={multiplicationMultiplier}
                      scrollAreaRef={cartScrollRef}
                      isNumpadCollapsed={isNumpadCollapsed}
                    />
                  </div>

                  {/* Summary (Static at bottom of cart area) */}
                  <div className="shrink-0 border-t bg-card z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]">
                    {renderSummary(true)}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle className="h-1.5 bg-border/50 hover:bg-primary/30 transition-colors" />

              {/* Numpad Panel */}
              <ResizablePanel
                defaultSize={sizes[1]}
                minSize={isNumpadCollapsed ? 0 : 40}
                maxSize={isNumpadCollapsed ? 0 : 50}
                className="transition-[flex-grow] duration-300 ease-in-out"
              >
                <div className="flex flex-col h-full bg-muted/30 overflow-hidden">
                  <div className="flex-1 p-2 min-h-0 overflow-auto scrollbar-hide">
                    <NumericKeypad
                      onPLUSubmit={handlePLUSubmit}
                      onAddAmount={handleAddAmount}
                      onDisplayChange={setCurrentNumpadDisplay}
                      disableKeyboard={showPayment}
                      onNumber={handleNumpadNumber}
                      onEnter={handleNumpadEnter}
                      isMultiplicationMode={isMultiplicationMode}
                      multiplicationDisplay={multiplicationMultiplier}
                      onReprint={reprintLastReceipt}
                      onPageUp={handlePageUp}
                      onPageDown={handlePageDown}
                      onVoid={() => setShowVoidDialog(true)}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        {/* Mobile Views */}
        <div className={`flex-1 p-4 flex flex-col h-full md:hidden ${mobileView !== 'cart' ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Cart</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <Cart
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              selectedCartItemId={selectedCartItemId}
              onSelectCartItem={handleSelectCartItem}
              isMultiplicationMode={isMultiplicationMode}
              multiplicationMultiplier={multiplicationMultiplier}
              isNumpadCollapsed={true}
            />
          </div>
          <div className="shrink-0 border-t bg-card">
            {renderSummary(true)}
          </div>
        </div>

        <div className={`flex-1 p-4 flex flex-col h-full md:hidden ${mobileView !== 'keypad' ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Numeric Keypad</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md flex flex-col gap-4">
              <div className="shrink-0">
                {renderSummary(false)}
              </div>
              <NumericKeypad
                onPLUSubmit={handlePLUSubmit}
                onAddAmount={handleAddAmount}
                onDisplayChange={setCurrentNumpadDisplay}
                disableKeyboard={showPayment}
                onNumber={handleNumpadNumber}
                onEnter={handleNumpadEnter}
                isMultiplicationMode={isMultiplicationMode}
                multiplicationDisplay={multiplicationMultiplier}
                onReprint={reprintLastReceipt}
                onPageUp={handlePageUp}
                onPageDown={handlePageDown}
                onVoid={() => setShowVoidDialog(true)}
              />
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              onSubmit={async (data) => {
                try {
                  await apiRequest('POST', '/api/products', data);
                  queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                  toast({
                    title: 'Product Added',
                    description: 'The new product has been added successfully.',
                  });
                  setShowAddItem(false);
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to add the product.',
                    variant: 'destructive',
                  });
                }
              }}
            />
          </DialogContent>
        </Dialog>

        <PaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          total={cart.reduce((sum, item) =>
            sum + (Number(item.product.price) * item.quantity), 0
          )}
          cart={cart}
          onProcessPayment={handleProcessPayment}
        />

        {currentOrder && (
          <Receipt
            open={showReceipt}
            onOpenChange={setShowReceipt}
            order={currentOrder}
            products={products}
            customer={selectedCustomer}
          />
        )}

        <SavedCartsDialog
          isOpen={showSavedCarts}
          onClose={() => setShowSavedCarts(false)}
          savedCarts={savedCarts}
          onLoadCart={loadSavedCart}
          onDeleteCart={deleteSavedCart}
        />

        <OrderSelectionDialog
          open={showVoidDialog}
          onOpenChange={setShowVoidDialog}
          onOrderSelected={handleOrderSelected}
          onItemsSelected={(orderId, itemIds) => {
            setVoidOperationType('items');
            setSelectedOrderId(orderId);
            setSelectedItemIds(itemIds);
            setShowVoidDialog(false);
            if (!isAdmin && !isOwner) {
              setPinConfirmationDialogOpen(true);
            } else {
              handleVoidItemsConfirmed();
            }
          }}
        />

        <PinConfirmationDialog
          open={pinConfirmationDialogOpen}
          onOpenChange={setPinConfirmationDialogOpen}
          onPinConfirmed={() => {
            if (voidOperationType === 'order' && selectedOrderId) {
              handleVoidOrderConfirmed(selectedOrderId);
            } else if (voidOperationType === 'items') {
              handleVoidItemsConfirmed();
            }
          }}
        />

        {/* Mobile icon sidebar */}
        <MobileSidebar
          currentMobileView={mobileView}
          onViewChange={handleMobileViewChange}
          cart={cart}
          selectedCustomer={selectedCustomer}
        />
      </div>
    </MainLayout >
  );
}