import type { SystemInputDisplay } from "./proposal-html";
import type { ProposalSessionPayload } from "./proposal-session";
import type { HatcheryRecommendation } from "./sizing-engine/types";
import type { SystemData } from "./store";

export function buildProposalInputs(
  systems: SystemData[]
): SystemInputDisplay[] {
  return systems.map((system) => ({
    name: system.name,
    waterSource: system.waterSource,
    qualityBand: system.qualityBand,
    salinityPpt: Number.parseFloat(system.salinityPpt) || 0,
    totalVolumeM3: Number.parseFloat(system.totalVolumeM3) || 0,
    turnoversPerDay: Number.parseInt(system.turnoversPerDay, 10) || 0,
    operatingHoursPerDay: Number.parseFloat(system.operatingHoursPerDay) || 0,
    targetPathogen: system.targetPathogen,
    species: system.species,
    systemType: system.systemType,
  }));
}

export function buildProposalSessionPayload(args: {
  hatcheryName: string;
  includeBudgetary: boolean;
  recommendation: HatcheryRecommendation;
  systems: SystemData[];
}): ProposalSessionPayload {
  return {
    hatcheryName: args.hatcheryName,
    includeBudgetary: args.includeBudgetary,
    recommendation: args.recommendation,
    inputs: buildProposalInputs(args.systems),
  };
}
