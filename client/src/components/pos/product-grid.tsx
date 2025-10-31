import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@shared/schema';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold truncate flex-1">{product.name}</h3>
              <span className="text-xs bg-secondary px-2 py-1 rounded ml-2">
                {product.category}
              </span>
            </div>
            <p className="text-lg font-bold text-primary">
              ${Number(product.price).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Stock: {product.stockQuantity}
            </p>
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button
              className="w-full"
              data-testid={`button-add-to-cart-${product.id}`}
              onClick={() => onAddToCart(product)}
              disabled={product.stockQuantity === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
