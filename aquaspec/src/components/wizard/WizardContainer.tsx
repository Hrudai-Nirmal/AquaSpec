"use client";

/**
 * WizardContainer owns the branded shell, form rail, results rail, and supporting CTA sections.
 */

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  FilePlusIcon,
  MessageCircleIcon,
  PhoneCallIcon,
  SendHorizonalIcon,
} from "lucide-react";
import Stepper, { Step } from "./Stepper";
import { Step1Identity } from "./Step1Identity";
import { Step2WaterProfile } from "./Step2WaterProfile";
import { Step3Hydraulics } from "./Step3Hydraulics";
import { Step4Disinfection } from "./Step4Disinfection";
import { Step5Review } from "./Step5Review";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ProposalPreview } from "@/components/proposal/ProposalPreview";
import { SavedConfigsSidebar } from "@/components/configs/SavedConfigsSidebar";

const STEP_TITLES = [
  "Hatchery Identity",
  "Water Profile",
  "Hydraulic Parameters",
  "Disinfection Target",
  "Review & Generate",
];

function JourneySection() {
  const journeySteps = [
    "Our experts review your requirements",
    "We prepare a customised solution",
    "You receive a detailed quote within 24hrs",
  ];

  return (
    <section className="rounded-[30px] border border-border/80 bg-white p-6 shadow-[0_26px_70px_-46px_rgba(15,23,42,0.28)] md:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <Button size="lg" className="rounded-full px-8">
          <SendHorizonalIcon className="size-4 mr-2" />
          Submit Quote Request
        </Button>
        <p className="mt-5 text-sm text-muted-foreground">
          By submitting this form, you agree to be contacted by our technical
          team regarding your requirements.
        </p>
      </div>

      <div className="mt-7 rounded-[24px] border border-primary/10 bg-primary/6 px-6 py-7">
        <h3 className="text-center font-sans text-2xl font-semibold text-foreground">
          What happens next?
        </h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {journeySteps.map((label, index) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl bg-white/72 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="rounded-[34px] border border-border/75 bg-linear-to-b from-slate-50 to-white px-6 py-10 shadow-[0_26px_70px_-48px_rgba(15,23,42,0.2)] md:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h3 className="font-sans text-4xl font-semibold tracking-tight text-foreground">
          Prefer to Speak Directly?
        </h3>
        <p className="mt-4 text-lg text-muted-foreground">
          Our managing director is available for direct consultation on complex
          projects.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
        <article className="rounded-[28px] border border-border/75 bg-white p-7 text-center shadow-[0_24px_60px_-44px_rgba(15,23,42,0.28)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary">
            <PhoneCallIcon className="size-7" />
          </div>
          <h4 className="mt-5 font-sans text-2xl font-semibold text-foreground">
            Direct Call
          </h4>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-primary">
            +91 97407 47096
          </p>
          <Button
            variant="secondary"
            className="mt-6 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            Call Srinivas Rao Karuturi
          </Button>
        </article>

        <article className="rounded-[28px] border border-border/75 bg-white p-7 text-center shadow-[0_24px_60px_-44px_rgba(15,23,42,0.28)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/18 text-primary">
            <MessageCircleIcon className="size-7" />
          </div>
          <h4 className="mt-5 font-sans text-2xl font-semibold text-foreground">
            WhatsApp
          </h4>
          <p className="mt-3 text-lg text-muted-foreground">
            Quick consultation via chat
          </p>
          <Button
            variant="outline"
            className="mt-6 w-full rounded-full border-border/75 bg-white"
          >
            Chat on WhatsApp
          </Button>
        </article>
      </div>
    </section>
  );
}

/** Renders the branded wizard shell without changing sizing behavior. */
export function WizardContainer() {
  const isHydrated = useStore((s) => s.isHydrated);
  const activeStep = useStore((s) => s.activeStep);
  const clearDraft = useStore((s) => s.clearDraft);
  const recommendation = useStore((s) => s.recommendation);
  const isComputing = useStore((s) => s.isComputing);
  const computeError = useStore((s) => s.computeError);
  const setActiveStep = useStore((s) => s.setActiveStep);
  const validateStep = useStore((s) => s.validateStep);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shouldShowDesktopResults =
    recommendation !== null || isComputing || computeError !== null;
  const formShellClassName = shouldShowDesktopResults
    ? "max-w-[1180px]"
    : "max-w-[720px]";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="h-[3px] shrink-0 bg-linear-to-r from-primary to-secondary" />

      <header className="shrink-0 border-b border-border/90 bg-white/95 px-6 py-5 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.22)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="-ml-2 flex items-center gap-3 lg:-ml-4">
            <Image
              src="/LotusOzoneLogo.png"
              alt="Lotus Ozone"
              width={226}
              height={98}
              className="h-18 w-auto object-contain md:h-20"
              priority
            />
            <div>
              <h1 className="font-heading text-4xl font-semibold leading-none text-foreground">
                AquaSpec
              </h1>
              <p className="mt-2 text-sm tracking-[0.24em] text-muted-foreground uppercase">
                Lotus Ozone Water Treatment Sizing Wizard
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="tel:+919740747096"
                className="inline-flex items-center gap-2 rounded-full border border-border/75 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-[0_10px_30px_-24px_rgba(15,23,42,0.24)] transition-colors hover:bg-primary/6"
              >
                <PhoneCallIcon className="size-4 text-primary" />
                Direct Call
              </a>
              <a
                href="https://wa.me/919740747096"
                className="inline-flex items-center gap-2 rounded-full border border-border/75 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-[0_10px_30px_-24px_rgba(15,23,42,0.24)] transition-colors hover:bg-secondary/12"
              >
                <MessageCircleIcon className="size-4 text-primary" />
                WhatsApp
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0 rounded-full border border-border/75 bg-white text-sm text-foreground hover:bg-secondary/15"
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
                className="shrink-0 rounded-full border border-border/75 bg-white text-sm text-foreground hover:bg-secondary/15"
              >
                <FilePlusIcon className="size-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-16 lg:px-8 lg:pb-24">
        <div className={`mx-auto ${formShellClassName}`}>
          <div className="lg:flex lg:items-start lg:gap-8">
            <div className="min-w-0 flex-1">
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
                <Stepper
                  currentStep={activeStep}
                  initialStep={1}
                  onStepChange={setActiveStep}
                  canAdvanceFromStep={validateStep}
                  backButtonText="Previous"
                  nextButtonText="Next"
                  stepLabels={["Identity", "Water", "Hydraulics", "Disinfect", "Review"]}
                  stepCircleContainerClassName="card-accent"
                >
                  <Step>
                    <div className="space-y-6">
                      <h2 className="font-heading text-[2rem] font-semibold text-foreground">
                        {STEP_TITLES[0]}
                      </h2>
                      <Step1Identity />
                    </div>
                  </Step>
                  <Step>
                    <div className="space-y-6">
                      <h2 className="font-heading text-[2rem] font-semibold text-foreground">
                        {STEP_TITLES[1]}
                      </h2>
                      <Step2WaterProfile />
                    </div>
                  </Step>
                  <Step>
                    <div className="space-y-6">
                      <h2 className="font-heading text-[2rem] font-semibold text-foreground">
                        {STEP_TITLES[2]}
                      </h2>
                      <Step3Hydraulics />
                    </div>
                  </Step>
                  <Step>
                    <div className="space-y-6">
                      <h2 className="font-heading text-[2rem] font-semibold text-foreground">
                        {STEP_TITLES[3]}
                      </h2>
                      <Step4Disinfection />
                    </div>
                  </Step>
                  <Step>
                    <div className="space-y-6">
                      <h2 className="font-heading text-[2rem] font-semibold text-foreground">
                        {STEP_TITLES[4]}
                      </h2>
                      <Step5Review />
                    </div>
                  </Step>
                </Stepper>
              )}
            </div>

            {shouldShowDesktopResults ? (
              <div className="hidden animate-slide-in-right lg:flex lg:w-[420px] lg:shrink-0 lg:self-start">
                <div className="w-full rounded-[30px] border border-border/80 bg-white/96 p-6 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.3)]">
                  <ResultsPanel />
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile/Tablet: results below form */}
          <div className="mt-8 lg:hidden">
            <ResultsPanel />
          </div>

          <div className="mx-auto mt-16 max-w-5xl space-y-8 md:mt-20">
            <JourneySection />
            <ContactSection />
          </div>
        </div>
      </div>

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
