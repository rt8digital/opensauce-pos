import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '../../../../shared/types';
import { useCurrency } from '@/contexts/currency-context';
import { Badge } from '@/components/ui/badge';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  lowStockThreshold?: number;
}

export function ProductGrid({ products, onAddToCart, lowStockThreshold = 10 }: ProductGridProps) {
  const { formatPrice } = useCurrency();

  return (
    <div data-testid="product-grid" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-20 md:pb-0">
      {products.map((product, index) => {
        const stock = product.stockQuantity ?? (product as any).stock_quantity ?? 0;
        const outOfStock = stock === 0;
        const lowStock = stock > 0 && stock <= lowStockThreshold;

        return (
          <Card
            key={product.id}
            className={`overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow relative ${outOfStock ? 'opacity-60' : ''}`}
            onClick={() => {
              if (stock > 0) onAddToCart(product);
            }}
          >
            {index < 9 && (
              <Badge variant="default" className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </Badge>
            )}
            {lowStock && !outOfStock && (
              <Badge variant="outline" className="absolute top-2 right-2 z-10 bg-yellow-50 border-yellow-500 text-yellow-600 px-1 py-0 text-[10px] pointer-events-none">
                Low
              </Badge>
            )}
            {outOfStock && (
              <Badge variant="destructive" className="absolute top-2 right-2 z-10 px-1 py-0 text-[10px] pointer-events-none">
                Out
              </Badge>
            )}
            <div className="aspect-square overflow-hidden bg-muted/30 flex items-center justify-center">
              <div className="text-6xl md:text-7xl">
                {product.image}
              </div>
            </div>

            <CardContent className="p-3 md:p-4 flex-grow">
              <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 text-center leading-tight min-h-[2.5rem] flex items-center justify-center">
                {product.name}
              </h3>
              <div className="flex flex-col items-center gap-1">
                {product.price && (
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(Number(product.price))}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Stock: {stock}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
