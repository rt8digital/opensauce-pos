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

      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={() => setIsCameraScanning(true)}>
              <Camera className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Scan Product</span>
              <span className="xs:hidden">Scan</span>
            </Button>
            {selectedProducts.length > 0 && (
              <Button variant="destructive" size="sm" className="text-xs md:text-sm">
                <Trash2 className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Delete Selected ({selectedProducts.length})</span>
                <span className="xs:hidden">{selectedProducts.length}</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={handleExportCSV}>
              <Download className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Export CSV</span>
              <span className="xs:hidden">CSV</span>
            </Button>
            <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={() => fileInputRef.current?.click()}>
              <Download className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4 rotate-180" />
              <span className="hidden xs:inline">Import CSV</span>
              <span className="xs:hidden">Import</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleImportCSV}
              aria-label="Import products from CSV file"
            />
            <Button size="sm" className="text-xs md:text-sm" onClick={() => setShowForm(true)} data-testid="button-add-product">
              <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Add Product</span>
              <span className="xs:hidden">Add</span>
            </Button>
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

        <div className="border rounded-md overflow-x-auto">
          <Table className="min-w-[800px] md:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] md:w-[50px]">
                  <Checkbox
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="hidden md:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell">Barcode</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-3xl">
                      {product.image}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[150px] md:max-w-none">
                    <div className="truncate text-sm md:text-base">{product.name}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(Number(product.price))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span data-testid={`text-stock-${product.id}`} className="text-sm">{product.stockQuantity}</span>
                      {product.stockQuantity === 0 && (
                        <Badge variant="destructive" className="text-xs">Out</Badge>
                      )}
                      {product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Low</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.barcode}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 touch-target-min"
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
                        className="h-8 w-8 touch-target-min"
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
