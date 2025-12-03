import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const shortcuts = [
    {
        category: "Navigation", items: [
            { key: "F1", description: "Focus Search" },
            { key: "F2", description: "Toggle Barcode Scanner" },
            { key: "F3", description: "Checkout / Pay" },
            { key: "F4", description: "Add Custom Item" },
            { key: "F5", description: "Open Inventory" },
            { key: "F8", description: "Open Settings" },
            { key: "F9", description: "Open Customer Display" },
            { key: "Esc", description: "Close Dialogs / Cancel" },
            { key: "?", description: "Show Keyboard Shortcuts" },
        ]
    },
    {
        category: "Numpad Entry", items: [
            { key: "0-9", description: "Enter digits" },
            { key: "Enter", description: "Submit PLU/Barcode" },
            { key: "Qty * PLU", description: "Add multiple items (e.g., 5*123)" },
            { key: "Amount +", description: "Add custom amount" },
            { key: "Backspace", description: "Delete last digit" },
            { key: "Esc", description: "Clear entry" },
        ]
    },
    {
        category: "Cart Management", items: [
            { key: "Ctrl + ↑/↓", description: "Navigate cart items" },
            { key: "Ctrl + Delete", description: "Remove selected item" },
            { key: "Ctrl + +", description: "Increase quantity" },
            { key: "Ctrl + -", description: "Decrease quantity" },
            { key: "Ctrl + C", description: "Clear cart" },
        ]
    },
    {
        category: "Payment", items: [
            { key: "Alt + 1", description: "Cash Payment" },
            { key: "Alt + 2", description: "Card Payment" },
            { key: "Alt + 3", description: "QR Payment" },
            { key: "Enter", description: "Process Payment (in dialog)" },
        ]
    },
];

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {shortcuts.map((category) => (
                        <div key={category.category}>
                            <h3 className="font-semibold text-sm mb-2 text-muted-foreground">
                                {category.category}
                            </h3>
                            <Table>
                                <TableBody>
                                    {category.items.map((shortcut, idx) => (
                                        <TableRow key={`${category.category}-${idx}`}>
                                            <TableCell className="font-mono font-bold bg-muted/50 rounded w-32">
                                                {shortcut.key}
                                            </TableCell>
                                            <TableCell>{shortcut.description}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
