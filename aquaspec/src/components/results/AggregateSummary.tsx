"use client";

import type { HatcheryRecommendation } from "@/lib/sizing-engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  summary: NonNullable<HatcheryRecommendation["aggregateSummary"]>;
}

export function AggregateSummary({ summary }: Props) {
  const uvList = summary.allUVUnits
    .map((u) => `${u.model}${u.quantity > 1 ? ` ×${u.quantity}` : ""}`)
    .join(", ");

  return (
    <Card size="sm" className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Aggregate Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Flow Rate</span>
          <span className="font-semibold">
            {summary.totalFlowRateM3Hr.toFixed(2)} m³/hr
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Ozone Demand</span>
          <span className="font-semibold">
            {summary.totalOzoneDemandGHr.toFixed(2)} g/hr
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Oxygen Demand</span>
          <span className="font-semibold">
            {summary.totalOxygenDemandM3Hr.toFixed(3)} m³/hr
          </span>
        </div>
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Ozone Generators:</strong>{" "}
            {summary.allOzoneGenerators.join(", ")}
          </p>
          <p>
            <strong>UV Units:</strong> {uvList}
          </p>
          <p>
            <strong>Oxygen Packages:</strong>{" "}
            {summary.allOxygenPackages.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
