import * as React from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/customer-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { offlineDataManager } from "@/lib/offline-data-manager";
import { useToast } from "@/hooks/use-toast";

interface CustomerSelectProps {
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSelect({ selectedCustomer, onSelectCustomer }: CustomerSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [showAddCustomer, setShowAddCustomer] = React.useState(false);
    const { toast } = useToast();

    const { data: customers = [] } = useQuery<Customer[]>({
        queryKey: ['/api/customers'],
        queryFn: () => offlineDataManager.getCustomers(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const handleCreateCustomer = async (data: any) => {
        try {
            const res = await apiRequest('POST', '/api/customers', data);
            const newCustomer = await res.json();
            queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
            onSelectCustomer(newCustomer);
            setShowAddCustomer(false);
            setOpen(false);
            toast({ title: "Customer created and selected" });
        } catch (error) {
            toast({
                title: "Failed to create customer",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Search customer..." />
                        <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        onSelectCustomer(null);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !selectedCustomer ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Walk-in Customer
                                </CommandItem>
                                {customers.map((customer) => (
                                    <CommandItem
                                        key={customer.id}
                                        onSelect={() => {
                                            onSelectCustomer(customer);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {customer.name}
                                        {customer.phone && <span className="ml-2 text-muted-foreground text-xs">({customer.phone})</span>}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <CustomerForm onSubmit={handleCreateCustomer} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
