import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ProductGrid } from '@/components/pos/product-grid';
import { Cart } from '@/components/pos/cart';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { ReceiptDialog } from '@/components/pos/receipt';
import { NumericKeypad } from '@/components/pos/numeric-keypad';
import { apiRequest } from '@/lib/queryClient';
import { scanner } from '@/lib/scanner';
import { Button } from '@/components/ui/button';
import { Plus, Scan, Database } from 'lucide-react';
import type { Product, Order } from '@shared/schema';
import { indexedDB } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [, navigate] = useLocation();
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const total = cart.reduce((sum, item) => 
        sum + (Number(item.product.price) * item.quantity), 0
      );

      const response = await apiRequest('POST', '/api/orders', {
        items: orderItems,
        total,
        paymentMethod
      });

      return response.json();
    },
    onSuccess: (order) => {
      setCurrentOrder(order);
      setShowReceipt(true);
      setCart([]);
      indexedDB.saveOrder(order);
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
    toast({
      title: "Settings",
      description: "Settings functionality coming soon!"
    });
  };

  const toggleScanner = async () => {
    if (scanning) {
      scanner.stop();
      setScanning(false);
    } else {
      try {
        await scanner.start(videoRef.current!, async (barcode) => {
          const response = await fetch(`/api/products/barcode/${barcode}`);
          if (response.ok) {
            const product = await response.json();
            handleAddToCart(product);
            scanner.stop();
            setScanning(false);
          }
        });
        setScanning(true);
      } catch (error) {
        console.error('Failed to start scanner:', error);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 p-4 flex flex-col h-full">
        <div className="flex gap-4 mb-4">
          <Button onClick={() => navigate('/inventory')} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <Button onClick={() => navigate('/inventory')} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            View All Items
          </Button>
          <Button onClick={toggleScanner} variant="outline">
            <Scan className="mr-2 h-4 w-4" />
            {scanning ? 'Stop Scanner' : 'Start Scanner'}
          </Button>
        </div>

        {scanning && (
          <video
            ref={videoRef}
            className="mb-4 w-full max-w-md"
            autoPlay
            playsInline
          />
        )}

        <div className="flex-1 overflow-auto">
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>

      <div className="w-[400px] border-l flex flex-col h-full">
        <div className="flex-1">
          <Cart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => setShowPayment(true)}
          />
        </div>
        <div className="border-t">
          <NumericKeypad
            onPLUSubmit={handlePLUSubmit}
            onSettingsClick={handleSettingsClick}
          />
        </div>
      </div>

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        total={cart.reduce((sum, item) => 
          sum + (Number(item.product.price) * item.quantity), 0
        )}
        onProcessPayment={handleProcessPayment}
      />

      {currentOrder && (
        <ReceiptDialog
          open={showReceipt}
          onOpenChange={setShowReceipt}
          order={currentOrder}
        />
      )}
    </div>
  );
}