"use client";

/**
 * Step two captures the incoming water conditions for each configured system.
 */

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldHint } from "./FieldHint";
import { SystemTabs } from "./SystemTabs";

const WATER_SOURCES = [
  { value: "seawater", label: "Seawater" },
  { value: "freshwater", label: "Freshwater" },
  { value: "borewell", label: "Borewell" },
  { value: "estuary", label: "Estuary" },
];

const QUALITY_BANDS = [
  { value: "good", label: "Good" },
  { value: "moderate", label: "Moderate" },
  { value: "poor", label: "Poor" },
];

export function Step2WaterProfile() {
  const systems = useStore((s) => s.systems);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const updateField = useStore((s) => s.updateField);

  return (
    <SystemTabs>
      {(systemIndex) => {
        const sys = systems[systemIndex];
        const prefix = `systems.${systemIndex}`;

        return (
          <div className="space-y-6">
            {/* Water Source */}
            <div className="space-y-3">
              <FieldHint hint="Choose the intake source because source water changes the treatment assumptions.">
                Water Source *
              </FieldHint>
              <Select
                value={sys.waterSource || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.waterSource`, v);
                }}
              >
                <SelectTrigger
                  aria-invalid={Boolean(fieldErrors[`${prefix}.waterSource`])}
                  className="bg-white/92"
                >
                  <SelectValue placeholder="Select water source" />
                </SelectTrigger>
                <SelectContent>
                  {WATER_SOURCES.map((ws) => (
                    <SelectItem key={ws.value} value={ws.value}>
                      {ws.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quality Band */}
            <div className="space-y-3">
              <FieldHint hint="Quality band tells the sizing rules how clean or fouled the incoming water typically is.">
                Quality Band *
              </FieldHint>
              <Select
                value={sys.qualityBand || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.qualityBand`, v);
                }}
              >
                <SelectTrigger
                  aria-invalid={Boolean(fieldErrors[`${prefix}.qualityBand`])}
                  className="bg-white/92"
                >
                  <SelectValue placeholder="Select quality band" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_BANDS.map((qb) => (
                    <SelectItem key={qb.value} value={qb.value}>
                      {qb.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salinity */}
            <div className="space-y-3">
              <FieldHint
                htmlFor={`salinity-${systemIndex}`}
                hint="Enter the operating salinity in parts per thousand to tune the treatment dose assumptions."
              >
                Salinity (ppt) *
              </FieldHint>
              <Input
                id={`salinity-${systemIndex}`}
                type="number"
                min={0}
                max={50}
                step="0.1"
                placeholder="0–50"
                value={sys.salinityPpt}
                onChange={(e) =>
                  updateField(`${prefix}.salinityPpt`, e.target.value)
                }
                aria-invalid={Boolean(fieldErrors[`${prefix}.salinityPpt`])}
                className="bg-white/92"
              />
            </div>
          </div>
        );
      }}
    </SystemTabs>
  );
}
