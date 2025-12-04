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
import { DiscountForm } from '@/components/discounts/discount-form';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Edit2, Tag, Percent } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Discount } from '@shared/schema';

export default function Discounts() {
    const [editDiscount, setEditDiscount] = React.useState<Discount | null>(null);
    const [showForm, setShowForm] = React.useState(false);
    const { toast } = useToast();

    const { data: discounts = [], isLoading } = useQuery<Discount[]>({
        queryKey: ['/api/discounts'],
    });

    const createDiscountMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest('POST', '/api/discounts', data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
            toast({ title: 'Discount created successfully' });
            setShowForm(false);
        },
    });

    const updateDiscountMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest('PATCH', `/api/discounts/${data.id}`, data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
            toast({ title: 'Discount updated successfully' });
            setShowForm(false);
            setEditDiscount(null);
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
                        <Tag className="h-5 w-5 md:h-6 md:w-6" />
                        Discounts & Promotions
                    </h1>
                    <Button size="sm" className="text-xs md:text-sm" onClick={() => setShowForm(true)}>
                        <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                        <span className="hidden xs:inline">Add Discount</span>
                        <span className="xs:hidden">Add</span>
                    </Button>
                </div>

                <div className="border rounded-md overflow-x-auto">
                    <Table className="min-w-[600px] md:min-w-0">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="hidden md:table-cell">Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discounts.map((discount) => (
                                <TableRow key={discount.id}>
                                    <TableCell className="font-medium max-w-[190px]">
                                        <div className="truncate text-sm">{discount.name}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell capitalize">{discount.type}</TableCell>
                                    <TableCell>
                                        {discount.type === 'percentage' ? `${discount.value}%` : `$${Number(discount.value).toFixed(2)}`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={discount.active ? 'default' : 'secondary'} className="text-xs">
                                            {discount.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 touch-target-min"
                                            onClick={() => {
                                                setEditDiscount(discount);
                                                setShowForm(true);
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {discounts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No discounts found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-full h-full max-h-full p-0 gap-0 bg-background">
                    <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <DialogTitle className="text-xl font-semibold">
                            {editDiscount ? 'Edit Discount' : 'Add New Discount'}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {editDiscount ? 'Update discount settings and conditions' : 'Create a new discount or promotion'}
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="max-w-2xl mx-auto">
                            <DiscountForm
                                discount={editDiscount}
                                onSubmit={(data) => {
                                    if (editDiscount) {
                                        updateDiscountMutation.mutate({ ...data, id: editDiscount.id });
                                    } else {
                                        createDiscountMutation.mutate(data);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
