import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, XCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Order } from '../../../../shared/types';

interface VoidSaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVoidOrder: (orderId: number, reason: string) => Promise<void>;
    onVoidItems?: (orderId: number, itemIds: number[], reason: string) => Promise<void>;
}

export function VoidItemDialog({
    open,
    onOpenChange,
    onVoidOrder,
    onVoidItems
}: VoidSaleDialogProps) {
    const { formatPrice } = useCurrency();
    const [selectedOrderId, setSelectedOrderId] = React.useState<number | null>(null);
    const [selectedItemIds, setSelectedItemIds] = React.useState<number[]>([]);
    const [voidMode, setVoidMode] = React.useState<'order' | 'items'>('order');
    const [isVoiding, setIsVoiding] = React.useState(false);

    const { data: recentOrders = [] } = useQuery<Order[]>({
        queryKey: ['/api/orders/recent'],
        queryFn: async () => {
            // Get orders from today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = today.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            const response = await fetch(`/api/orders?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            const orders = await response.json();

            // Filter out already voided orders and return most recent 20
            return orders
                .filter((order: Order) => order.status !== 'voided')
                .sort((a: Order, b: Order) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                )
                .slice(0, 20);
        },
        enabled: open,
    });

    const selectedOrder = recentOrders.find(order => order.id === selectedOrderId);
    const orderItems = selectedOrder
        ? (typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items)
        : [];

    const handleVoid = async () => {
        if (!selectedOrderId) return;

        setIsVoiding(true);
        try {
            if (voidMode === 'order') {
                await onVoidOrder(selectedOrderId, 'Voided from POS');
            } else if (voidMode === 'items' && selectedItemIds.length > 0 && onVoidItems) {
                await onVoidItems(selectedOrderId, selectedItemIds, 'Items voided from POS');
            }

            // Reset state
            setSelectedOrderId(null);
            setSelectedItemIds([]);
            setVoidMode('order');
            onOpenChange(false);
        } catch (error) {
            console.error('Error voiding:', error);
        } finally {
            setIsVoiding(false);
        }
    };

    const toggleItemSelection = (itemIndex: number) => {
        setSelectedItemIds(prev =>
            prev.includes(itemIndex)
                ? prev.filter(id => id !== itemIndex)
                : [...prev, itemIndex]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <XCircle className="h-5 w-5 text-destructive" />
                        Void Completed Sale
                    </DialogTitle>
                    <DialogDescription>
                        Select a recent order to void the entire sale or specific items.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {recentOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No recent orders found to void</p>
                        </div>
                    ) : !selectedOrderId ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium mb-3">Select an order to void:</p>
                            {recentOrders.map((order) => (
                                <button
                                    key={order.id}
                                    onClick={() => {
                                        setSelectedOrderId(order.id);
                                        setSelectedItemIds([]);
                                        setVoidMode('order');
                                    }}
                                    className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-destructive/50 hover:bg-muted transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold">Order #{order.id}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {order.paymentMethod}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(order.createdAt || '').toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black">
                                                {formatPrice(Number(order.total))}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                    <div className="font-bold text-lg">Order #{selectedOrder?.id}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(selectedOrder?.createdAt || '').toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-destructive">
                                        {formatPrice(Number(selectedOrder?.total || 0))}
                                    </div>
                                    <Badge variant="outline">{selectedOrder?.paymentMethod}</Badge>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={voidMode === 'order' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setVoidMode('order');
                                        setSelectedItemIds([]);
                                    }}
                                    className="flex-1"
                                >
                                    Void Entire Order
                                </Button>
                                <Button
                                    variant={voidMode === 'items' ? 'default' : 'outline'}
                                    onClick={() => setVoidMode('items')}
                                    className="flex-1"
                                >
                                    Void Specific Items
                                </Button>
                            </div>

                            {voidMode === 'items' && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Select items to void:</p>
                                    {orderItems.map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedItemIds.includes(index)}
                                                onCheckedChange={() => toggleItemSelection(index)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold">{item.productName || 'Item'}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Qty: {item.quantity} × {formatPrice(Number(item.price))}
                                                </div>
                                            </div>
                                            <div className="font-bold">
                                                {formatPrice(Number(item.price) * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedOrderId(null);
                                    setSelectedItemIds([]);
                                    setVoidMode('order');
                                }}
                                className="w-full"
                            >
                                ← Back to Order List
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSelectedOrderId(null);
                            setSelectedItemIds([]);
                            setVoidMode('order');
                            onOpenChange(false);
                        }}
                        disabled={isVoiding}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleVoid}
                        disabled={
                            !selectedOrderId ||
                            (voidMode === 'items' && selectedItemIds.length === 0) ||
                            isVoiding
                        }
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        {isVoiding ? 'Voiding...' : voidMode === 'order' ? 'Void Order' : `Void ${selectedItemIds.length} Item(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
