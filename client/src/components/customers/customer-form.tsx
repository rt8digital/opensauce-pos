import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type InsertCustomer, type Customer } from "@shared/schema";
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
import { Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";

interface CustomerFormProps {
    customer?: Customer | null;
    onSubmit: (data: InsertCustomer) => void;
    onDelete?: () => void;
}

export function CustomerForm({ customer, onSubmit, onDelete }: CustomerFormProps) {
    const form = useForm<InsertCustomer>({
        resolver: zodResolver(insertCustomerSchema),
        defaultValues: customer || {
            name: "",
            email: "",
            phone: "",
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
                                <Input placeholder="Customer Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="email@example.com" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone (WhatsApp)</FormLabel>
                            <FormControl>
                                <PhoneInput
                                    placeholder="Phone number for WhatsApp"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-between gap-4 pt-4">
                    {customer && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
                            className="w-full"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                    <Button type="submit" className="w-full">
                        {customer ? "Update Customer" : "Add Customer"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
