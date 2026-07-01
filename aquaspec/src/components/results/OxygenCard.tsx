"use client";

import type { OxygenDemandResult } from "@/lib/sizing-engine/types";

interface Props {
  result: OxygenDemandResult;
}

/** Shows the oxygen package alongside the total demand it must satisfy. */
export function OxygenCard({ result }: Props) {
  return (
    <div className="result-card space-y-2">
      <div className="result-card-label">Oxygen Package</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="model-tag bg-cyan-50 text-cyan-700 border-cyan-100">
          {result.selectedModel}
        </span>
        <span className="result-card-value text-base">
          {result.totalOxygenDemandM3Hr.toFixed(3)}
          <span className="result-card-unit ml-1">m³/hr total</span>
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
