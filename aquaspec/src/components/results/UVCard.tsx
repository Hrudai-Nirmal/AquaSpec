"use client";

import type { UVSizingResult } from "@/lib/sizing-engine/types";

interface Props {
  result: UVSizingResult;
}

/** Shows the selected UV package in the same tagged card language as the prototype. */
export function UVCard({ result }: Props) {
  return (
    <div className="result-card space-y-2">
      <div className="result-card-label">UV System</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="model-tag bg-cyan-50 text-cyan-700 border-cyan-100">
          {result.selectedModel}
        </span>
        <span className="result-card-value text-base">
          {result.parallelUnits > 1
            ? `× ${result.parallelUnits} units`
            : "1 unit"}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Required flow: {result.requiredFlowM3Hr.toFixed(2)} m³/hr
        {result.parallelUnits > 1 && (
          <> · Rated: {result.ratedFlowPerUnitM3Hr} m³/hr per unit</>
        )}
      </p>
    </div>
  );
}
