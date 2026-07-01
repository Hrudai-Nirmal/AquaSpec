"use client";

import type { FlowRateResult } from "@/lib/sizing-engine/types";

interface Props {
  result: FlowRateResult;
}

/** Highlights the computed system flow as the first result card. */
export function FlowRateCard({ result }: Props) {
  return (
    <div className="result-card space-y-2">
      <div className="result-card-label">Flow Rate</div>
      <div className="result-card-value">
        {result.flowRateM3Hr.toFixed(2)}
        <span className="result-card-unit ml-1">m³/hr</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {result.inputs.totalVolumeM3} m³ × {result.inputs.turnoversPerDay}{" "}
        turnovers ÷ {result.inputs.operatingHoursPerDay}h
      </p>
    </div>
  );
}
