import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { Printer, ScanLine, Coins } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

interface SettingsFormValues {
  currency: string;
  printerName: string;
  scannerDeviceId: string;
}

const currencies = [
  { label: 'US Dollar', value: '$' },
  { label: 'Euro', value: '€' },
  { label: 'British Pound', value: '£' },
  { label: 'Japanese Yen', value: '¥' },
] as const;

export function SettingsDialog({ 
  open, 
  onOpenChange, 
  currency,
  onCurrencyChange 
}: SettingsDialogProps) {
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      currency,
      printerName: '',
      scannerDeviceId: '',
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    onCurrencyChange(data.currency);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Currency
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label} ({currency.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="printerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Receipt Printer
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter printer name" />
                  </FormControl>
                  <FormDescription>
                    Leave empty to use system default printer
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scannerDeviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    Barcode Scanner
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Scanner device ID" />
                  </FormControl>
                  <FormDescription>
                    Enter your scanner's device ID for auto-detection
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}