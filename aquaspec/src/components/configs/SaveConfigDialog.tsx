"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

interface SaveConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function SaveConfigDialog({
  open,
  onOpenChange,
  onSave,
}: SaveConfigDialogProps) {
  const hatcheryName = useStore((s) => s.hatcheryName);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-populate with hatchery name on open
  useEffect(() => {
    if (open) {
      setName(hatcheryName || "");
      // Auto-focus input after a tick
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open, hatcheryName]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;

  function handleSubmit() {
    if (!canSave) return;
    onSave(trimmed);
    onOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Save Configuration</DialogTitle>
          <DialogDescription>
            Give your configuration a name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Coastal Hatchery Setup"
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
