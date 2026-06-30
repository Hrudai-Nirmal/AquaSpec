"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UnsavedWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndLoad: () => void;
  onDiscardAndLoad: () => void;
  targetConfigName: string;
}

export function UnsavedWorkDialog({
  open,
  onOpenChange,
  onSaveAndLoad,
  onDiscardAndLoad,
  targetConfigName,
}: UnsavedWorkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Would you like to save your current work
            before loading <strong>{targetConfigName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDiscardAndLoad();
            }}
          >
            Discard &amp; Load
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onSaveAndLoad();
            }}
          >
            Save &amp; Load
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
