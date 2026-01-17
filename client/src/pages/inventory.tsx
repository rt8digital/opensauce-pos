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
import { Card, CardContent } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProductForm } from '@/components/inventory/product-form';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Edit2, AlertCircle, Trash2, AlertTriangle, Download, Search, Camera, Printer, Save, X, FolderPlus, Package, ArrowUpRight, Ban } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { scanner } from '@/lib/scanner';
import { useToast } from '@/hooks/use-toast';
import type { Product, Category } from '../../../shared/types';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/currency-context';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/use-keyboard-shortcuts';
import Barcode from 'react-barcode';

const LOW_STOCK_THRESHOLD = 10;

export default function Inventory() {
    const [editProduct, setEditProduct] = React.useState<Product | null>(null);
    const [showForm, setShowForm] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [isCameraScanning, setIsCameraScanning] = React.useState(false);
    const [isBatchEditing, setIsBatchEditing] = React.useState(false);
    const [batchEdits, setBatchEdits] = React.useState<Record<number, Partial<Product>>>({});
    const cameraVideoRef = React.useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const { formatPrice } = useCurrency();

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ['/api/products'],
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['/api/categories'],
        staleTime: 5 * 60 * 1000, // 5 minutes
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

    // Keyboard shortcuts
    useKeyboardShortcuts([
        // F1: Focus search input
        {
            ...commonShortcuts.F1,
            action: () => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.select();
                }
            },
            description: 'Focus search input'
        },
        // F2: Camera scan
        {
            ...commonShortcuts.F2,
            action: () => setIsCameraScanning(true),
            description: 'Start camera scan'
        },
        // F3: Add product
        {
            ...commonShortcuts.F3,
            action: () => setShowForm(true),
            description: 'Add new product'
        },
        // F4: Toggle batch edit mode
        {
            ...commonShortcuts.F4,
            action: () => {
                if (isBatchEditing) {
                    handleCancelBatchEdits();
                } else {
                    setIsBatchEditing(true);
                }
            },
            description: 'Toggle batch edit mode'
        },
        // F5: Export CSV
        {
            ...commonShortcuts.F5,
            action: () => handleExportCSV(),
            description: 'Export CSV'
        },
        // F6: Import CSV
        {
            ...commonShortcuts.F6,
            action: () => fileInputRef.current?.click(),
            description: 'Import CSV'
        },
        // F7: Print inventory
        {
            ...commonShortcuts.F7,
            action: () => handlePrintInventory(),
            description: 'Print inventory'
        },
        // Ctrl+S: Save batch edits
        {
            ...commonShortcuts.SAVE,
            action: () => {
                if (isBatchEditing) {
                    handleSaveBatchEdits();
                }
            },
            description: 'Save batch edits'
        },
        // Ctrl+N: Add new product
        {
            ...commonShortcuts.NEW,
            action: () => setShowForm(true),
            description: 'Add new product'
        },
        // Ctrl+E: Export CSV
        {
            ...commonShortcuts.EXPORT,
            action: () => handleExportCSV(),
            description: 'Export CSV'
        },
        // Ctrl+I: Import CSV
        {
            ...commonShortcuts.IMPORT,
            action: () => fileInputRef.current?.click(),
            description: 'Import CSV'
        },
        // Ctrl+P: Print inventory
        {
            ...commonShortcuts.PRINT,
            action: () => handlePrintInventory(),
            description: 'Print inventory'
        },
        // Enter: Confirm actions in dialogs
        {
            ...commonShortcuts.ENTER,
            action: () => {
                // This would need to be handled by dialog components
                // For now, we'll focus on the primary actions
            },
            description: 'Confirm actions'
        },
        // Escape: Close dialogs/cancel
        {
            ...commonShortcuts.ESCAPE,
            action: () => {
                if (showForm) setShowForm(false);
                else if (showDeleteDialog) setShowDeleteDialog(false);
                else if (showCategoryDialog) setShowCategoryDialog(false);
                else if (isCameraScanning) setIsCameraScanning(false);
                else if (isBatchEditing) handleCancelBatchEdits();
            },
            description: 'Close dialogs/cancel'
        }
    ]);

    const filteredProducts = React.useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            (p.barcode || '').includes(debouncedSearchTerm)
        );
    }, [products, debouncedSearchTerm]);

    const lowStockProducts = React.useMemo(() => {
        return products.filter(p => (p.stockQuantity || 0) <= LOW_STOCK_THRESHOLD && (p.stockQuantity || 0) > 0);
    }, [products]);

    const outOfStockProducts = React.useMemo(() => {
        return products.filter(p => (p.stockQuantity || 0) === 0);
    }, [products]);

    const [bulkUpdatingCount, setBulkUpdatingCount] = React.useState(0);

    const updateProductMutation = useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const response = await apiRequest('PATCH', `/api/products/${data.id}`, data);
            const result = await response.json();
            console.log('Product update response:', result);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
            // Only show toast if this is a single edit (not bulk)
            if (bulkUpdatingCount === 0) {
                toast({
                    title: 'Product updated',
                    description: 'The product has been updated successfully.',
                });
                setShowForm(false);
                setEditProduct(null);
            }
        },
        onError: (error: any) => {
            console.error('Error updating product:', error);
            toast({
                title: 'Error updating product',
                description: error.message || 'Failed to update product. Please try again.',
                variant: 'destructive',
            });
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
        onError: (error: any) => {
            console.error('Error creating product:', error);
            let errorMessage = error.message || 'Failed to create product. Please try again.';

            // Handle specific error cases
            if (errorMessage.includes('Barcode already exists')) {
                errorMessage = 'A product with this barcode already exists. Please use a different barcode.';
            }

            toast({
                title: 'Error creating product',
                description: errorMessage,
                variant: 'destructive',
            });
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
        onError: (error: any) => {
            console.error('Error deleting product:', error);
            toast({
                title: 'Error deleting product',
                description: error.message || 'Failed to delete product. Please try again.',
                variant: 'destructive',
            });
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const response = await apiRequest('POST', '/api/categories', data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            toast({
                title: 'Category created',
                description: 'The category has been created successfully.',
            });
            setShowCategoryDialog(false);
            setNewCategoryName('');
            setNewCategoryDescription('');
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: async (data: { id: number; name: string; description?: string }) => {
            const response = await apiRequest('PATCH', `/api/categories/${data.id}`, {
                name: data.name,
                description: data.description,
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            toast({
                title: 'Category updated',
                description: 'The category has been updated successfully.',
            });
            setShowCategoryDialog(false);
            setEditCategory(null);
            setNewCategoryName('');
            setNewCategoryDescription('');
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest('DELETE', `/api/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            toast({
                title: 'Category deleted',
                description: 'The category has been deleted successfully.',
            });
        },
    });

    const [selectedProducts, setSelectedProducts] = React.useState<number[]>([]);
    const [showCategoryDialog, setShowCategoryDialog] = React.useState(false);
    const [editCategory, setEditCategory] = React.useState<Category | null>(null);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [newCategoryDescription, setNewCategoryDescription] = React.useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);

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
                `"${(p.category || '').replace(/"/g, '""')}"`,
                p.price,
                p.stockQuantity || 0,
                p.barcode || ''
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
            // Skip headers line

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

    const handleBatchEdit = (productId: number, field: keyof Product, value: any) => {
        setBatchEdits(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value,
                id: productId
            }
        }));
    };

    const handleSaveBatchEdits = async () => {
        const edits = Object.values(batchEdits);
        if (edits.length === 0) {
            setIsBatchEditing(false);
            return;
        }

        try {
            for (const edit of edits) {
                await apiRequest('PATCH', `/api/products/${edit.id}`, edit);
            }
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
            setBatchEdits({});
            setIsBatchEditing(false);
            toast({
                title: 'Batch Update Successful',
                description: `Updated ${edits.length} product${edits.length > 1 ? 's' : ''} successfully.`,
            });
        } catch (error) {
            toast({
                title: 'Batch Update Failed',
                description: 'Some updates may have failed. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleCancelBatchEdits = () => {
        setBatchEdits({});
        setIsBatchEditing(false);
    };

    const handlePrintInventory = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Generate barcode SVGs for each product
        const barcodePromises = products.map(async (product) => {
            if (!product.barcode || product.barcode.trim() === '') {
                return `<div style="text-align: center; padding: 10px; border: 1px solid #ddd;">No Barcode</div>`;
            }

            try {
                // Create a temporary container to render the barcode
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '-9999px';
                document.body.appendChild(tempDiv);

                // Use React to render the barcode component
                const { createRoot } = await import('react-dom/client');
                const root = createRoot(tempDiv);

                // Create a promise to wait for the barcode to render
                const barcodeSvg = await new Promise<string>((resolve) => {
                    const BarcodeComponent = () => (
                        <Barcode
                            value={product.barcode || ''}
                            width={1.5}
                            height={40}
                            fontSize={12}
                            margin={5}
                            displayValue={false}
                        />
                    );

                    root.render(<BarcodeComponent />);

                    // Wait a bit for rendering to complete
                    setTimeout(() => {
                        const svg = tempDiv.querySelector('svg');
                        if (svg) {
                            resolve(svg.outerHTML);
                        } else {
                            resolve(`<div style="text-align: center; padding: 10px; border: 1px solid #ddd;">${product.barcode}</div>`);
                        }
                        root.unmount();
                        document.body.removeChild(tempDiv);
                    }, 100);
                });

                return barcodeSvg;
            } catch (error) {
                console.error('Error generating barcode for', product.barcode, error);
                return `<div style="text-align: center; padding: 10px; border: 1px solid #ddd;">${product.barcode}</div>`;
            }
        });

        const barcodeSvgs = await Promise.all(barcodePromises);

        const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .image-cell { width: 60px; text-align: center; }
            .barcode-cell { width: 150px; text-align: center; }
            svg { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              table { font-size: 12px; }
              th, td { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <h1>Inventory Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Products:</strong> ${products.length}</p>
          <table>
            <thead>
              <tr>
                <th class="image-cell">Image</th>
                <th>Name</th>
                <th>Category</th>
                <th class="text-right">Price</th>
                <th class="text-center">Stock</th>
                <th class="text-center">PLU</th>
                <th class="barcode-cell">Barcode</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((product, index) => `
                <tr>
                  <td class="image-cell">
                    ${(product.image || '').startsWith('data:image/') || (product.image || '').startsWith('http') ?
                `<img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` :
                `<div style="font-size: 24px;">${product.image}</div>`}
                  </td>
                  <td>${product.name}</td>
                  <td>${product.category}</td>
                  <td class="text-right">${formatPrice(Number(product.price))}</td>
                  <td class="text-center">${product.stockQuantity ?? 0}</td>
                  <td class="text-center">${product.plu || '-'}</td>
                  <td class="barcode-cell">
                    ${barcodeSvgs[index]}
                    <div style="text-align: center; font-size: 10px; margin-top: 2px;">${product.barcode || ''}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait a bit for images to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
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
                    <div className="relative w-full max-w-md h-64 bg-background rounded-md overflow-hidden mb-4 border">
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

            <div className="container mx-auto px-4 py-8 lg:px-8 max-w-[1600px] animate-in fade-in duration-500">
                {/* Header & Stats Section */}
                <div className="space-y-8 mb-8">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
                        <div className="flex flex-col space-y-2">
                            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Inventory Management</h1>
                            <p className="text-muted-foreground font-medium">
                                Tracking <span className="text-foreground font-bold">{products.length}</span> products across <span className="text-foreground font-bold">{categories.length}</span> categories
                            </p>
                        </div>

                        {/* Search & Main Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative w-full sm:w-80 group">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Search by name or barcode... (F1)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 h-12 bg-muted/30 border-muted-foreground/10 hover:border-muted-foreground/20 focus:border-primary/50 rounded-2xl transition-all shadow-sm group-focus-within:shadow-md group-focus-within:bg-background"
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted rounded-xl"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <Button onClick={() => setShowForm(true)} className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <Plus className="mr-2 h-5 w-5" />
                                <span className="font-bold">New Product</span>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">Total Items</Badge>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-2xl font-black">{products.length}</h3>
                                    <p className="text-xs text-muted-foreground font-medium mt-1">Products in catalog</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                        <ArrowUpRight className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">Inventory Value</Badge>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-2xl font-black">{formatPrice(products.reduce((acc, p) => acc + (Number(p.price) * (p.stockQuantity || 0)), 0))}</h3>
                                    <p className="text-xs text-muted-foreground font-medium mt-1">Estimated stock value</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden ${lowStockProducts.length > 0 ? 'border-amber-500/50' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-2xl ${lowStockProducts.length > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-amber-500">Low Stock</Badge>
                                </div>
                                <div className="mt-4">
                                    <h3 className={`text-2xl font-black ${lowStockProducts.length > 0 ? 'text-amber-500' : ''}`}>{lowStockProducts.length}</h3>
                                    <p className="text-xs text-muted-foreground font-medium mt-1">Threshold: {LOW_STOCK_THRESHOLD} units</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden ${outOfStockProducts.length > 0 ? 'border-destructive/50' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-2xl ${outOfStockProducts.length > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                        <Ban className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-destructive">Out of Stock</Badge>
                                </div>
                                <div className="mt-4">
                                    <h3 className={`text-2xl font-black ${outOfStockProducts.length > 0 ? 'text-destructive' : ''}`}>{outOfStockProducts.length}</h3>
                                    <p className="text-xs text-muted-foreground font-medium mt-1">Needs immediate refill</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Secondary Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 p-2 bg-muted/40 rounded-[2rem] border border-border/40 overflow-x-auto no-scrollbar sticky top-4 z-10 backdrop-blur-md shadow-lg">
                    <div className="flex items-center gap-2 p-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="rounded-2xl hover:bg-background/50 text-xs font-bold px-4">
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    Manage Categories
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 rounded-2xl p-2">
                                <DropdownMenuItem onClick={() => { setShowCategoryDialog(true); setEditCategory(null); }} className="rounded-xl font-bold text-xs p-3">
                                    <Plus className="mr-2 h-4 w-4" /> Add New Category
                                </DropdownMenuItem>
                                <div className="h-px bg-border/50 my-1" />
                                {categories.map(category => (
                                    <DropdownMenuItem key={category.id} className="rounded-xl flex items-center justify-between group p-3">
                                        <span className="text-xs font-medium">{category.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => {
                                                e.stopPropagation();
                                                setEditCategory(category);
                                                setNewCategoryName(category.name);
                                                setNewCategoryDescription(category.description || '');
                                                setShowCategoryDialog(true);
                                            }}>
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete ${category.name}?`)) deleteCategoryMutation.mutate(category.id);
                                            }}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="sm" onClick={() => setIsCameraScanning(true)} className="rounded-2xl hover:bg-background/50 text-xs font-bold px-4">
                            <Camera className="mr-2 h-4 w-4" />
                            Camera Scan
                        </Button>
                        <div className="h-4 w-px bg-border/40 mx-1" />
                        <Button variant="ghost" size="sm" onClick={handleExportCSV} className="rounded-2xl hover:bg-background/50 text-xs font-bold px-4">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-2xl hover:bg-background/50 text-xs font-bold px-4">
                            <Download className="mr-2 h-4 w-4 rotate-180" />
                            Import
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handlePrintInventory} className="rounded-2xl hover:bg-background/50 text-xs font-bold px-4">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 p-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleImportCSV}
                            aria-label="Import products from CSV file"
                        />
                        {isBatchEditing ? (
                            <>
                                <Button size="sm" variant="default" onClick={handleSaveBatchEdits} className="rounded-2xl bg-primary h-9 px-4 font-bold shadow-lg shadow-primary/20">
                                    <Save className="mr-2 h-4 w-4" /> Save Batch
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelBatchEdits} className="rounded-2xl h-9 px-4 font-bold border-border/40">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" variant="ghost" onClick={() => setIsBatchEditing(true)} className="rounded-2xl hover:bg-background/50 text-xs font-bold px-4">
                                <Edit2 className="mr-2 h-4 w-4" /> Batch Edit
                            </Button>
                        )}
                        {selectedProducts.length > 0 && (
                            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="rounded-2xl h-9 px-4 font-bold shadow-lg shadow-destructive/20 animate-in zoom-in-95">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedProducts.length})
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
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={bulkUpdatingCount > 0 || updateProductMutation.isPending}
                                        onClick={() => {
                                            console.log('Bulk update button clicked for', outOfStockProducts.length, 'products');
                                            setBulkUpdatingCount(outOfStockProducts.length);
                                            let successCount = 0;
                                            let errorCount = 0;

                                            outOfStockProducts.forEach(product => {
                                                updateProductMutation.mutate(
                                                    {
                                                        id: product.id,
                                                        stockQuantity: (product.stockQuantity || 0) + 50
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                            successCount++;
                                                            console.log('Update succeeded for product', product.id, '- count:', successCount);
                                                            if (successCount + errorCount === outOfStockProducts.length) {
                                                                setBulkUpdatingCount(0);
                                                                toast({
                                                                    title: 'Stock Updated',
                                                                    description: `Successfully added 50 units to ${successCount} out of stock product${successCount > 1 ? 's' : ''}.${errorCount > 0 ? ` ${errorCount} update(s) failed.` : ''}`,
                                                                    variant: errorCount > 0 ? 'destructive' : 'default',
                                                                });
                                                            }
                                                        },
                                                        onError: (error) => {
                                                            errorCount++;
                                                            console.error('Update failed for product', product.id, ':', error);
                                                            if (successCount + errorCount === outOfStockProducts.length) {
                                                                setBulkUpdatingCount(0);
                                                                toast({
                                                                    title: 'Stock Update Partial Failure',
                                                                    description: `Added 50 units to ${successCount} out of stock product${successCount > 1 ? 's' : ''}. ${errorCount} update(s) failed.`,
                                                                    variant: 'destructive',
                                                                });
                                                            }
                                                        }
                                                    }
                                                );
                                            });
                                        }}
                                    >
                                        Add 50 Units to All Out of Stock Items
                                    </Button>
                                </div>
                            </Alert>
                        )}
                        {lowStockProducts.length > 0 && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Low Stock Alert</AlertTitle>
                                <AlertDescription>
                                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's have' : ' has'} low stock ({LOW_STOCK_THRESHOLD} or fewer items).
                                </AlertDescription>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={bulkUpdatingCount > 0 || updateProductMutation.isPending}
                                        onClick={() => {
                                            console.log('Bulk update button clicked for', lowStockProducts.length, 'low stock products');
                                            setBulkUpdatingCount(lowStockProducts.length);
                                            let successCount = 0;
                                            let errorCount = 0;

                                            lowStockProducts.forEach(product => {
                                                updateProductMutation.mutate(
                                                    {
                                                        id: product.id,
                                                        stockQuantity: (product.stockQuantity || 0) + 50
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                            successCount++;
                                                            console.log('Update succeeded for low stock product', product.id, '- count:', successCount);
                                                            if (successCount + errorCount === lowStockProducts.length) {
                                                                setBulkUpdatingCount(0);
                                                                toast({
                                                                    title: 'Stock Updated',
                                                                    description: `Successfully added 50 units to ${successCount} low stock product${successCount > 1 ? 's' : ''}.${errorCount > 0 ? ` ${errorCount} update(s) failed.` : ''}`,
                                                                    variant: errorCount > 0 ? 'destructive' : 'default',
                                                                });
                                                            }
                                                        },
                                                        onError: (error) => {
                                                            errorCount++;
                                                            console.error('Update failed for low stock product', product.id, ':', error);
                                                            if (successCount + errorCount === lowStockProducts.length) {
                                                                setBulkUpdatingCount(0);
                                                                toast({
                                                                    title: 'Stock Update Partial Failure',
                                                                    description: `Added 50 units to ${successCount} low stock product${successCount > 1 ? 's' : ''}. ${errorCount} update(s) failed.`,
                                                                    variant: 'destructive',
                                                                });
                                                            }
                                                        }
                                                    }
                                                );
                                            });
                                        }}
                                    >
                                        Add 50 Units to All Low Stock Items
                                    </Button>
                                </div>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Products Table */}
                <div className="bg-background border border-border/40 rounded-[2rem] overflow-hidden shadow-xl shadow-foreground/5 mb-8">
                    {/* Mobile View - Card Layout */}
                    <div className="block md:hidden">
                        {filteredProducts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground bg-muted/20">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg">No products found</p>
                                <p className="text-sm">Try adjusting your search or add a new item.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="p-6 space-y-4 hover:bg-muted/30 transition-colors" data-testid={`row-product-${product.id}`}>
                                        {/* Product Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                <Checkbox
                                                    checked={selectedProducts.includes(product.id)}
                                                    onCheckedChange={() => toggleSelectProduct(product.id)}
                                                    className="rounded-lg h-5 w-5 border-border/60"
                                                />
                                                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center overflow-hidden border border-border/20">
                                                    {product.image && (product.image.startsWith('data:image/') || product.image.startsWith('http')) ? (
                                                        <img
                                                            src={product.image || ''}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">{product.image || '📦'}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-base truncate">{product.name}</h3>
                                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-muted/80">{product.category}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background shadow-sm"
                                                    onClick={() => { setEditProduct(product); setShowForm(true); }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background shadow-sm text-destructive"
                                                    onClick={() => { setEditProduct(product); setShowDeleteDialog(true); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-2xl border border-border/10">
                                            <div>
                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Price</span>
                                                <div className="font-bold text-lg">{formatPrice(Number(product.price))}</div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Stock Level</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-bold text-lg">{product.stockQuantity ?? 0}</span>
                                                    {(product.stockQuantity ?? 0) === 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-black uppercase">Out</Badge>}
                                                    {(product.stockQuantity ?? 0) > 0 && (product.stockQuantity ?? 0) <= LOW_STOCK_THRESHOLD && <Badge className="bg-amber-500 hover:bg-amber-600 h-5 px-1.5 text-[10px] font-black uppercase">Low</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="w-[60px] pl-6">
                                        <Checkbox
                                            checked={products.length > 0 && selectedProducts.length === products.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="rounded-lg h-5 w-5 border-border/60 mt-1"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[100px] text-[11px] font-black uppercase tracking-widest text-muted-foreground">Preview</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Product Details</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Category</TableHead>
                                    <TableHead className="text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">Price</TableHead>
                                    <TableHead className="text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground">Stock</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Barcode</TableHead>
                                    <TableHead className="w-[100px] pr-6 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20 text-muted-foreground bg-muted/5">
                                            <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <div className="font-bold">No products found</div>
                                            <div className="text-xs">Adjust your search or filters to see more results</div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors border-border/40" data-testid={`row-product-${product.id}`}>
                                            <TableCell className="pl-6">
                                                <Checkbox
                                                    checked={selectedProducts.includes(product.id)}
                                                    onCheckedChange={() => toggleSelectProduct(product.id)}
                                                    className="rounded-lg h-5 w-5 border-border/60"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center overflow-hidden border border-border/20 group-hover:scale-110 transition-transform">
                                                    {product.image && (product.image.startsWith('data:image/') || product.image.startsWith('http')) ? (
                                                        <img
                                                            src={product.image || ''}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">{product.image || '📦'}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold py-6">
                                                {isBatchEditing ? (
                                                    <Input
                                                        value={batchEdits[product.id]?.name ?? product.name}
                                                        onChange={(e) => handleBatchEdit(product.id, 'name', e.target.value)}
                                                        className="h-10 rounded-xl bg-background border-border/60 focus:ring-primary/20"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black tracking-tight">{product.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 opacity-60">ID: {product.id}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isBatchEditing ? (
                                                    <Select
                                                        value={batchEdits[product.id]?.category ?? product.category ?? "Uncategorized"}
                                                        onValueChange={(value) => handleBatchEdit(product.id, 'category', value)}
                                                    >
                                                        <SelectTrigger className="h-10 rounded-xl bg-background border-border/60">
                                                            <SelectValue placeholder="Category" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat.id} value={cat.name} className="rounded-lg">
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-muted/60 text-[10px] font-bold uppercase tracking-widest">{product.category}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isBatchEditing ? (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={batchEdits[product.id]?.price ?? product.price}
                                                        onChange={(e) => handleBatchEdit(product.id, 'price', e.target.value)}
                                                        className="h-10 rounded-xl bg-background border-border/60 text-right w-24 ml-auto"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-black text-foreground">{formatPrice(Number(product.price))}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isBatchEditing ? (
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={batchEdits[product.id]?.stockQuantity ?? product.stockQuantity ?? ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const parsedValue = parseInt(value, 10);
                                                                handleBatchEdit(product.id, 'stockQuantity', isNaN(parsedValue) ? 0 : parsedValue);
                                                            }}
                                                            className="h-10 w-20 text-center rounded-xl bg-background border-border/60"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span data-testid={`text-stock-${product.id}`} className="text-sm font-black">{product.stockQuantity ?? 0}</span>
                                                            <div className="flex gap-1 mt-1">
                                                                {(product.stockQuantity || 0) === 0 && (
                                                                    <Badge variant="destructive" className="h-4 px-1 text-[9px] font-black uppercase">Out</Badge>
                                                                )}
                                                                {(product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) <= LOW_STOCK_THRESHOLD && (
                                                                    <Badge className="bg-amber-500 h-4 px-1 text-[9px] font-black uppercase">Low</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isBatchEditing ? (
                                                    <Input
                                                        value={batchEdits[product.id]?.barcode ?? product.barcode ?? ''}
                                                        onChange={(e) => handleBatchEdit(product.id, 'barcode', e.target.value)}
                                                        className="h-10 rounded-xl bg-background border-border/60 focus:ring-primary/20"
                                                        placeholder="Barcode"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">{product.barcode || '---'}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-6">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-background border border-transparent hover:border-border/40 shadow-none hover:shadow-sm transition-all"
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
                                                        className="h-9 w-9 rounded-xl hover:bg-background border border-transparent hover:border-border/40 shadow-none hover:shadow-sm text-destructive transition-all"
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
                                categories={categories}
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

            {/* Category Management Dialog */}
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editCategory ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Category Name</label>
                            <Input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Enter category name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description (Optional)</label>
                            <Input
                                value={newCategoryDescription}
                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                placeholder="Enter category description"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    if (editCategory) {
                                        updateCategoryMutation.mutate({
                                            id: editCategory.id,
                                            name: newCategoryName,
                                            description: newCategoryDescription,
                                        });
                                    } else {
                                        createCategoryMutation.mutate({
                                            name: newCategoryName,
                                            description: newCategoryDescription,
                                        });
                                    }
                                }}
                                disabled={!newCategoryName.trim()}
                                className="flex-1"
                            >
                                {editCategory ? 'Update Category' : 'Add Category'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCategoryDialog(false);
                                    setEditCategory(null);
                                    setNewCategoryName('');
                                    setNewCategoryDescription('');
                                }}
                            >
                                Cancel
                            </Button>
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