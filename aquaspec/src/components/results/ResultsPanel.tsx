"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, AlertTriangleIcon, CircleIcon } from "lucide-react";
import { FlowRateCard } from "./FlowRateCard";
import { OzoneCard } from "./OzoneCard";
import { UVCard } from "./UVCard";
import { OxygenCard } from "./OxygenCard";
import { AggregateSummary } from "./AggregateSummary";

export function ResultsPanel() {
  const recommendation = useStore((s) => s.recommendation);
  const isComputing = useStore((s) => s.isComputing);
  const computeError = useStore((s) => s.computeError);
  const isValid = useStore((s) => s.isValid);
  const mode = useStore((s) => s.mode);
  const fieldErrors = useStore((s) => s.fieldErrors);

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
      <h2 className="text-lg font-semibold flex items-center gap-2">
        Results
        {hasAggregate && (
          <span className="text-xs text-muted-foreground font-normal">
            ({recommendation.systems.length} systems)
          </span>
        )}
      </h2>

      {/* Per-system cards */}
      {recommendation.systems.map((sysRec, i) => (
        <Card key={i} size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
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
