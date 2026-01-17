import React from 'react';
import { Button } from '@/components/ui/button';
import type { Product } from '../../../../shared/types';
import { useCurrency } from '@/contexts/currency-context';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  lowStockThreshold?: number;
}

export function ProductList({ products, onAddToCart, lowStockThreshold = 10 }: ProductListProps) {
  const { formatPrice } = useCurrency();

  return (
    <div data-testid="product-list" className="space-y-2">
      {products.map((product, index) => {
        const stock = product.stockQuantity ?? (product as any).stock_quantity ?? 0;
        const outOfStock = stock === 0;
        const lowStock = stock > 0 && stock <= lowStockThreshold;

        return (
          <div
            key={product.id}
            className={`flex items-center gap-4 p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${outOfStock ? 'opacity-60' : ''
              }`}
            onClick={() => { if (stock > 0) onAddToCart(product); }}
          >
            {/* Product Image/Icon */}
            <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted/30 flex items-center justify-center relative">
              {index < 9 && (
                <Badge variant="default" className="absolute top-0 left-0 z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transform -translate-x-1 -translate-y-1">
                  {index + 1}
                </Badge>
              )}
              <div className="text-2xl">
                {product.image || '📦'}
              </div>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm md:text-base truncate">
                  {product.name}
                </h3>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-base font-bold text-primary">
                    {formatPrice(Number(product.price))}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    {product.category}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>Stock: {stock}</span>
                </div>

                {outOfStock ? (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Out of Stock
                  </Badge>
                ) : lowStock ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                  </Badge>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    In Stock
                  </div>
                )}

                {product.barcode && (
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                    <span className="font-mono">#{product.barcode}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      })}

      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found
        </div>
      )}
    </div>
  );
}