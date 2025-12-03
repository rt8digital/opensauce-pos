import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, Tag } from "lucide-react";
import type { Product, Discount } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from '@/contexts/currency-context';

interface CartItem {
  product: Product | { id: number; name: string; price: string };
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
  discounts?: Discount[];
  selectedDiscount?: Discount | null;
  onSelectDiscount?: (discount: Discount | null) => void;
  currentDisplay?: string;
}

export function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  discounts = [],
  selectedDiscount,
  onSelectDiscount,
  currentDisplay
}: CartProps) {
  const { formatPrice } = useCurrency();
  const subtotal = cart.reduce((sum, item) =>
    sum + (Number(item.product.price) * item.quantity), 0
  );

  let total = subtotal;
  let discountAmount = 0;

  if (selectedDiscount) {
    if (selectedDiscount.type === 'percentage') {
      discountAmount = subtotal * (Number(selectedDiscount.value) / 100);
    } else {
      discountAmount = Math.min(subtotal, Number(selectedDiscount.value));
    }
    total = Math.max(0, subtotal - discountAmount);
  }

  return (
    <div data-testid="cart" className="flex flex-col h-full max-h-[65vh]">
      <ScrollArea className="flex-1 p-4 min-h-0">
        {currentDisplay && currentDisplay.trim() !== '' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800 font-medium">Current Entry:</div>
            <div className="text-lg font-mono text-blue-900">{currentDisplay}</div>
          </div>
        )}

        {cart.length === 0 && (!currentDisplay || currentDisplay.trim() === '') ? (
          <div className="text-center text-muted-foreground py-8">
            Cart is empty
          </div>
        ) : (
          <div className="space-y-4">
            {[...cart].reverse().map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(Number(item.product.price))}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 touch-target-min"
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 touch-target-min"
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive touch-target-min"
                    onClick={() => onRemoveItem(item.product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-muted/50 space-y-4">
        {discounts.length > 0 && onSelectDiscount && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedDiscount?.id.toString() || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onSelectDiscount(null);
                } else {
                  const discount = discounts.find(d => d.id.toString() === value);
                  onSelectDiscount(discount || null);
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Add Discount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Discount</SelectItem>
                {discounts.filter(d => d.active).map((discount) => (
                  <SelectItem key={discount.id} value={discount.id.toString()}>
                    {discount.name} ({discount.type === 'percentage' ? `${discount.value}%` : `${formatPrice(Number(discount.value))}`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {selectedDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({selectedDiscount.name})</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}
