"use client";

import type { OzoneDemandResult } from "@/lib/sizing-engine/types";

interface Props {
  result: OzoneDemandResult;
  generatorModel: string;
}

export function OzoneCard({ result, generatorModel }: Props) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Ozone
        </span>
        <span className="text-sm font-bold">
          {result.ozoneDemandGHr.toFixed(2)} g/hr → {generatorModel}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Dose: {result.doseRateGM3} g/m³
        {result.conditionMultiplier !== 1 && (
          <> × {result.conditionMultiplier} (condition multiplier)</>
        )}
        {" · "}
        Flow: {result.flowRateM3Hr.toFixed(2)} m³/hr
      </p>
    </div>
  );
}
