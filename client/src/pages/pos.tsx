import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ProductGrid } from '@/components/pos/product-grid';
import { Cart } from '@/components/pos/cart';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { ReceiptDialog } from '@/components/pos/receipt';
import { apiRequest } from '@/lib/queryClient';
import { scanner } from '@/lib/scanner';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';
import type { Product, Order } from '@shared/schema';
import { indexedDB } from '@/lib/db';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

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
    <div className="flex h-screen">
      <div className="flex-1 p-4 overflow-auto">
        <div className="mb-4">
          <Button onClick={toggleScanner}>
            <Scan className="mr-2 h-4 w-4" />
            {scanning ? 'Stop Scanner' : 'Start Scanner'}
          </Button>
          
          {scanning && (
            <video
              ref={videoRef}
              className="mt-4 w-full max-w-md"
              autoPlay
              playsInline
            />
          )}
        </div>
        
        <ProductGrid
          products={products}
          onAddToCart={handleAddToCart}
        />
      </div>
      
      <div className="w-96 border-l">
        <Cart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={() => setShowPayment(true)}
        />
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
