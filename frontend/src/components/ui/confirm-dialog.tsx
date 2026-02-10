import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  processingText = "Processing...",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  message: string;
  processingText?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2 justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              {cancelText}
            </Button>
          </DialogClose>
          <Button variant={variant} onClick={handleConfirm} disabled={submitting}>
            {submitting ? processingText : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
