"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlusIcon } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { Step1Identity } from "./Step1Identity";
import { Step2WaterProfile } from "./Step2WaterProfile";
import { Step3Hydraulics } from "./Step3Hydraulics";
import { Step4Disinfection } from "./Step4Disinfection";
import { Step5Review } from "./Step5Review";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ProposalPreview } from "@/components/proposal/ProposalPreview";

function StepContent() {
  const activeStep = useStore((s) => s.activeStep);

  switch (activeStep) {
    case 1:
      return <Step1Identity />;
    case 2:
      return <Step2WaterProfile />;
    case 3:
      return <Step3Hydraulics />;
    case 4:
      return <Step4Disinfection />;
    case 5:
      return <Step5Review />;
    default:
      return null;
  }
}

function StepTitle() {
  const activeStep = useStore((s) => s.activeStep);
  const titles: Record<number, string> = {
    1: "Hatchery Identity",
    2: "Water Profile",
    3: "Hydraulic Parameters",
    4: "Disinfection Target",
    5: "Review & Generate",
  };
  return <>{titles[activeStep] || ""}</>;
}

export function WizardContainer() {
  const isHydrated = useStore((s) => s.isHydrated);
  const clearDraft = useStore((s) => s.clearDraft);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Form panel (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header with title + New Configuration button */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  AquaSpec
                </h1>
                <p className="text-sm text-muted-foreground">
                  Lotus Ozone Water Treatment Sizing Wizard
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await clearDraft();
                }}
                className="mt-1 shrink-0"
              >
                <FilePlusIcon className="size-4 mr-1" />
                New
              </Button>
            </div>

            {/* Hydration guard: don't render form until state is loaded */}
            {!isHydrated ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-6" />

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <StepTitle />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StepContent />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Mobile/Tablet: results below form */}
          <div className="lg:hidden mt-6">
            <ResultsPanel />
          </div>
        </div>

        {/* Desktop: results panel side-by-side */}
        <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] border-l overflow-y-auto p-4 lg:p-6">
          <ResultsPanel />
        </div>
      </div>

      {/* Bottom navigation */}
      <StepIndicator />

      {/* Proposal preview modal */}
      <ProposalPreview />
    </div>
  );
}
