import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '@shared/schema';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div data-testid="product-grid" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-20 md:pb-0">
      {products.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => product.stockQuantity > 0 && onAddToCart(product)}
        >
          <div className="aspect-square overflow-hidden bg-muted/30 flex items-center justify-center">
            <div className="text-6xl md:text-7xl">
              {product.image}
            </div>
          </div>

          <CardContent className="p-3 md:p-4 flex-grow">
            <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2 text-center">
              {product.name}
            </h3>
            {product.plu && (
              <p className="text-lg font-bold text-primary text-center">
                PLU: {product.plu}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
