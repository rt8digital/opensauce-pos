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
import { insertProductSchema } from '@shared/schema';
import type { Product } from '@shared/schema';
import { Trash2, QrCode, Smile } from 'lucide-react'; // Import icons
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
import { Check, ChevronsUpDown, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  product?: Product | null;
  categories?: string[];
  onSubmit: (data: Omit<Product, 'id'>) => void;
  onDelete?: () => void;
}

export function ProductForm({ product, categories = [], onSubmit, onDelete }: ProductFormProps) {
  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: product || {
      name: '',
      price: '',
      image: '📦', // Default emoji
      stockQuantity: 0,
      barcode: '',
      category: 'General',
    },
  });

  const [isScannerActive, setIsScannerActive] = React.useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative"> {/* Add relative positioning for the overlay */}
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
                  type="number"
                  step="0.01"
                  min="0"
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
                  type="number"
                  min="0"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
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
              <FormLabel>Barcode</FormLabel>
              <div className="flex gap-2"> {/* Flex container for input and button */}
                <FormControl>
                  <Input {...field} className="flex-1" />
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
              <FormLabel>PLU Code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Enter PLU code (optional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-2">
                  <div className="text-4xl p-2 border rounded-md bg-muted/30">
                    {field.value || '📦'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {field.value ? 'Selected icon' : 'No icon selected'}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEmojiPickerOpen(true)}
                >
                  <Smile className="h-4 w-4 mr-2" />
                  Choose Icon
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <EmojiPicker
          open={isEmojiPickerOpen}
          onOpenChange={setIsEmojiPickerOpen}
          onSelect={(emoji) => form.setValue('image', emoji)}
          selectedEmoji={form.watch('image')}
        />

        <FormField
          control={form.control}
          name="category"
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
                        ? field.value
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
                            field.onChange(document.querySelector<HTMLInputElement>('input[cmdk-input]')?.value);
                          }}
                        >
                          Create new "{document.querySelector<HTMLInputElement>('input[cmdk-input]')?.value}"
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            value={category}
                            key={category}
                            onSelect={() => {
                              field.onChange(category);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category}
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
