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
    <div className={cn("group/fieldhint space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className="text-base text-foreground/90">
          {children}
        </Label>
        <button
          type="button"
          aria-label={hint}
          title={hint}
          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary"
        >
          <CircleHelpIcon className="size-3.5" />
        </button>
      </div>
      <p className="max-h-0 overflow-hidden rounded-xl border border-transparent bg-white/92 px-0 py-0 text-sm leading-relaxed text-foreground opacity-0 shadow-[0_14px_32px_-28px_rgba(15,23,42,0.24)] transition-all duration-200 group-hover/fieldhint:max-h-24 group-hover/fieldhint:border-border/70 group-hover/fieldhint:px-3 group-hover/fieldhint:py-2 group-hover/fieldhint:opacity-100 group-focus-within/fieldhint:max-h-24 group-focus-within/fieldhint:border-border/70 group-focus-within/fieldhint:px-3 group-focus-within/fieldhint:py-2 group-focus-within/fieldhint:opacity-100">
        {hint}
      </p>
    </div>
  );
}
