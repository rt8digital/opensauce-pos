import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductForm } from '@/components/inventory/product-form';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Edit2, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@shared/schema';

const LOW_STOCK_THRESHOLD = 10;

export default function Inventory() {
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const lowStockProducts = React.useMemo(() => {
    return products.filter(p => p.stockQuantity <= LOW_STOCK_THRESHOLD && p.stockQuantity > 0);
  }, [products]);

  const outOfStockProducts = React.useMemo(() => {
    return products.filter(p => p.stockQuantity === 0);
  }, [products]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await apiRequest('PATCH', `/api/products/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product updated',
        description: 'The product has been updated successfully.',
      });
      setShowForm(false);
      setEditProduct(null);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: Omit<Product, 'id'>) => {
      const response = await apiRequest('POST', '/api/products', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product created',
        description: 'The product has been created successfully.',
      });
      setShowForm(false);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.',
      });
      setShowDeleteDialog(false);
      setEditProduct(null);
    },
  });

  const handleDelete = () => {
    if (editProduct) {
      deleteProductMutation.mutate(editProduct.id);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <AlertCircle className="mr-2 h-6 w-6 animate-spin" />
          Loading...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <Button onClick={() => setShowForm(true)} data-testid="button-add-product">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="mb-6 space-y-4">
            {outOfStockProducts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Out of Stock Alert</AlertTitle>
                <AlertDescription>
                  {outOfStockProducts.length} product{outOfStockProducts.length > 1 ? 's are' : ' is'} out of stock: {' '}
                  {outOfStockProducts.map(p => p.name).join(', ')}
                </AlertDescription>
              </Alert>
            )}
            {lowStockProducts.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Low Stock Alert</AlertTitle>
                <AlertDescription>
                  {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's have' : ' has'} low stock ({LOW_STOCK_THRESHOLD} or fewer items).
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
              <TableCell>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{product.category}</Badge>
              </TableCell>
              <TableCell>${Number(product.price).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span data-testid={`text-stock-${product.id}`}>{product.stockQuantity}</span>
                  {product.stockQuantity === 0 && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                  {product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low Stock</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{product.barcode}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`button-edit-${product.id}`}
                    onClick={() => {
                      setEditProduct(product);
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`button-delete-${product.id}`}
                    onClick={() => {
                      setEditProduct(product);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editProduct}
            onSubmit={(data) => {
              if (editProduct) {
                updateProductMutation.mutate({ ...data, id: editProduct.id });
              } else {
                createProductMutation.mutate(data);
              }
            }}
            onDelete={() => {
              setShowDeleteDialog(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}