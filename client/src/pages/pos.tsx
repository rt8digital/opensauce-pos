import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ProductGrid } from '@/components/pos/product-grid';
import { Cart } from '@/components/pos/cart';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { ReceiptDialog } from '@/components/pos/receipt';
import { NumericKeypad } from '@/components/pos/numeric-keypad';
import { ProductForm } from '@/components/inventory/product-form';
import { MainLayout } from '@/components/layout/main-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { scanner } from '@/lib/scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Database, Settings, Search } from 'lucide-react';
import type { Product, Order } from '@shared/schema';
import { indexedDB } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { SettingsDialog } from '@/components/pos/settings-dialog';

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
  const [currency, setCurrency] = React.useState('$');
  const [showSettings, setShowSettings] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  React.useEffect(() => {
    if (products.length > 0) {
      indexedDB.syncProducts(products);
    }
  }, [products]);

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
        paymentMethod
      });

      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setCurrentOrder(order);
      setShowReceipt(true);
      setCart([]);
      indexedDB.saveOrder(order);
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
    const product = products.find(p => p.barcode === plu);
    if (product) {
      handleAddToCart(product);
      toast({
        title: "Product Added",
        description: `${product.name} has been added to the cart.`
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this PLU/barcode.",
        variant: "destructive"
      });
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  return (
    <MainLayout>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 p-4 flex flex-col h-full">
        <div className="flex gap-4 mb-4">
          <Button onClick={() => setShowAddItem(true)} variant="outline" data-testid="button-add-item">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <Button onClick={() => navigate('/inventory')} variant="outline" data-testid="button-inventory">
            <Database className="mr-2 h-4 w-4" />
            View All Items
          </Button>
          <Button onClick={() => setShowSettings(true)} variant="outline" data-testid="button-settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
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
        <Cart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={() => setShowPayment(true)}
          currency={currency}
        />
        <div className="border-t">
          <NumericKeypad
            onPLUSubmit={handlePLUSubmit}
            onAddAmount={handleAddAmount}
          />
        </div>
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

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        total={cart.reduce((sum, item) => 
          sum + (Number(item.product.price) * item.quantity), 0
        )}
        onProcessPayment={handleProcessPayment}
        currency={currency}
      />

      {currentOrder && (
        <ReceiptDialog
          open={showReceipt}
          onOpenChange={setShowReceipt}
          order={currentOrder}
          currency={currency}
        />
      )}
      </div>
    </MainLayout>
  );
}