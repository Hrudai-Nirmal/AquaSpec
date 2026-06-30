"use client";

import type { UVSizingResult } from "@/lib/sizing-engine/types";

interface Props {
  result: UVSizingResult;
}

export function UVCard({ result }: Props) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          UV
        </span>
        <span className="text-sm font-bold">
          {result.selectedModel}
          {result.parallelUnits > 1 && <> × {result.parallelUnits}</>}
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
