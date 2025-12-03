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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CustomerForm } from '@/components/customers/customer-form';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Edit2, Search, Users } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import type { Customer } from '@shared/schema';

export default function Customers() {
    const [editCustomer, setEditCustomer] = React.useState<Customer | null>(null);
    const [showForm, setShowForm] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const { toast } = useToast();

    const { data: customers = [], isLoading } = useQuery<Customer[]>({
        queryKey: ['/api/customers'],
    });

    const filteredCustomers = React.useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.phone && c.phone.includes(searchTerm))
        );
    }, [customers, searchTerm]);

    const createCustomerMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest('POST', '/api/customers', data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
            toast({ title: 'Customer created successfully' });
            setShowForm(false);
        },
    });

    const updateCustomerMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest('PATCH', `/api/customers/${data.id}`, data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
            toast({ title: 'Customer updated successfully' });
            setShowForm(false);
            setEditCustomer(null);
        },
    });

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    Loading...
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 md:h-6 md:w-6" />
                        Customers
                    </h1>
                    <Button size="sm" className="text-xs md:text-sm" onClick={() => setShowForm(true)}>
                        <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                        <span className="hidden xs:inline">Add Customer</span>
                        <span className="xs:hidden">Add</span>
                    </Button>
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 text-sm"
                        />
                    </div>
                </div>

                <div className="border rounded-md overflow-x-auto">
                    <Table className="min-w-[700px] md:min-w-0">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Name</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead>Loyalty Points</TableHead>
                                <TableHead>Total Spent</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium max-w-[140px]">
                                        <div className="truncate text-sm">{customer.name}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{customer.email || '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{customer.phone || '-'}</TableCell>
                                    <TableCell>{customer.loyaltyPoints}</TableCell>
                                    <TableCell>${Number(customer.totalSpent).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 touch-target-min"
                                            onClick={() => {
                                                setEditCustomer(customer);
                                                setShowForm(true);
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No customers found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editCustomer ? 'Edit Customer' : 'Add Customer'}
                        </DialogTitle>
                    </DialogHeader>
                    <CustomerForm
                        customer={editCustomer}
                        onSubmit={(data) => {
                            if (editCustomer) {
                                updateCustomerMutation.mutate({ ...data, id: editCustomer.id });
                            } else {
                                createCustomerMutation.mutate(data);
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
