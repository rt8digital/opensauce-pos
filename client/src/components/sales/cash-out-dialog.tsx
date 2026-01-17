import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/contexts/currency-context';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePeripherals } from '@/hooks/use-peripherals';
import { Calculator, DollarSign, CheckCircle } from 'lucide-react';

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string; // Optional date, defaults to today
}

export function CashOutDialog({ open, onOpenChange, date }: CashOutDialogProps) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [cashOutData, setCashOutData] = useState<any>(null);
  // isLoading state removed as it was unused
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [finalData, setFinalData] = useState<any>(null);

  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { openCashDrawer, printCashOutReport } = usePeripherals();
  const queryClient = useQueryClient();

  // Get today's date if not provided
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Load cash out summary when dialog opens
  useEffect(() => {
    if (open && targetDate) {
      loadCashOutSummary();
    }
  }, [open, targetDate]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setActualCash('');
      setNotes('');
      setCashOutData(null);
      setConfirmDialogOpen(false);
      setFinalData(null);
    }
  }, [open]);

  const loadCashOutSummary = async () => {
    try {
      const response = await apiRequest('GET', `/api/cash-outs/daily-summary?date=${encodeURIComponent(targetDate)}`);
      const data = await response.json();
      setCashOutData(data);
    } catch (error) {
      console.error('Error loading cash out summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cash out summary.',
        variant: 'destructive',
      });
    }
  };

  const createCashOutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/cash-outs', data);
      return response.json();
    },
    onSuccess: async () => {
      // Open cash drawer after successful cash out
      try {
        await openCashDrawer();
      } catch (error) {
        console.warn('Failed to open cash drawer:', error);
      }

      // Print cash out report
      if (cashOutData && finalData) {
        try {
          await printCashOutReport(cashOutData, finalData);
        } catch (error) {
          console.warn('Failed to print cash out report:', error);
        }
      }

      toast({
        title: 'Cash Out Completed',
        description: `Cash out recorded successfully. Cash drawer opened.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Cash Out Failed',
        description: error.message || 'Failed to complete cash out.',
        variant: 'destructive',
      });
    },
  });

  const handleCashOut = () => {
    if (!cashOutData || !actualCash.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the actual cash counted.',
        variant: 'destructive',
      });
      return;
    }

    const actualAmount = parseFloat(actualCash);
    const expectedAmount = parseFloat(cashOutData.expectedCash);
    const discrepancy = actualAmount - expectedAmount;

    const finalCashOutData = {
      date: cashOutData.date,
      openingCash: cashOutData.openingCash,
      cashReceived: cashOutData.cashReceived,
      changeGiven: cashOutData.changeGiven,
      expectedCash: cashOutData.expectedCash,
      actualCash: actualAmount.toFixed(2),
      discrepancy: discrepancy.toFixed(2),
      notes: notes.trim(),
    };

    setFinalData(finalCashOutData);
    setConfirmDialogOpen(true);
  };

  const confirmCashOut = () => {
    if (finalData) {
      createCashOutMutation.mutate(finalData);
    }
  };

  const expectedCash = cashOutData ? parseFloat(cashOutData.expectedCash) : 0;
  const actualAmount = parseFloat(actualCash) || 0;
  const discrepancy = actualAmount - expectedCash;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Daily Cash Out - {new Date(targetDate).toLocaleDateString()}
            </DialogTitle>
            <DialogDescription>
              Review cash transactions and complete the cash out process.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Section */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Opening Cash:</span>
                  <span className="font-semibold">{cashOutData ? formatPrice(cashOutData.openingCash) : 'R 0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cash Received:</span>
                  <span className="font-semibold text-green-600">{cashOutData ? formatPrice(cashOutData.cashReceived) : 'R 0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Change Given:</span>
                  <span className="font-semibold text-red-600">-{cashOutData ? formatPrice(cashOutData.changeGiven) : 'R 0.00'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Expected Cash:</span>
                  <span className="font-bold text-lg">{cashOutData ? formatPrice(cashOutData.expectedCash) : 'R 0.00'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transactions:</span>
                  <span className="font-semibold">{cashOutData?.transactionCount || 0}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual-cash">Actual Cash Counted:</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="actual-cash"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {actualCash && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Discrepancy:</span>
                    <span className={`font-semibold ${discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {discrepancy >= 0 ? '+' : ''}{formatPrice(Math.abs(discrepancy))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Metrics Section */}
            {cashOutData && cashOutData.totalSales && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{cashOutData.totalItems}</div>
                  <div className="text-sm text-muted-foreground">Items Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatPrice(cashOutData.totalSales)}</div>
                  <div className="text-sm text-muted-foreground">Total Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatPrice(cashOutData.totalProfit)}</div>
                  <div className="text-sm text-muted-foreground">Total Profit</div>
                </div>
              </div>
            )}

            {/* User Breakdown Section */}
            {cashOutData && cashOutData.users && cashOutData.users.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Sales by User</h3>
                <div className="space-y-2">
                  {cashOutData.users.map((user: any) => (
                    <div key={user.userId} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.orderCount} orders • {user.totalItems} items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(user.totalSales)}</div>
                        <div className="text-sm text-green-600">{formatPrice(user.totalProfit)} profit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional):</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the cash out..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCashOut}
              disabled={!cashOutData || !actualCash.trim() || createCashOutMutation.isPending}
              className="min-w-[120px]"
            >
              {createCashOutMutation.isPending ? (
                <>
                  <Calculator className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Cash Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cash Out</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the cash out details before confirming. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {finalData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Expected Cash:</span>
                  <span className="font-semibold">{formatPrice(finalData.expectedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Cash:</span>
                  <span className="font-semibold">{formatPrice(finalData.actualCash)}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>Discrepancy:</span>
                  <span className={`font-semibold ${parseFloat(finalData.discrepancy) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(finalData.discrepancy) >= 0 ? '+' : ''}{formatPrice(Math.abs(parseFloat(finalData.discrepancy)))}
                  </span>
                </div>
              </div>

              {finalData.notes && (
                <div>
                  <span className="text-sm font-medium">Notes:</span>
                  <p className="text-sm text-muted-foreground mt-1">{finalData.notes}</p>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCashOut} className="bg-green-600 hover:bg-green-700">
              Confirm Cash Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}