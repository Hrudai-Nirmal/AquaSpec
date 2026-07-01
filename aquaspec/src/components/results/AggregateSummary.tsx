"use client";

import type { HatcheryRecommendation } from "@/lib/sizing-engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  summary: NonNullable<HatcheryRecommendation["aggregateSummary"]>;
}

/** Rolls multi-system output into a concise commercial summary block. */
export function AggregateSummary({ summary }: Props) {
  const uvList = summary.allUVUnits
    .map((u) => `${u.model}${u.quantity > 1 ? ` ×${u.quantity}` : ""}`)
    .join(", ");

  return (
    <Card
      size="sm"
      className="border border-border bg-[color-mix(in_oklch,var(--teal-50),white_62%)] shadow-sm"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Aggregate Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <span className="result-card-label">Total Flow Rate</span>
          <span className="font-heading text-lg font-semibold text-foreground">
            {summary.totalFlowRateM3Hr.toFixed(2)} m³/hr
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="result-card-label">Total Ozone Demand</span>
          <span className="font-heading text-lg font-semibold text-foreground">
            {summary.totalOzoneDemandGHr.toFixed(2)} g/hr
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="result-card-label">Total Oxygen Demand</span>
          <span className="font-heading text-lg font-semibold text-foreground">
            {summary.totalOxygenDemandM3Hr.toFixed(3)} m³/hr
          </span>
        </div>
        <div className="space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">Ozone Generators:</strong>{" "}
            {summary.allOzoneGenerators.join(", ")}
          </p>
          <p>
            <strong className="text-foreground">UV Units:</strong> {uvList}
          </p>
          <p>
            <strong className="text-foreground">Oxygen Packages:</strong>{" "}
            {summary.allOxygenPackages.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
