"use client";

import type { FlowRateResult } from "@/lib/sizing-engine/types";

interface Props {
  result: FlowRateResult;
}

export function FlowRateCard({ result }: Props) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Flow Rate
        </span>
        <span className="text-sm font-bold">
          {result.flowRateM3Hr.toFixed(2)} m³/hr
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {result.inputs.totalVolumeM3} m³ × {result.inputs.turnoversPerDay}{" "}
        turnovers ÷ {result.inputs.operatingHoursPerDay}h
      </p>
    </div>
  );
}
