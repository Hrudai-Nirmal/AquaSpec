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
      <span className="group/fieldhint relative inline-flex">
        <button
          type="button"
          aria-label={hint}
          title={hint}
          className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary"
        >
          <CircleHelpIcon className="size-3.5" />
        </button>
        <span className="pointer-events-none absolute bottom-[calc(100%+0.55rem)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-xl border border-border/70 bg-white px-3 py-2 text-xs font-medium leading-relaxed text-foreground opacity-0 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.26)] transition-all duration-200 group-hover/fieldhint:opacity-100 group-focus-within/fieldhint:opacity-100">
          {hint}
        </span>
      </span>
    </div>
  );
}
