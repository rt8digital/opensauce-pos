import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndConfirm: () => void;
  onDiscardAndLeave: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSaveAndConfirm,
  onDiscardAndLeave,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Would you like to save them before leaving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={onDiscardAndLeave}
            className="w-full sm:w-auto"
          >
            Discard Changes
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onSaveAndConfirm}
            className="w-full sm:w-auto"
          >
            Save Changes and Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}