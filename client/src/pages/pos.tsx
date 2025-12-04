import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ProductGrid } from '@/components/pos/product-grid';
import { Cart } from '@/components/pos/cart';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { Receipt } from '@/components/pos/receipt';
import { NumericKeypad } from '@/components/pos/numeric-keypad';
import { ProductForm } from '@/components/inventory/product-form';
import { CustomerSelect } from '@/components/pos/customer-select';
import { MainLayout } from '@/components/layout/main-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { offlineDataManager } from '@/lib/offline-data-manager';
import { scanner } from '@/lib/scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { Product, Order, Customer } from '@shared/schema';
import { indexedDB } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { whatsappWebService } from '@/lib/whatsapp-web';


interface CartItem {
  product: Product | { id: number; name: string; price: string };
  quantity: number;
}

export default function POS() {
  const [, navigate] = useLocation();
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isCameraScanning, setIsCameraScanning] = React.useState(false);
  const [currentNumpadDisplay, setCurrentNumpadDisplay] = React.useState('');
  const [isNumpadCollapsed, setIsNumpadCollapsed] = React.useState(false);
  const cameraVideoRef = React.useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => offlineDataManager.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: () => offlineDataManager.getCustomers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Camera scanner effect
  React.useEffect(() => {
    if (isCameraScanning && cameraVideoRef.current) {
      scanner.start(cameraVideoRef.current, handleCameraScannedBarcode)
        .catch(err => {
          console.error("Failed to start camera scanner:", err);
          toast({
            title: "Camera Error",
            description: "Could not start camera. Please ensure camera permissions are granted.",
            variant: "destructive",
          });
          setIsCameraScanning(false);
        });
    } else {
      scanner.stop();
    }

    return () => {
      scanner.stop();
    };
  }, [isCameraScanning]);

  const categories = React.useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      const total = cart.reduce((sum, item) =>
        sum + (Number(item.product.price) * item.quantity), 0
      );

      for (const item of cart) {
        if ('stockQuantity' in item.product) {
          const product = item.product as Product;
          await apiRequest('PATCH', `/api/products/${product.id}`, {
            stockQuantity: product.stockQuantity - item.quantity
          });
        }
      }

      const response = await apiRequest('POST', '/api/orders', {
        items: orderItems,
        total,
        paymentMethod,
        userId: user?.id,
        customerId: selectedCustomer?.id || null
      });

      return response.json();
    },
    onSuccess: async (order) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setCurrentOrder(order);
      setShowReceipt(true);
      setCart([]);
      indexedDB.saveOrder(order);

      // Send WhatsApp invoice if customer is selected and has phone number
      if (selectedCustomer?.phone) {
        try {
          const whatsappMessage = whatsappWebService.formatReceipt({
            ...order,
            storeName: 'OpenSauce POS', // You can make this configurable
            items: JSON.parse(order.items)
          });

          const success = await whatsappWebService.sendMessage(selectedCustomer.phone, whatsappMessage);

          if (success) {
            toast({
              title: 'WhatsApp Invoice Sent',
              description: `Invoice sent to ${selectedCustomer.name} via WhatsApp.`,
            });
          } else {
            toast({
              title: 'WhatsApp Send Failed',
              description: 'Invoice could not be sent via WhatsApp. Check customer phone number.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('WhatsApp send error:', error);
          toast({
            title: 'WhatsApp Error',
            description: 'Failed to send WhatsApp invoice. Please check the phone number format.',
            variant: 'destructive',
          });
        }
      }

      toast({
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

  const handleAddToCart = (product: Product) => {
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

  const handleAddAmount = (amount: string) => {
    const id = Date.now();
    const item = {
      product: {
        id,
        name: 'Custom Amount',
        price: amount,
      },
      quantity: 1,
    };
    setCart(prev => [...prev, item]);
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleProcessPayment = (method: string) => {
    createOrderMutation.mutate(method);
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
      toast({
        title: "Product Added",
        description: `${product.name} has been added to the cart.`
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with PLU/barcode: ${plu}. Available barcodes: ${products.map(p => p.barcode).join(', ')}, PLUs: ${products.map(p => p.plu).filter(Boolean).join(', ')}`,
        variant: "destructive"
      });
    }
  };

  const handleCameraScannedBarcode = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      handleAddToCart(product);
      toast({
        title: "Product Scanned",
        description: `${product.name} has been added to the cart.`
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode.",
        variant: "destructive"
      });
    }
    setIsCameraScanning(false);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  return (
    <MainLayout>
      <div className="flex h-screen overflow-hidden relative">
        {isCameraScanning && (
          <div className="absolute inset-0 z-50 bg-background flex">
            {/* Camera View */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-md h-64 bg-black rounded-md overflow-hidden mb-4">
                <video ref={cameraVideoRef} className="w-full h-full object-cover" playsInline></video>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-24 border-2 border-primary opacity-75 rounded-md animate-pulse"></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Position the barcode within the frame.
              </p>
              <Button onClick={() => setIsCameraScanning(false)} variant="secondary">
                Stop Scanning
              </Button>
            </div>

            {/* Cart Panel */}
            <div className="w-[400px] border-l flex flex-col h-full bg-white">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Current Cart</h2>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Cart is empty
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...cart].reverse().map((item) => (
                      <div key={item.product.id} className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} × {formatPrice(Number(item.product.price))}
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatPrice(Number(item.product.price) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtotal and Total */}
              <div className="p-4 border-t bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0))}</span>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0))}</span>
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setIsCameraScanning(false);
                    setShowPayment(true);
                  }}
                >
                  Checkout ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 flex flex-col h-full">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <CustomerSelect
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
              />
            </div>
            <Button variant="outline" onClick={() => setIsCameraScanning(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Camera Scan
            </Button>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category" className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto">
            <ProductGrid
              products={filteredProducts}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        <div className="w-[400px] border-l flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Current Cart</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNumpadCollapsed(!isNumpadCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isNumpadCollapsed ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Cart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => setShowPayment(true)}
            currentDisplay={currentNumpadDisplay}
          />
          {!isNumpadCollapsed && (
            <div className="border-t">
              <NumericKeypad
                onPLUSubmit={handlePLUSubmit}
                onAddAmount={handleAddAmount}
                onDisplayChange={setCurrentNumpadDisplay}
                disableKeyboard={showPayment}
              />
            </div>
          )}
        </div>

        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              onSubmit={async (data) => {
                try {
                  const response = await apiRequest('POST', '/api/products', data);
                  const newProduct = await response.json();
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
      </div>
    </MainLayout>
  );
}
