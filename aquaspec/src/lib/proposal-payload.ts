/**
 * Proposal payload helpers keep preview/PDF requests aligned with the current
 * wizard state and with the session fallback used by the preview route.
 */

import type { SystemInputDisplay } from "./proposal-html";
import type { ProposalSessionPayload } from "./proposal-session";
import type { HatcheryRecommendation } from "./sizing-engine/types";
import type { SystemData } from "./store";

/**
 * Normalizes draft system values into the numeric payload expected by proposal rendering.
 */
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

/**
 * Builds the complete proposal payload shared by the modal preview and the full preview page.
 */
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
