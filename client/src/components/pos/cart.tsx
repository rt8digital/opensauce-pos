import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { Product } from '@shared/schema';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => 
    sum + (Number(item.product.price) * item.quantity), 0
  );

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-[calc(100vh-350px)]">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between py-2 border-b">
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ${Number(product.price).toFixed(2)} × {quantity}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-8 text-center">{quantity}</span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onUpdateQuantity(product.id, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onRemoveItem(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>

      <div className="p-4 border-t">
        <div className="flex justify-between mb-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-lg font-semibold">
            ${total.toFixed(2)}
          </span>
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Checkout
        </Button>
      </div>
    </Card>
  );
}