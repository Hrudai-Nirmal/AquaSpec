"use client";

import type { OxygenDemandResult } from "@/lib/sizing-engine/types";

interface Props {
  result: OxygenDemandResult;
}

export function OxygenCard({ result }: Props) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Oxygen
        </span>
        <span className="text-sm font-bold">
          {result.totalOxygenDemandM3Hr.toFixed(3)} m³/hr →{" "}
          {result.selectedModel}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Ozone feed: {result.ozoneFeedRequirementM3Hr.toFixed(3)} m³/hr
        {" + "}
        Biomass DO: {result.biomassDODemandM3Hr.toFixed(3)} m³/hr
      </p>
    </div>
  );
}
