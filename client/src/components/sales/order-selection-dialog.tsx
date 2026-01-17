import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Search, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';
import type { Order, OrderWithItems } from '../../../../shared/types';

interface OrderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderSelected: (orderId: number) => void;
  onItemsSelected: (orderId: number, itemIds: number[]) => void;
}

export function OrderSelectionDialog({ open, onOpenChange, onOrderSelected, onItemsSelected }: OrderSelectionDialogProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [step, setStep] = useState<'select' | 'items'>('select');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  // Fetch recent orders (completed, not voided, last 30 days)
  const { data: recentOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['recent-orders-for-void'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await apiRequest('GET', `/api/orders?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
      const allOrders = await response.json();
      // Filter for completed orders
      return allOrders.filter((order: Order) =>
        order.status === 'completed'
      ).slice(0, 10); // Limit to 10 most recent
    },
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch selected order with items
  const { data: selectedOrderData, isLoading: loadingSelectedOrder } = useQuery<OrderWithItems>({
    queryKey: ['order-with-items', selectedOrderId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/orders/${selectedOrderId}`);
      return await response.json();
    },
    enabled: !!selectedOrderId && step === 'items',
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setOrderNumber('');
      setSelectedOrderId('');
      setValidationError('');
      setStep('select');
      setSelectedOrder(null);
      setSelectedItemIds([]);
    }
  }, [open]);

  // Set selectedOrder when data is loaded
  useEffect(() => {
    if (selectedOrderData) {
      setSelectedOrder(selectedOrderData);
    }
  }, [selectedOrderData]);

  const validateOrder = async (orderId: number): Promise<boolean> => {
    try {
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      if (!response.ok) {
        setValidationError('Order not found');
        return false;
      }
      const order: Order = await response.json();
      if (order.status === 'voided' || order.status === 'cancelled') {
        setValidationError('This order cannot be voided');
        return false;
      }
      return true;
    } catch (error) {
      setValidationError('Error validating order');
      return false;
    }
  };

  const handleSubmit = async () => {
    let orderId: number;

    if (orderNumber.trim()) {
      orderId = parseInt(orderNumber.trim());
      if (isNaN(orderId)) {
        setValidationError('Invalid order number');
        return;
      }
    } else if (selectedOrderId) {
      orderId = parseInt(selectedOrderId);
    } else {
      setValidationError('Please enter an order number or select from recent orders');
      return;
    }

    setValidationError('');

    const isValid = await validateOrder(orderId);
    if (isValid) {
      setSelectedOrderId(orderId.toString());
      setStep('items');
    }
  };

  const handleSelectFromDropdown = (value: string) => {
    setSelectedOrderId(value);
    // Clear manual input when selecting from dropdown
    setOrderNumber('');
    setValidationError('');
  };

  const handleManualInputChange = (value: string) => {
    setOrderNumber(value);
    // Clear dropdown selection when typing manually
    setSelectedOrderId('');
    setValidationError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {step === 'select' ? 'Void Sale - Select Order' : 'Void Sale - Select Items'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Enter an order number or select from recent orders to void the sale.'
              : 'Select specific items to void or void the entire order.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'select' ? (
            <>
              {/* Manual Order Number Input */}
              <div className="space-y-2">
                <Label htmlFor="order-number">Order Number</Label>
                <Input
                  id="order-number"
                  type="number"
                  placeholder="Enter order number"
                  value={orderNumber}
                  onChange={(e) => handleManualInputChange(e.target.value)}
                  className="text-center text-lg"
                />
              </div>

              {/* Recent Orders Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="recent-orders">Or Select from Recent Orders</Label>
                <Select value={selectedOrderId} onValueChange={handleSelectFromDropdown}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recent order" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : recentOrders.length === 0 ? (
                      <SelectItem value="none" disabled>No recent orders available</SelectItem>
                    ) : (
                      recentOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id.toString()}>
                          Order #{order.id} - {new Date(order.createdAt || new Date()).toLocaleString()} - R{order.total}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Validation Error */}
              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <>
              {loadingSelectedOrder ? (
                <div>Loading order details...</div>
              ) : selectedOrder ? (
                <>
                  {/* Order Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Order #{selectedOrder.id}</span>
                      <span>{new Date(selectedOrder.createdAt || new Date()).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>R{selectedOrder.total}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Items in Order</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {(() => {
                        let displayItems = [];
                        if (selectedOrder.orderItems && selectedOrder.orderItems.length > 0) {
                          displayItems = selectedOrder.orderItems;
                        } else if (selectedOrder.items) {
                          try {
                            const parsed = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items;
                            displayItems = Array.isArray(parsed) ? parsed : [];
                          } catch (e) {
                            console.error('Failed to parse items string in dialog', e);
                            displayItems = [];
                          }
                        } else {
                          displayItems = [];
                        }

                        if (!displayItems || displayItems.length === 0) {
                          return <div className="text-muted-foreground text-sm italic p-4 text-center border rounded-md">No items found in this order.</div>;
                        }

                        return displayItems.map((item: any, idx: number) => {
                          const itemId = item.id || item.productId || `item-${idx}`;
                          const itemName = item.product?.name || item.productName || item.name || 'Unknown Product';
                          const isVoided = !!item.voided;
                          const isChecked = selectedItemIds.includes(itemId);

                          return (
                            <div key={itemId} className={cn(
                              "flex items-center space-x-3 p-3 border rounded-lg transition-colors",
                              isChecked ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-accent/50",
                              isVoided && "opacity-50 grayscale bg-muted/30"
                            )}>
                              <Checkbox
                                id={`item-${itemId}`}
                                checked={isVoided || isChecked}
                                disabled={isVoided}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedItemIds(prev => [...prev, itemId]);
                                  } else {
                                    setSelectedItemIds(prev => prev.filter(prevId => prevId !== itemId));
                                  }
                                }}
                                className="h-5 w-5"
                              />
                              <label
                                htmlFor={`item-${itemId}`}
                                className={cn(
                                  "flex-1 flex justify-between items-center cursor-pointer",
                                  isVoided && "cursor-not-allowed"
                                )}
                              >
                                <span className={cn("font-medium text-sm", isVoided && "line-through")}>
                                  {itemName}
                                  {isVoided && <span className="ml-2 text-[10px] text-rose-500 font-bold uppercase tracking-tight">[Voided]</span>}
                                </span>
                                <span className={cn("text-muted-foreground text-xs", isVoided && "line-through")}>
                                  x{item.quantity} — R{item.price}
                                </span>
                              </label>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                <div>Order not found</div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'select' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (!orderNumber.trim() && !selectedOrderId)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedOrder) {
                    onOrderSelected(selectedOrder.id);
                    onOpenChange(false);
                  }
                }}
              >
                Void Entire Order
              </Button>
              <Button
                onClick={() => {
                  if (selectedOrder && selectedItemIds.length > 0) {
                    onItemsSelected(selectedOrder.id, selectedItemIds);
                    onOpenChange(false);
                  }
                }}
                disabled={selectedItemIds.length === 0}
              >
                Void Selected Items
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}