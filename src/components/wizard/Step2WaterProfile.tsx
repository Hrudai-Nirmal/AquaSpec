"use client";

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <div className="space-y-4">
            {/* Water Source */}
            <div className="space-y-2">
              <Label>Water Source *</Label>
              <Select
                value={sys.waterSource || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.waterSource`, v);
                }}
              >
                <SelectTrigger>
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
              {fieldErrors[`${prefix}.waterSource`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.waterSource`]}
                </p>
              )}
            </div>

            {/* Quality Band */}
            <div className="space-y-2">
              <Label>Quality Band *</Label>
              <Select
                value={sys.qualityBand || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.qualityBand`, v);
                }}
              >
                <SelectTrigger>
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
              {fieldErrors[`${prefix}.qualityBand`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.qualityBand`]}
                </p>
              )}
            </div>

            {/* Salinity */}
            <div className="space-y-2">
              <Label htmlFor={`salinity-${systemIndex}`}>
                Salinity (ppt) *
              </Label>
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
              />
              {fieldErrors[`${prefix}.salinityPpt`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.salinityPpt`]}
                </p>
              )}
            </div>
          </div>
        );
      }}
    </SystemTabs>
  );
}
