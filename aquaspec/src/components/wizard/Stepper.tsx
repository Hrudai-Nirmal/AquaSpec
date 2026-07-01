"use client";

/**
 * Local wizard stepper adapted from the ReactBits interaction model without adding a motion dependency.
 */

import {
  Children,
  type HTMLAttributes,
  type ReactNode,
  isValidElement,
  useMemo,
  useState,
} from "react";
import { AlertCircleIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StepFeedbackStatus = "success" | "error";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  currentStep?: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  stepLabels?: string[];
  canAdvanceFromStep?: (step: number) => boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    label?: string;
    status: "active" | "inactive" | "complete" | "error";
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

interface StepProps {
  children: ReactNode;
}

/**
 * Marks one wizard panel within the shared stepper shell.
 */
export function Step({ children }: StepProps) {
  return <div className="space-y-5">{children}</div>;
}

/**
 * Renders a combined form-stepper shell with guarded forward navigation.
 */
export default function Stepper({
  children,
  currentStep,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  stepCircleContainerClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps,
  nextButtonProps,
  backButtonText = "Previous",
  nextButtonText = "Next",
  disableStepIndicators = false,
  stepLabels = [],
  canAdvanceFromStep,
  renderStepIndicator,
  className,
  ...rest
}: StepperProps) {
  const stepPanels = useMemo(
    () => Children.toArray(children).filter(isValidElement),
    [children]
  );
  const [internalStep, setInternalStep] = useState(initialStep);
  const [stepFeedback, setStepFeedback] = useState<
    Partial<Record<number, StepFeedbackStatus>>
  >({});
  const [animatedStep, setAnimatedStep] = useState<number | null>(null);
  const totalSteps = stepPanels.length;
  const resolvedCurrentStep = currentStep ?? internalStep;
  const isLastStep = resolvedCurrentStep === totalSteps;
  const currentPanel = stepPanels[Math.max(0, resolvedCurrentStep - 1)];
  const shouldShowCompleteAction = Boolean(onFinalStepCompleted);

  function setStep(step: number) {
    if (currentStep === undefined) {
      setInternalStep(step);
    }
    onStepChange?.(step);
  }

  function triggerStepFeedback(step: number, status: StepFeedbackStatus) {
    setStepFeedback((current) => ({ ...current, [step]: status }));
    setAnimatedStep(step);

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setAnimatedStep((active) => (active === step ? null : active));
      }, 520);
    }
  }

  function updateIntermediateStepStatuses(targetStep: number) {
    if (!canAdvanceFromStep || targetStep <= resolvedCurrentStep) return;

    for (let step = resolvedCurrentStep; step < targetStep; step += 1) {
      const isStepValid = canAdvanceFromStep(step);
      triggerStepFeedback(step, isStepValid ? "success" : "error");
    }
  }

  function handleStepChange(targetStep: number) {
    if (targetStep < 1 || targetStep > totalSteps) {
      return;
    }

    updateIntermediateStepStatuses(targetStep);
    setStep(targetStep);
  }

  function handleComplete() {
    if (canAdvanceFromStep && !canAdvanceFromStep(resolvedCurrentStep)) {
      triggerStepFeedback(resolvedCurrentStep, "error");
    } else {
      triggerStepFeedback(resolvedCurrentStep, "success");
    }
    onFinalStepCompleted?.();
  }

  return (
    <div
      data-slot="wizard-stepper"
      className={cn("space-y-6", className)}
      {...rest}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[30px] border border-border/85 bg-white shadow-[0_28px_80px_-52px_rgba(15,23,42,0.36)]",
          stepCircleContainerClassName
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center gap-0 border-b border-border/65 px-5 py-6 md:px-8",
            stepContainerClassName
          )}
        >
          {stepPanels.map((_, index) => {
            const step = index + 1;
            const label = stepLabels[index];
            const isComplete =
              stepFeedback[step] === "success" || step < resolvedCurrentStep;
            const isError = stepFeedback[step] === "error";
            const isActive = step === resolvedCurrentStep;
            const status = isError
              ? "error"
              : isComplete
                ? "complete"
                : isActive
                  ? "active"
                  : "inactive";

            return (
              <div key={step} className="flex flex-1 items-center">
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step,
                    currentStep: resolvedCurrentStep,
                    label,
                    status,
                    onStepClick: handleStepChange,
                  })
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!disableStepIndicators) {
                        handleStepChange(step);
                      }
                    }}
                    className={cn(
                      "group flex min-w-0 flex-col items-center gap-2",
                      disableStepIndicators
                        ? "pointer-events-none opacity-70"
                        : "cursor-pointer"
                    )}
                  >
                    <span
                      data-step-status={status}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border text-sm font-sans font-bold transition-all duration-300",
                        status === "active" &&
                          "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_-18px_rgba(8,184,199,0.7)]",
                        status === "complete" &&
                          "border-emerald-500 bg-emerald-500 text-white shadow-[0_12px_28px_-18px_rgba(34,197,94,0.55)]",
                        status === "error" &&
                          "border-red-500 bg-red-500 text-white shadow-[0_12px_28px_-18px_rgba(239,68,68,0.55)]",
                        status === "inactive" &&
                          "border-border bg-white text-muted-foreground",
                        animatedStep === step && "animate-step-feedback"
                      )}
                    >
                      {status === "complete" ? (
                        <CheckIcon className="size-4" aria-hidden="true" />
                      ) : status === "error" ? (
                        <AlertCircleIcon className="size-4" aria-hidden="true" />
                      ) : (
                        step
                      )}
                    </span>
                    {label ? (
                      <span
                        className={cn(
                          "text-center text-[0.68rem] font-medium leading-tight",
                          status === "active" && "text-primary",
                          status === "complete" && "text-emerald-600",
                          status === "error" && "text-red-500",
                          status === "inactive" && "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    ) : null}
                  </button>
                )}

                {step < totalSteps ? (
                  <div className="mx-3 h-[2px] flex-1 rounded-full bg-border/80">
                    <div
                      className={cn(
                        "h-full rounded-full transition-colors",
                        step < resolvedCurrentStep || stepFeedback[step] === "success"
                          ? "bg-secondary/70"
                          : "bg-transparent"
                      )}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          className={cn(
            "animate-step-content px-5 py-7 md:px-8 md:py-8",
            contentClassName
          )}
        >
          {currentPanel}
        </div>

        <div
          className={cn(
            "border-t border-border/65 px-5 py-5 md:px-8",
            footerClassName
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepChange(resolvedCurrentStep - 1)}
              disabled={resolvedCurrentStep === 1}
              className="min-w-28 rounded-full border-border/80 bg-white/90"
              {...backButtonProps}
            >
              {backButtonText}
            </Button>

            {isLastStep && !shouldShowCompleteAction ? (
              <div className="min-w-28" />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  isLastStep
                    ? handleComplete()
                    : handleStepChange(resolvedCurrentStep + 1)
                }
                className="min-w-28 rounded-full"
                {...nextButtonProps}
              >
                {isLastStep ? "Complete" : nextButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
