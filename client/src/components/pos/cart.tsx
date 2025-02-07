import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { Product } from '@shared/schema';

interface CartItem {
  product: Product | { id: number; name: string; price: string };
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
  currency?: string;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, currency = '$' }: CartProps) {
  const total = items.reduce((sum, item) => 
    sum + (Number(item.product.price) * item.quantity), 0
  );

  return (
    <Card className="h-[50vh] flex flex-col">
      <CardContent className="flex-1 p-3">
        <ScrollArea className="h-[calc(50vh-120px)]">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {currency}{Number(product.price).toFixed(2)} × {quantity}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="w-5 text-center text-sm">{quantity}</span>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(product.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => onRemoveItem(product.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>

      <div className="p-2 border-t bg-muted/50">
        <div className="flex justify-between mb-2">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-lg font-semibold">
            {currency}{total.toFixed(2)}
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