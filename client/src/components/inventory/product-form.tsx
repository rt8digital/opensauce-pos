import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { insertProductSchema } from '../../../../shared/types';
import type { Product, Category } from '../../../../shared/types';
import { Trash2, QrCode, Smile, Upload, Link, Check, ChevronsUpDown } from 'lucide-react'; // Import icons
import { scanner } from '@/lib/scanner'; // Import the scanner utility
import { useToast } from '@/hooks/use-toast'; // Import useToast for feedback
import { EmojiPicker } from '@/components/ui/emoji-picker'; // Import emoji picker

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormProps {
  product?: Product | null;
  categories?: Category[];
  onSubmit: (data: Omit<Product, 'id'>) => void;
  onDelete?: () => void;
}

export function ProductForm({ product, categories = [], onSubmit, onDelete }: ProductFormProps) {
  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: product ? {
      // Only include fields that match the insertProductSchema
      name: product.name,
      price: product.price,
      cost: product.cost || undefined,
      image: product.image || '📦',
      stockQuantity: product.stockQuantity ?? (product as any).stock_quantity ?? 0,
      barcode: product.barcode || undefined,
      plu: product.plu || undefined,
      categoryId: product.categoryId || undefined, // Use category ID, not name
      weight: product.weight || undefined,
      weightUnit: product.weightUnit || undefined,
    } : {
      name: '',
      price: '',
      cost: undefined,
      image: '📦', // Default emoji
      stockQuantity: 0,
      barcode: undefined,
      plu: undefined,
      categoryId: undefined,
      weight: undefined,
      weightUnit: undefined,
    },
  });

  // Submit handler that uses the form data directly since it now matches the schema
  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  const [isScannerActive, setIsScannerActive] = React.useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);
  const [imageType, setImageType] = React.useState<'emoji' | 'url' | 'upload'>('emoji');
  const [imageUrl, setImageUrl] = React.useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Effect to manage scanner lifecycle
  React.useEffect(() => {
    if (isScannerActive && videoRef.current) {
      scanner.start(videoRef.current, handleScannedBarcode)
        .catch(err => {
          console.error("Failed to start scanner in product form:", err);
          toast({
            title: "Scanner Error",
            description: "Could not start camera. Please ensure camera permissions are granted.",
            variant: "destructive",
          });
          setIsScannerActive(false); // Close scanner on error
        });
    } else {
      scanner.stop();
    }

    return () => {
      scanner.stop(); // Ensure scanner is stopped on unmount or dialog close
    };
  }, [isScannerActive]);

  const handleScannedBarcode = (barcode: string) => {
    form.setValue('barcode', barcode, { shouldValidate: true }); // Set the scanned barcode to the form field
    setIsScannerActive(false); // Stop scanner after successful scan
    toast({
      title: "Barcode Scanned",
      description: `Barcode "${barcode}" set for product.`,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      form.setValue('image', base64);
      setImageType('upload');
      toast({
        title: "Image Uploaded",
        description: "Image has been uploaded successfully.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl.trim()) {
      form.setValue('image', imageUrl.trim());
      setImageType('url');
      setImageUrl('');
      toast({
        title: "Image URL Set",
        description: "Image URL has been set successfully.",
      });
    }
  };

  // Initialize image type based on existing image
  React.useEffect(() => {
    const currentImage = form.watch('image');
    if (currentImage) {
      if (currentImage.startsWith('data:image/')) {
        setImageType('upload');
      } else if (currentImage.startsWith('http') || currentImage.startsWith('https')) {
        setImageType('url');
        setImageUrl(currentImage);
      } else {
        setImageType('emoji');
      }
    }
  }, [form.watch('image')]);



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 relative"> {/* Add relative positioning for the overlay */}
        {isScannerActive && (
          <div className="absolute inset-0 z-10 bg-background flex flex-col items-center justify-center p-4 rounded-lg">
            <div className="relative w-full max-w-md h-64 bg-black rounded-md overflow-hidden mb-4">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline></video>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-24 border-2 border-primary opacity-75 rounded-md animate-pulse"></div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Position the barcode within the frame.
            </p>
            <Button onClick={() => setIsScannerActive(false)} variant="secondary">
              Stop Scanning
            </Button>
          </div>
        )}

        {/* All form fields are rendered, but the scanner overlay will cover them when active */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  inputMode="decimal"
                  min="0"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty input or valid decimal numbers
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      field.onChange(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters except decimal point
                    if (!/[0-9.]/.test(e.key) &&
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                    // Prevent multiple decimal points
                    if (e.key === '.' && e.currentTarget.value.includes('.')) {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost/Purchase Price (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="text"
                  inputMode="decimal"
                  min="0"
                  placeholder="0.00"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty input or valid decimal numbers
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      field.onChange(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters except decimal point
                    if (!/[0-9.]/.test(e.key) &&
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                    // Prevent multiple decimal points
                    if (e.key === '.' && e.currentTarget.value.includes('.')) {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stockQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Quantity</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  min="0"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty input or valid positive integers
                    if (value === '' || /^\d+$/.test(value)) {
                      // If the input is empty, set undefined to match the schema preprocessing
                      if (value === '') {
                        field.onChange(undefined);
                      } else {
                        // Parse the value and handle NaN case
                        const parsedValue = parseInt(value, 10);
                        field.onChange(isNaN(parsedValue) ? 0 : parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters
                    if (!/[0-9]/.test(e.key) &&
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode (Optional)</FormLabel>
              <div className="flex gap-2"> {/* Flex container for input and button */}
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Enter barcode (optional)" className="flex-1" />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScannerActive(true)}
                  className="w-auto"
                >
                  <QrCode className="h-4 w-4" />
                  Scan
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PLU Code (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Enter PLU code (optional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="decimal"
                    min="0"
                    placeholder="Enter weight (optional)"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty input or valid decimal numbers
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        field.onChange(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent non-numeric characters except decimal point
                      if (!/[0-9.]/.test(e.key) &&
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                      // Prevent multiple decimal points
                      if (e.key === '.' && e.currentTarget.value.includes('.')) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mg">Milligrams (mg)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="oz">Ounces (oz)</SelectItem>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <div className="space-y-3">
                {/* Image Type Selector */}
                <Select value={imageType} onValueChange={(value: 'emoji' | 'url' | 'upload') => setImageType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emoji">Emoji</SelectItem>
                    <SelectItem value="url">Image URL</SelectItem>
                    <SelectItem value="upload">Upload Image</SelectItem>
                  </SelectContent>
                </Select>

                {/* Image Preview */}
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                  {field.value ? (
                    field.value.startsWith('data:image/') || field.value.startsWith('http') ? (
                      <img
                        src={field.value}
                        alt="Product"
                        className="w-12 h-12 object-cover rounded border"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          const fallback = img.nextElementSibling as HTMLElement;
                          img.style.display = 'none';
                          if (fallback) {
                            fallback.textContent = '❌';
                            fallback.style.display = 'block';
                          }
                        }}
                      />
                    ) : (
                      <div className="text-3xl">{field.value}</div>
                    )
                  ) : (
                    <div className="text-3xl text-muted-foreground">📦</div>
                  )}
                  <div className="text-sm text-muted-foreground flex-1">
                    {field.value ? (
                      imageType === 'emoji' ? 'Emoji selected' :
                        imageType === 'url' ? 'URL image selected' :
                          'Uploaded image selected'
                    ) : 'No image selected'}
                  </div>
                </div>

                {/* Image Input Controls */}
                {imageType === 'emoji' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmojiPickerOpen(true)}
                    className="w-full"
                  >
                    <Smile className="h-4 w-4 mr-2" />
                    Choose Emoji
                  </Button>
                )}

                {imageType === 'url' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUrlSubmit}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Set URL
                    </Button>
                  </div>
                )}

                {imageType === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      aria-label="Upload product image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <EmojiPicker
          open={isEmojiPickerOpen}
          onOpenChange={setIsEmojiPickerOpen}
          onSelect={(emoji) => {
            form.setValue('image', emoji);
            setImageType('emoji');
          }}
          selectedEmoji={form.watch('image')}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Category</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? categories.find((category) => category.id === field.value)?.name
                        : "Select category"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList>
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            // This is for creating new categories - keeping this for now
                            const newCategoryName = document.querySelector<HTMLInputElement>('input[cmdk-input]')?.value;
                            if (newCategoryName) {
                              // For new category, we need to call the parent onSubmit with the new category
                              // This is more complex, so for now, we'll just let it work with existing categories
                              field.onChange(null); // Reset to no category selected
                            }
                          }}
                        >
                          Create new "{document.querySelector<HTMLInputElement>('input[cmdk-input]')?.value}"
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            value={category.name}
                            key={category.id}
                            onSelect={() => {
                              field.onChange(category.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {product ? 'Update Product' : 'Add Product'}
          </Button>
          {product && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              className="w-24"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}