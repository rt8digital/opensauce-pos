import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import type { Product } from "../../../../shared/types";
import { useCurrency } from '@/contexts/currency-context';

interface CartItem {
  product: Product | { id: number; name: string; price: string };
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  currentDisplay?: string;
  selectedCartItemId?: number | null;
  onSelectCartItem?: (productId: number) => void;
  isMultiplicationMode?: boolean;
  multiplicationMultiplier?: string;
  scrollAreaRef?: React.RefObject<HTMLElement>;
  isNumpadCollapsed?: boolean;
  readOnly?: boolean;
}

export const Cart = React.memo(function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  currentDisplay,
  selectedCartItemId = null,
  onSelectCartItem,
  isMultiplicationMode = false,
  multiplicationMultiplier = '',
  scrollAreaRef,
  isNumpadCollapsed = false,
  readOnly = false
}: CartProps) {
  const { formatPrice } = useCurrency();
  const safeCart = React.useMemo(() => Array.isArray(cart) ? cart : [], [cart]);

  return (
    <div data-testid="cart" className="flex flex-col h-full w-full overflow-hidden bg-dot-pattern/10">
      {/* Scrollable Items Container */}
      <div
        ref={scrollAreaRef as React.RefObject<HTMLDivElement>}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden p-3"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Special Status Overlays (Multiplication, Current Entry) */}
        {!readOnly && (
          <div className="space-y-2 mb-4">
            {currentDisplay && currentDisplay.trim() !== '' && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 opacity-70">Manual Entry</div>
                <div className="text-xl font-mono text-primary font-black leading-none">{currentDisplay}</div>
              </div>
            )}

            {isMultiplicationMode && multiplicationMultiplier && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1 opacity-70">Quantity Pending</div>
                <div className="text-xl font-mono text-orange-700 font-black leading-none">× {multiplicationMultiplier}</div>
              </div>
            )}
          </div>
        )}

        {safeCart.length === 0 && (!currentDisplay || currentDisplay.trim() === '') ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 py-12">
            <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">Your cart is currently empty</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {safeCart.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                isSelected={!readOnly && selectedCartItemId === item.product.id}
                readOnly={readOnly}
                isNumpadCollapsed={isNumpadCollapsed}
                isMultiplicationMode={isMultiplicationMode}
                multiplicationMultiplier={multiplicationMultiplier}
                formatPrice={formatPrice}
                onSelectCartItem={onSelectCartItem}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

interface CartItemRowProps {
  item: CartItem;
  isSelected: boolean;
  readOnly: boolean;
  isNumpadCollapsed: boolean;
  isMultiplicationMode: boolean;
  multiplicationMultiplier: string;
  formatPrice: (price: number) => string;
  onSelectCartItem?: (productId: number) => void;
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
}

const CartItemRow = React.memo(function CartItemRow({
  item,
  isSelected,
  readOnly,
  isNumpadCollapsed,
  isMultiplicationMode,
  multiplicationMultiplier,
  formatPrice,
  onSelectCartItem,
  onUpdateQuantity,
  onRemoveItem
}: CartItemRowProps) {
  return (
    <div
      className={`group relative flex items-center justify-between p-2 sm:p-3 rounded-xl border transition-all duration-300 ${!readOnly ? 'cursor-pointer' : ''} ${isSelected
        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
        : 'border-border/40 bg-card hover:border-border hover:shadow-sm'
        }`}
      onClick={() => !readOnly && onSelectCartItem?.(item.product.id)}
    >
      {/* Left Column: Details */}
      <div className="flex-1 min-w-0 pr-2">
        <div className={`font-bold transition-colors truncate ${isSelected ? 'text-primary' : 'text-foreground'
          } ${isNumpadCollapsed ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm'}`}>
          {item.product.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs sm:text-sm font-semibold text-foreground/80">
            {formatPrice(Number(item.product.price))}
          </span>
          {isSelected && isMultiplicationMode && multiplicationMultiplier && (
            <span className="text-xs font-black text-orange-600 animate-pulse">
              → ×{multiplicationMultiplier}
            </span>
          )}
        </div>
      </div>

      {/* Right Column: Controls or Quantity Display */}
      {readOnly ? (
        <div className="flex items-center gap-1.5 shrink-0 bg-muted/30 p-2 rounded-lg border border-border/20">
          <div className="w-8 text-center">
            <span className={`font-black text-foreground text-sm sm:text-base`}>
              x{item.quantity}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0 bg-muted/30 p-0.5 sm:p-1 rounded-lg border border-border/20">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-background hover:shadow-sm transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQuantity(item.product.id, -1);
            }}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <div className="w-8 text-center">
            <span className={`font-black text-foreground ${isNumpadCollapsed ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
              {item.quantity}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-background hover:shadow-sm transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQuantity(item.product.id, 1);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <div className="w-[1px] h-4 bg-border/40 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveItem(item.product.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Multi-mode Indicator bar */}
      {isSelected && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isMultiplicationMode ? 'bg-orange-500' : 'bg-primary'
          }`} />
      )}
    </div>
  );
});
