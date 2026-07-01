"use client";

/**
 * FieldHint keeps compact inline guidance available without adding persistent visual noise.
 */

import { CircleHelpIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldHintProps {
  children: React.ReactNode;
  htmlFor?: string;
  hint: string;
  className?: string;
}

/**
 * Renders a label with a small help affordance that exposes field meaning on hover.
 */
export function FieldHint({
  children,
  htmlFor,
  hint,
  className,
}: FieldHintProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-base text-foreground/90">
        {children}
      </Label>
      <button
        type="button"
        aria-label={hint}
        title={hint}
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary"
      >
        <CircleHelpIcon className="size-3.5" />
      </button>
    </div>
  );
}
