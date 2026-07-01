"use client";

import { Fragment } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Identity", "Water", "Hydraulics", "Disinfect", "Review"];

/** Keeps the wizard navigation readable while reflecting the branded states. */
export function StepIndicator() {
  const activeStep = useStore((s) => s.activeStep);
  const setActiveStep = useStore((s) => s.setActiveStep);

  return (
    <div className="footer-frost sticky bottom-0 z-40 border-t border-border/80 bg-card/85 backdrop-blur-md shadow-[0_-18px_40px_-28px_rgba(63,70,80,0.42)]">
      <div className="relative mx-auto flex max-w-4xl items-center justify-center gap-3 px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(activeStep - 1)}
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-0 mx-1">
          {STEP_LABELS.map((label, idx) => {
            const step = idx + 1;
            const isActive = step === activeStep;
            const isCompleted = step < activeStep;

            return (
              <Fragment key={step}>
                {idx > 0 ? (
                  <div
                    className={cn(
                      "mb-5 h-0.5 w-8 rounded-full",
                      step <= activeStep ? "bg-secondary" : "bg-border"
                    )}
                  />
                ) : null}

                <button
                  onClick={() => setActiveStep(step)}
                  className="group flex min-w-[56px] flex-col items-center gap-1"
                  aria-label={`Step ${step}: ${label}`}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 font-heading text-xs font-semibold transition-colors",
                      isActive &&
                        "border-primary bg-primary text-primary-foreground",
                      isCompleted &&
                        "border-secondary bg-secondary text-secondary-foreground",
                      !isActive &&
                        !isCompleted &&
                        "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[0.6rem] font-medium leading-tight sm:block",
                      isActive && "text-primary",
                      isCompleted && "text-secondary",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>

        <Button
          variant="default"
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
