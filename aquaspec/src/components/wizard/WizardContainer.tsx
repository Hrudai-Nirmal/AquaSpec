"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlusIcon, BookmarkIcon } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { Step1Identity } from "./Step1Identity";
import { Step2WaterProfile } from "./Step2WaterProfile";
import { Step3Hydraulics } from "./Step3Hydraulics";
import { Step4Disinfection } from "./Step4Disinfection";
import { Step5Review } from "./Step5Review";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ProposalPreview } from "@/components/proposal/ProposalPreview";
import { SavedConfigsSidebar } from "@/components/configs/SavedConfigsSidebar";

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

/** Renders the branded wizard shell without changing sizing behavior. */
export function WizardContainer() {
  const isHydrated = useStore((s) => s.isHydrated);
  const clearDraft = useStore((s) => s.clearDraft);
  const recommendation = useStore((s) => s.recommendation);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shouldShowDesktopResults = recommendation !== null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="h-[3px] shrink-0 bg-linear-to-r from-primary to-secondary" />

      <header className="shrink-0 border-b bg-card px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-secondary font-heading text-sm font-bold text-primary-foreground shadow-sm">
              L
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground">
                AquaSpec
              </h1>
              <p className="text-xs text-muted-foreground">
                Lotus Ozone Water Treatment Sizing Wizard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0 text-sm text-slate-700"
            >
              <BookmarkIcon className="size-4 mr-1" />
              Saved
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await clearDraft();
              }}
              className="shrink-0 text-sm text-slate-700"
            >
              <FilePlusIcon className="size-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row min-h-0">
        {/* Form panel (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="max-w-[600px] mx-auto">
            {/* Hydration guard: don't render form until state is loaded */}
            {!isHydrated ? (
              <Card className="card-accent">
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                  <StepTitle />
                </h2>

                <Card className="card-accent">
                  <CardContent className="pt-6">
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
        {shouldShowDesktopResults ? (
          <div className="hidden animate-slide-in-right border-l bg-card p-5 lg:flex lg:w-[420px] lg:overflow-y-auto">
            <ResultsPanel />
          </div>
        ) : null}
      </div>

      {/* Bottom navigation */}
      <StepIndicator />

      {/* Proposal preview modal */}
      <ProposalPreview />

      {/* Saved Configs Sidebar */}
      <SavedConfigsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
