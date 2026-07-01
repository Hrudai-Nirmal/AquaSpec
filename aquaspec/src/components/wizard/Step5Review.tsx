"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";

const WATER_SOURCE_LABELS: Record<string, string> = {
  seawater: "Seawater",
  freshwater: "Freshwater",
  borewell: "Borewell",
  estuary: "Estuary",
};

const QUALITY_LABELS: Record<string, string> = {
  good: "Good",
  moderate: "Moderate",
  poor: "Poor",
};

const PATHOGEN_LABELS: Record<string, string> = {
  vibrio: "Vibrio",
  wssv: "WSSV",
  general_disinfection: "General Disinfection",
};

const SPECIES_LABELS: Record<string, string> = {
  vannamei: "Vannamei",
  monodon: "Monodon",
  indicus: "Indicus",
  other: "Other",
};

const SYSTEM_TYPE_LABELS: Record<string, string> = {
  larval_rearing: "Larval Rearing",
  broodstock: "Broodstock",
  algae_culture: "Algae Culture",
  nauplii: "Nauplii",
  general: "General",
};

/** Summarizes the entered sizing inputs before proposal export. */
export function Step5Review() {
  const hatcheryName = useStore((s) => s.hatcheryName);
  const mode = useStore((s) => s.mode);
  const systems = useStore((s) => s.systems);
  const setProposalOpen = useStore((s) => s.setProposalOpen);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">
          {hatcheryName || "Unnamed Hatchery"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Mode: {mode === "aggregate" ? "Single System" : "Multi-System"}
        </p>
      </div>

      {systems.map((sys, i) => (
        <Card key={i} size="sm" className="card-accent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {sys.name || `System ${i + 1}`}
              <Badge variant="secondary" className="text-xs">
                System {i + 1}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Water Source:</span>{" "}
                {WATER_SOURCE_LABELS[sys.waterSource] || sys.waterSource}
              </div>
              <div>
                <span className="text-muted-foreground">Quality:</span>{" "}
                {QUALITY_LABELS[sys.qualityBand] || sys.qualityBand}
              </div>
              <div>
                <span className="text-muted-foreground">Salinity:</span>{" "}
                {sys.salinityPpt} ppt
              </div>
              <div>
                <span className="text-muted-foreground">Volume:</span>{" "}
                {sys.totalVolumeM3} m³
              </div>
              <div>
                <span className="text-muted-foreground">Turnovers:</span>{" "}
                {sys.turnoversPerDay}/day
              </div>
              <div>
                <span className="text-muted-foreground">Op. Hours:</span>{" "}
                {sys.operatingHoursPerDay}h
              </div>
              <div>
                <span className="text-muted-foreground">Pathogen:</span>{" "}
                {PATHOGEN_LABELS[sys.targetPathogen] || sys.targetPathogen}
              </div>
              <div>
                <span className="text-muted-foreground">Species:</span>{" "}
                {SPECIES_LABELS[sys.species] || sys.species}
              </div>
              <div>
                <span className="text-muted-foreground">System Type:</span>{" "}
                {SYSTEM_TYPE_LABELS[sys.systemType] || sys.systemType}
              </div>
              <div>
                <span className="text-muted-foreground">Biomass DO:</span>{" "}
                {sys.biomassDODemandM3Hr
                  ? `${sys.biomassDODemandM3Hr} m³/hr`
                  : "Rules default"}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={() => setProposalOpen(true)}
        className="w-full"
        size="lg"
      >
        <FileTextIcon className="size-4 mr-2" />
        Generate Proposal
      </Button>
    </div>
  );
}
