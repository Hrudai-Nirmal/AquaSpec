"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const STEP_LABELS = [
  "Identity",
  "Water Profile",
  "Hydraulics",
  "Disinfection",
  "Review",
];

export function StepIndicator() {
  const activeStep = useStore((s) => s.activeStep);
  const setActiveStep = useStore((s) => s.setActiveStep);

  return (
    <div className="sticky bottom-0 z-40 border-t bg-background shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(activeStep - 1)}
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, idx) => {
            const step = idx + 1;
            const isActive = step === activeStep;
            const isPast = step < activeStep;
            return (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className="flex flex-col items-center gap-1 group"
                aria-label={`Step ${step}: ${label}`}
              >
                <span
                  className={`
                    flex items-center justify-center size-8 rounded-full text-xs font-semibold transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isPast
                          ? "bg-primary/60 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }
                    group-hover:ring-2 group-hover:ring-primary/30
                  `}
                >
                  {step}
                </span>
                <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight text-center">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={activeStep === 5}
          onClick={() => setActiveStep(activeStep + 1)}
        >
          Next
          <ChevronRightIcon className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
