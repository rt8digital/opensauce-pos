import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Order } from '../../../../shared/types';

interface OrdersTableProps {
  orders: Order[];
  onPrintOrder: (order: Order) => void;
  onVoidOrder: (order: Order) => void;
  formatPrice: (price: number) => string;
  canVoidOrders: boolean;
}

export function OrdersTable({ orders, onPrintOrder, onVoidOrder, formatPrice, canVoidOrders }: OrdersTableProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Review and manage recent POS sales</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
          {orders.length} Total Records
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">Status</TableHead>
                <TableHead className="font-bold py-4">Order ID</TableHead>
                <TableHead className="font-bold py-4">Date & Time</TableHead>
                <TableHead className="font-bold py-4">Items Summary</TableHead>
                <TableHead className="font-bold py-4">Channel</TableHead>
                <TableHead className="font-bold py-4 text-right">Total Amount</TableHead>
                <TableHead className="font-bold py-4 text-center print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No transactions found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const items = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
                  const isVoided = order.status === 'voided' || order.status === 'cancelled';

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4">
                        {isVoided ? (
                          <Badge variant="destructive" className="flex w-fit items-center gap-1 font-medium bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">
                            <XCircle className="h-3 w-3" /> Voided
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex w-fit items-center gap-1 font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Success
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium py-4 text-muted-foreground">#{order.id}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(order.createdAt || new Date()).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="max-h-24 overflow-y-auto whitespace-nowrap scrollbar-hide">
                          {items.map((item: any, index: number) => {
                            const itemVoided = !!item.voided;
                            return (
                              <div key={index} className={cn(
                                "text-xs flex items-center gap-2 mb-0.5 last:mb-0",
                                itemVoided && "text-muted-foreground/50 italic opacity-60"
                              )}>
                                <span className={cn(itemVoided && "line-through")}>x{item.quantity}</span>
                                <span className={cn("font-medium truncate max-w-[150px]", itemVoided && "line-through")}>
                                  {item.productName || (item.product?.name) || 'Item'}
                                </span>
                                {itemVoided && <Badge variant="outline" className="text-[8px] py-0 px-1 border-rose-500/20 text-rose-500 h-3">Voided</Badge>}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-wider py-0 px-2">
                          {order.paymentMethod || 'Cash'}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold font-mono py-4",
                        isVoided ? "text-muted-foreground line-through" : "text-primary"
                      )}>
                        {formatPrice(Number(order.total))}
                      </TableCell>
                      <TableCell className="print:hidden py-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onPrintOrder(order)}
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                            title="Print Duplicate Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {canVoidOrders && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onVoidOrder(order)}
                              className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                isVoided
                                  ? "text-muted-foreground cursor-not-allowed"
                                  : "hover:bg-rose-500/10 hover:text-rose-500"
                              )}
                              title="Void Transaction"
                              disabled={isVoided}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}