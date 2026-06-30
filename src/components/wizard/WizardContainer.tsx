"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Form panel (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              AquaSpec
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Lotus Ozone Water Treatment Sizing Wizard
            </p>

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
