import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SavedCart {
    id: string;
    name: string;
    items: any[];
    total: string;
    timestamp: number;
}

interface SavedCartsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    savedCarts: SavedCart[];
    onLoadCart: (cartId: string) => Promise<void>;
    onDeleteCart: (cartId: string) => void;
}

export function SavedCartsDialog({
    isOpen,
    onClose,
    savedCarts,
    onLoadCart,
    onDeleteCart,
}: SavedCartsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Saved Carts</DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-auto">
                    {savedCarts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No saved carts found</div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {savedCarts.map((saved) => (
                                <div
                                    key={saved.id}
                                    className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer flex items-center justify-between"
                                    onClick={() => onLoadCart(saved.id)}
                                >
                                    <div>
                                        <p className="font-semibold">{saved.name || `Cart #${saved.id.toString().slice(-4)}`}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {saved.items.length} items • R{parseFloat(saved.total).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(saved.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCart(saved.id);
                                        }}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}