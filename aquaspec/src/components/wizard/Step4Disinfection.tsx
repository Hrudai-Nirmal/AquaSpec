"use client";

/**
 * Step four captures biological and treatment targets for the final sizing pass.
 */

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

interface DisinfectionFieldsProps {
  systemIndex: number;
}

function DisinfectionFields({ systemIndex }: DisinfectionFieldsProps) {
  const systems = useStore((s) => s.systems);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const biomassDefaults = useStore((s) => s.biomassDefaults);
  const updateField = useStore((s) => s.updateField);
  const fetchBiomassDefault = useStore((s) => s.fetchBiomassDefault);
  const sys = systems[systemIndex];
  const prefix = `systems.${systemIndex}`;
  const defaultKey = `${sys.species}|${sys.systemType}`;
  const biomassDefault = biomassDefaults[defaultKey];

  useEffect(() => {
    if (sys.species && sys.systemType) {
      void fetchBiomassDefault(sys.species, sys.systemType);
    }
  }, [fetchBiomassDefault, sys.species, sys.systemType]);

  return (
    <div className="space-y-6">
      {/* Target Pathogen */}
      <div className="space-y-3">
        <Label className="text-base text-foreground/90">Target Pathogen *</Label>
        <Select
          value={sys.targetPathogen || undefined}
          onValueChange={(v) => {
            if (v) updateField(`${prefix}.targetPathogen`, v);
          }}
        >
          <SelectTrigger
            aria-invalid={Boolean(fieldErrors[`${prefix}.targetPathogen`])}
            className="bg-white/92"
          >
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
      </div>

      {/* Species */}
      <div className="space-y-3">
        <Label className="text-base text-foreground/90">Species *</Label>
        <Select
          value={sys.species || undefined}
          onValueChange={(v) => {
            if (v) updateField(`${prefix}.species`, v);
          }}
        >
          <SelectTrigger
            aria-invalid={Boolean(fieldErrors[`${prefix}.species`])}
            className="bg-white/92"
          >
            <SelectValue placeholder="Select species" />
          </SelectTrigger>
          <SelectContent>
            {SPECIES_LIST.map((species) => (
              <SelectItem key={species.value} value={species.value}>
                {species.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* System Type */}
      <div className="space-y-3">
        <Label className="text-base text-foreground/90">System Type *</Label>
        <Select
          value={sys.systemType || undefined}
          onValueChange={(v) => {
            if (v) updateField(`${prefix}.systemType`, v);
          }}
        >
          <SelectTrigger
            aria-invalid={Boolean(fieldErrors[`${prefix}.systemType`])}
            className="bg-white/92"
          >
            <SelectValue placeholder="Select system type" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_TYPES.map((systemType) => (
              <SelectItem key={systemType.value} value={systemType.value}>
                {systemType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Biomass DO Demand */}
      <div className="space-y-3">
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
            updateField(`${prefix}.biomassDODemandM3Hr`, e.target.value)
          }
          aria-invalid={Boolean(fieldErrors[`${prefix}.biomassDODemandM3Hr`])}
          className="bg-white/92"
        />
      </div>
    </div>
  );
}

export function Step4Disinfection() {
  return (
    <SystemTabs>
      {(systemIndex) => <DisinfectionFields systemIndex={systemIndex} />}
    </SystemTabs>
  );
}
