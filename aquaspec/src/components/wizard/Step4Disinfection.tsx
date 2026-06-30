"use client";

import { useEffect } from "react";
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

const PATHOGENS = [
  { value: "vibrio", label: "Vibrio" },
  { value: "wssv", label: "WSSV" },
  { value: "general_disinfection", label: "General Disinfection" },
];

const SPECIES_LIST = [
  { value: "vannamei", label: "Vannamei" },
  { value: "monodon", label: "Monodon" },
  { value: "indicus", label: "Indicus" },
  { value: "other", label: "Other" },
];

const SYSTEM_TYPES = [
  { value: "larval_rearing", label: "Larval Rearing" },
  { value: "broodstock", label: "Broodstock" },
  { value: "algae_culture", label: "Algae Culture" },
  { value: "nauplii", label: "Nauplii" },
  { value: "general", label: "General" },
];

export function Step4Disinfection() {
  const systems = useStore((s) => s.systems);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const biomassDefaults = useStore((s) => s.biomassDefaults);
  const updateField = useStore((s) => s.updateField);
  const fetchBiomassDefault = useStore((s) => s.fetchBiomassDefault);

  return (
    <SystemTabs>
      {(systemIndex) => {
        const sys = systems[systemIndex];
        const prefix = `systems.${systemIndex}`;
        const defaultKey = `${sys.species}|${sys.systemType}`;
        const biomassDefault = biomassDefaults[defaultKey];

        // Fetch default when species or systemType changes
        useEffect(() => {
          if (sys.species && sys.systemType) {
            fetchBiomassDefault(sys.species, sys.systemType);
          }
        }, [sys.species, sys.systemType, fetchBiomassDefault]);

        return (
          <div className="space-y-4">
            {/* Target Pathogen */}
            <div className="space-y-2">
              <Label>Target Pathogen *</Label>
              <Select
                value={sys.targetPathogen || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.targetPathogen`, v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pathogen" />
                </SelectTrigger>
                <SelectContent>
                  {PATHOGENS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors[`${prefix}.targetPathogen`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.targetPathogen`]}
                </p>
              )}
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label>Species *</Label>
              <Select
                value={sys.species || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.species`, v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES_LIST.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors[`${prefix}.species`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.species`]}
                </p>
              )}
            </div>

            {/* System Type */}
            <div className="space-y-2">
              <Label>System Type *</Label>
              <Select
                value={sys.systemType || undefined}
                onValueChange={(v) => {
                  if (v) updateField(`${prefix}.systemType`, v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system type" />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_TYPES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors[`${prefix}.systemType`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.systemType`]}
                </p>
              )}
            </div>

            {/* Biomass DO Demand */}
            <div className="space-y-2">
              <Label htmlFor={`biomass-${systemIndex}`}>
                Biomass DO Demand (m³/hr)
              </Label>
              <Input
                id={`biomass-${systemIndex}`}
                type="number"
                min={0}
                step="0.01"
                placeholder={
                  biomassDefault !== undefined
                    ? `Default from rules (${biomassDefault.toFixed(2)} m³/hr)`
                    : "Optional — rules default will be used"
                }
                value={sys.biomassDODemandM3Hr}
                onChange={(e) =>
                  updateField(
                    `${prefix}.biomassDODemandM3Hr`,
                    e.target.value
                  )
                }
              />
              {fieldErrors[`${prefix}.biomassDODemandM3Hr`] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[`${prefix}.biomassDODemandM3Hr`]}
                </p>
              )}
            </div>
          </div>
        );
      }}
    </SystemTabs>
  );
}
