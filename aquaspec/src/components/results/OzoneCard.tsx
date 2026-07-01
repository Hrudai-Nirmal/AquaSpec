"use client";

import type { OzoneDemandResult } from "@/lib/sizing-engine/types";

interface Props {
  result: OzoneDemandResult;
  generatorModel: string;
}

/** Pairs the ozone demand with the selected generator model tag. */
export function OzoneCard({ result, generatorModel }: Props) {
  return (
    <div className="result-card space-y-2">
      <div className="result-card-label">Ozone Generator</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="model-tag bg-cyan-50 text-cyan-700 border-cyan-100">
          {generatorModel}
        </span>
        <span className="result-card-value text-base">
          {result.ozoneDemandGHr.toFixed(2)}
          <span className="result-card-unit ml-1">g/hr</span>
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
