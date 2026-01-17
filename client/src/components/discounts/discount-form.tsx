import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiscountSchema, type NewDiscount, type Discount } from "../../../../shared/types";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface DiscountFormProps {
    discount?: Discount | null;
    onSubmit: (data: NewDiscount) => void;
}

export function DiscountForm({ discount, onSubmit }: DiscountFormProps) {
    const form = useForm<NewDiscount>({
        resolver: zodResolver(insertDiscountSchema),
        defaultValues: discount || {
            name: "",
            type: "percentage",
            value: "0",
            active: true,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Discount Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select discount type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                                <Input 
                                    type="text" 
                                    inputMode="decimal"
                                    placeholder="0.00" 
                                    className="h-7 w-20 text-xs [-webkit-appearance:none] [appearance:none] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                                    {...field}
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
                    name="active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Active</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={!!field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full">
                    {discount ? "Update Discount" : "Create Discount"}
                </Button>
            </form>
        </Form>
    );
}