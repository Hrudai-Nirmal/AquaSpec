"use client";

/**
 * Footer stepper keeps navigation close to the wizard while surfacing section status.
 */

import { Fragment, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isStepValid } from "@/lib/wizard-validation";

const STEP_LABELS = ["Identity", "Water", "Hydraulics", "Disinfect", "Review"];

/** Keeps the wizard navigation readable while reflecting the branded states. */
export function StepIndicator() {
  const {
    activeStep,
    hatcheryName,
    fullName,
    emailAddress,
    phoneCountryCode,
    phoneNumber,
    location,
    mode,
    systems,
    setActiveStep,
    validateStep,
  } = useStore((state) => ({
    activeStep: state.activeStep,
    hatcheryName: state.hatcheryName,
    fullName: state.fullName,
    emailAddress: state.emailAddress,
    phoneCountryCode: state.phoneCountryCode,
    phoneNumber: state.phoneNumber,
    location: state.location,
    mode: state.mode,
    systems: state.systems,
    setActiveStep: state.setActiveStep,
    validateStep: state.validateStep,
  }));
  const [stepFeedback, setStepFeedback] = useState<
    Partial<Record<number, "success" | "error">>
  >({});
  const [animatedStep, setAnimatedStep] = useState<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  const validationState = {
    hatcheryName,
    fullName,
    emailAddress,
    phoneCountryCode,
    phoneNumber,
    location,
    mode,
    systems,
  };

  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  function animateStep(step: number, status: "success" | "error") {
    setStepFeedback((current) => ({ ...current, [step]: status }));
    setAnimatedStep(step);

    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
    }

    animationTimerRef.current = window.setTimeout(() => {
      setAnimatedStep(null);
    }, 520);
  }

  function handleStepAdvance(targetStep: number) {
    if (targetStep <= activeStep) {
      setActiveStep(targetStep);
      return;
    }

    const isCurrentStepValid = validateStep(activeStep);
    if (!isCurrentStepValid) {
      animateStep(activeStep, "error");
      return;
    }

    animateStep(activeStep, "success");
    setActiveStep(targetStep);
  }

  return (
    <div className="footer-frost sticky bottom-0 z-40 border-t border-border/90 bg-white/92 shadow-[0_-24px_60px_-38px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 py-4">
        <Button
          variant="outline"
          size="sm"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(activeStep - 1)}
          className="min-w-28 border-border/80 bg-white/90"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Previous
        </Button>

        <div className="mx-1 flex items-center gap-0">
          {STEP_LABELS.map((label, idx) => {
            const step = idx + 1;
            const isCompleted = step < activeStep && isStepValid(validationState, step);
            const isActive = step === activeStep;
            const feedbackStatus = stepFeedback[step];
            const status =
              feedbackStatus === "error"
                ? "error"
                : feedbackStatus === "success" || isCompleted
                  ? "success"
                  : isActive
                    ? "active"
                    : "pending";
            const isAnimated = animatedStep === step;

            return (
              <Fragment key={step}>
                {idx > 0 ? (
                  <div
                    className={cn(
                      "mb-6 h-[2px] w-10 rounded-full transition-colors",
                      step <= activeStep ? "bg-secondary/65" : "bg-border/90"
                    )}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => handleStepAdvance(step)}
                  className="group flex min-w-[70px] flex-col items-center gap-2"
                  aria-label={`Step ${step}: ${label}`}
                >
                  <span
                    data-step-status={status}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border text-sm font-sans font-bold transition-all duration-300",
                      status === "active" &&
                        "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_-18px_rgba(0,121,121,0.75)]",
                      status === "success" &&
                        "border-emerald-500 bg-emerald-500 text-white shadow-[0_12px_28px_-18px_rgba(34,197,94,0.55)]",
                      status === "error" &&
                        "border-red-500 bg-red-500 text-white shadow-[0_12px_28px_-18px_rgba(239,68,68,0.55)]",
                      status === "pending" &&
                        "border-border bg-white text-muted-foreground",
                      isAnimated && "animate-step-feedback"
                    )}
                  >
                    {status === "success" ? (
                      <CheckIcon className="size-4" aria-hidden="true" />
                    ) : status === "error" ? (
                      <AlertCircleIcon className="size-4" aria-hidden="true" />
                    ) : (
                      step
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[0.68rem] font-medium leading-tight sm:block",
                      status === "active" && "text-primary",
                      status === "success" && "text-emerald-600",
                      status === "error" && "text-red-500",
                      status === "pending" && "text-muted-foreground"
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
          onClick={() => handleStepAdvance(activeStep + 1)}
          className="min-w-28"
        >
          Next
          <ChevronRightIcon className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
