"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2Icon, AlertTriangleIcon, CircleIcon, RefreshCwIcon } from "lucide-react";
import { FlowRateCard } from "./FlowRateCard";
import { OzoneCard } from "./OzoneCard";
import { UVCard } from "./UVCard";
import { OxygenCard } from "./OxygenCard";
import { AggregateSummary } from "./AggregateSummary";

function VersionMismatchBanner() {
  const triggerCompute = useStore((s) => s.triggerCompute);
  const isComputing = useStore((s) => s.isComputing);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <AlertTriangleIcon className="size-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-amber-800">
          Equipment rules have been updated since this configuration was saved.
          Results may be outdated.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 text-amber-800"
        onClick={() => triggerCompute()}
        disabled={isComputing}
      >
        <RefreshCwIcon className="size-3 mr-1" />
        Recompute
      </Button>
    </div>
  );
}

function StaleEditsBanner() {
  const triggerCompute = useStore((s) => s.triggerCompute);
  const isComputing = useStore((s) => s.isComputing);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <AlertTriangleIcon className="size-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-amber-800">
          Results are based on old inputs. Recompute to refresh.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 text-amber-800"
        onClick={() => triggerCompute()}
        disabled={isComputing}
      >
        <RefreshCwIcon className="size-3 mr-1" />
        Recompute
      </Button>
    </div>
  );
}

/** Presents ready-state sizing outputs in the branded result panel layout. */
export function ResultsPanel() {
  const recommendation = useStore((s) => s.recommendation);
  const isComputing = useStore((s) => s.isComputing);
  const computeError = useStore((s) => s.computeError);
  const isValid = useStore((s) => s.isValid);
  const mode = useStore((s) => s.mode);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const showVersionMismatchBanner = useStore((s) => s.showVersionMismatchBanner);
  const showStaleEditsBanner = useStore((s) => s.showStaleEditsBanner);

  const hasAnyFieldError = Object.keys(fieldErrors).length > 0;
  const isIncomplete = !isValid || hasAnyFieldError;

  // State 1: Incomplete
  if (isIncomplete) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CircleIcon className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Complete all fields to see recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 2: Computing
  if (isComputing) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2Icon className="size-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Calculating...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 3: Error
  if (computeError) {
    return (
      <div className="w-full">
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangleIcon className="size-10 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">
              Computation Error
            </p>
            <p className="text-xs text-muted-foreground mt-1">{computeError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 4: Ready
  if (!recommendation) return null;

  const hasAggregate =
    mode === "multi_system" && recommendation.aggregateSummary;

  return (
    <div className="w-full space-y-4">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
        Results
        {hasAggregate && (
          <span className="text-xs text-muted-foreground font-normal">
            ({recommendation.systems.length} systems)
          </span>
        )}
      </h2>

      {/* Banners */}
      {showVersionMismatchBanner && <VersionMismatchBanner />}
      {showStaleEditsBanner && <StaleEditsBanner />}

      {/* Per-system cards */}
      {recommendation.systems.map((sysRec, i) => (
        <Card key={i} size="sm" className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              {sysRec.systemName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FlowRateCard result={sysRec.flowRate} />
            <OzoneCard
              result={sysRec.ozoneDemand}
              generatorModel={sysRec.ozoneGeneratorModel}
            />
            <UVCard result={sysRec.uvSizing} />
            <OxygenCard result={sysRec.oxygenDemand} />
          </CardContent>
        </Card>
      ))}

      {/* Aggregate summary for multi-system */}
      {hasAggregate && (
        <AggregateSummary summary={recommendation.aggregateSummary!} />
      )}
    </div>
  );
}
