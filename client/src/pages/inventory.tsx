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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductForm } from '@/components/inventory/product-form';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Edit2, AlertCircle, Trash2, AlertTriangle, MoreVertical, Download, Search, Camera } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { scanner } from '@/lib/scanner';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@shared/schema';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/currency-context';

const LOW_STOCK_THRESHOLD = 10;

export default function Inventory() {
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isCameraScanning, setIsCameraScanning] = React.useState(false);
  const cameraVideoRef = React.useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Camera scanner effect
  React.useEffect(() => {
    if (isCameraScanning && cameraVideoRef.current) {
      scanner.start(cameraVideoRef.current, handleCameraScannedBarcode)
        .catch(err => {
          console.error("Failed to start camera scanner:", err);
          toast({
            title: "Camera Error",
            description: "Could not start camera. Please ensure camera permissions are granted.",
            variant: "destructive",
          });
          setIsCameraScanning(false);
        });
    } else {
      scanner.stop();
    }

    return () => {
      scanner.stop();
    };
  }, [isCameraScanning]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      p.barcode.includes(debouncedSearchTerm)
    );
  }, [products, debouncedSearchTerm]);

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

  const [selectedProducts, setSelectedProducts] = React.useState<number[]>([]);

  const handleDelete = () => {
    if (editProduct) {
      deleteProductMutation.mutate(editProduct.id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      for (const id of selectedProducts) {
        await apiRequest('DELETE', `/api/products/${id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSelectedProducts([]);
      toast({
        title: 'Products deleted',
        description: 'Selected products have been deleted successfully.',
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Barcode'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.price,
        p.stockQuantity,
        p.barcode
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Simple CSV parsing (doesn't handle commas within quotes perfectly but good enough for simple data)
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        if (values.length < 5) {
          errorCount++;
          continue;
        }

        const productData = {
          name: values[1],
          category: values[2],
          price: values[3],
          stockQuantity: parseInt(values[4]) || 0,
          barcode: values[5] || '',
          description: '',
          image: '📦' // Default emoji
        };

        try {
          await apiRequest('POST', '/api/products', productData);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Import Completed',
        description: `Successfully imported ${successCount} products. ${errorCount} failed.`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: number) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleCameraScannedBarcode = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      // Highlight the product in the table by setting search term to the barcode
      setSearchTerm(barcode);
      toast({
        title: "Product Found",
        description: `${product.name} - ${formatPrice(Number(product.price))} (${product.stockQuantity} in stock)`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive"
      });
    }
    setIsCameraScanning(false);
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
      {isCameraScanning && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <div className="relative w-full max-w-md h-64 bg-black rounded-md overflow-hidden mb-4">
            <video ref={cameraVideoRef} className="w-full h-full object-cover" playsInline></video>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-24 border-2 border-primary opacity-75 rounded-md animate-pulse"></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Position the barcode within the frame to scan product.
            </p>
            <Button onClick={() => setIsCameraScanning(false)} variant="secondary">
              Stop Scanning
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 lg:px-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0 mb-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
            <div className="flex flex-col space-y-1">
              <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">Inventory Management</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Manage your products and stock levels
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-2 sm:flex-wrap">
            {/* Primary Actions */}
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => setShowForm(true)} data-testid="button-add-product" className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsCameraScanning(true)} className="flex-1 sm:flex-none">
                <Camera className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Scan Product</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>

              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4 rotate-180" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleImportCSV}
                aria-label="Import products from CSV file"
              />
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedProducts.length})
              </Button>
            )}
          </div>
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

        {/* Products Table */}
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          {/* Mobile View - Card Layout */}
          <div className="block md:hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="divide-y">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 space-y-3" data-testid={`row-product-${product.id}`}>
                    {/* Product Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelectProduct(product.id)}
                        />
                        <div className="text-2xl">{product.image}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{product.name}</h3>
                          <Badge variant="secondary" className="text-xs mt-1">{product.category}</Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                          className="h-8 w-8"
                          data-testid={`button-delete-${product.id}`}
                          onClick={() => {
                            setEditProduct(product);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <div className="font-medium">{formatPrice(Number(product.price))}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock:</span>
                        <div className="flex items-center gap-2">
                          <span data-testid={`text-stock-${product.id}`} className="font-medium">{product.stockQuantity}</span>
                          {product.stockQuantity === 0 && (
                            <Badge variant="destructive" className="text-xs">Out</Badge>
                          )}
                          {product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Low</Badge>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Barcode:</span>
                        <div className="font-mono text-xs">{product.barcode}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={products.length > 0 && selectedProducts.length === products.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-2xl text-center">{product.image}</div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(Number(product.price))}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span data-testid={`text-stock-${product.id}`}>{product.stockQuantity}</span>
                          {product.stockQuantity === 0 && (
                            <Badge variant="destructive" className="text-xs">Out</Badge>
                          )}
                          {product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Low</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                            className="h-8 w-8"
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-full h-full max-h-full p-0 gap-0 bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DialogTitle className="text-xl font-semibold">
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {editProduct ? 'Update product information and settings' : 'Create a new product for your inventory'}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl mx-auto">
              <ProductForm
                product={editProduct}
                categories={Array.from(new Set(products.map(p => p.category)))}
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
            </div>
          </div>
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
