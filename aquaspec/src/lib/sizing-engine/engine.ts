/**
 * AquaSpec — Sizing Engine
 *
 * Pure TypeScript module implementing the 4-phase deterministic
 * computation pipeline for ozone water treatment sizing.
 *
 * ZERO React/Next.js imports — framework-independent.
 */

import type {
  HatcheryInput,
  HatcheryRecommendation,
  SystemInput,
  SizingRulesFile,
  FlowRateResult,
  OzoneDemandResult,
  UVSizingResult,
  OxygenDemandResult,
  SystemRecommendation,
  ConditionAdjustment,
} from "./types";

// ─── Custom Error ──────────────────────────────────────────────────────────

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

// ─── Condition Matching ────────────────────────────────────────────────────

/**
 * Returns true when ALL specified conditions in the adjustment match the
 * given system input.  Unspecified conditions are treated as "always matches".
 */
function matchesConditions(
  adj: ConditionAdjustment,
  system: SystemInput,
): boolean {
  const { salinityPpt, targetPathogen, waterSource } = adj.conditions;

  if (salinityPpt) {
    if (
      system.salinityPpt < salinityPpt.min ||
      system.salinityPpt > salinityPpt.max
    ) {
      return false;
    }
  }

  if (targetPathogen) {
    if (!targetPathogen.includes(system.targetPathogen)) {
      return false;
    }
  }

  if (waterSource) {
    if (!waterSource.includes(system.waterSource)) {
      return false;
    }
  }

  return true;
}

// ─── Phase A — Flow Rate ───────────────────────────────────────────────────

export function computeFlowRate(system: SystemInput): FlowRateResult {
  const { totalVolumeM3, turnoversPerDay, operatingHoursPerDay } = system;

  const flowRateM3Hr =
    (totalVolumeM3 * turnoversPerDay) / operatingHoursPerDay;

  return {
    flowRateM3Hr,
    inputs: {
      totalVolumeM3,
      turnoversPerDay,
      operatingHoursPerDay,
    },
  };
}

// ─── Phase B — Ozone Demand ────────────────────────────────────────────────

export function computeOzoneDemand(
  flowRateM3Hr: number,
  system: SystemInput,
  rules: SizingRulesFile,
): {
  result: OzoneDemandResult;
  ozoneGeneratorModel: string;
  oxygenFeedLPM: number;
} {
  // 1. Look up dose rate
  const doseEntry = rules.ozoneDoseRates.find(
    (d) =>
      d.waterSource === system.waterSource &&
      d.qualityBand === system.qualityBand,
  );

  if (!doseEntry) {
    throw new EngineError(
      `No dose rate found for waterSource="${system.waterSource}" + qualityBand="${system.qualityBand}"`,
    );
  }

  const doseRateGM3 = doseEntry.doseRateGM3;

  // 2. Find matching condition adjustments
  // 3. Apply cumulative ozone multipliers
  let conditionMultiplier = 1.0;

  for (const adj of rules.conditionAdjustments) {
    if (matchesConditions(adj, system)) {
      conditionMultiplier *= adj.ozoneMultiplier;
    }
  }

  // 4. Compute ozone demand
  const ozoneDemandGHr = flowRateM3Hr * doseRateGM3 * conditionMultiplier;

  // 5. Match to smallest LT-G model
  const sortedGenerators = [...rules.ozoneGenerators].sort(
    (a, b) => a.maxCapacityGHr - b.maxCapacityGHr,
  );

  const match = sortedGenerators.find(
    (m) => ozoneDemandGHr >= m.minCapacityGHr && ozoneDemandGHr <= m.maxCapacityGHr,
  );

  if (!match) {
    const largest = sortedGenerators[sortedGenerators.length - 1];
    throw new EngineError(
      `Ozone demand ${ozoneDemandGHr.toFixed(2)} g/hr exceeds capacity of the largest ozone generator ` +
        `(${largest.model}, max ${largest.maxCapacityGHr} g/hr)`,
    );
  }

  return {
    result: {
      ozoneDemandGHr,
      doseRateGM3,
      conditionMultiplier,
      flowRateM3Hr,
    },
    ozoneGeneratorModel: match.model,
    oxygenFeedLPM: match.oxygenFeedLPM,
  };
}

// ─── Phase C — UV Sizing ───────────────────────────────────────────────────

export function computeUVSizing(
  requiredFlowM3Hr: number,
  rules: SizingRulesFile,
): UVSizingResult {
  const sortedUnits = [...rules.uvUnits].sort(
    (a, b) => a.ratedFlowM3Hr - b.ratedFlowM3Hr,
  );

  // Find smallest model where rated flow >= required flow
  const match = sortedUnits.find(
    (u) => u.ratedFlowM3Hr >= requiredFlowM3Hr,
  );

  if (match) {
    return {
      selectedModel: match.model,
      parallelUnits: 1,
      ratedFlowPerUnitM3Hr: match.ratedFlowM3Hr,
      requiredFlowM3Hr,
    };
  }

  // Flow exceeds largest model — parallel units
  const largest = sortedUnits[sortedUnits.length - 1];
  const parallelUnits = Math.ceil(requiredFlowM3Hr / largest.ratedFlowM3Hr);

  return {
    selectedModel: largest.model,
    parallelUnits,
    ratedFlowPerUnitM3Hr: largest.ratedFlowM3Hr,
    requiredFlowM3Hr,
  };
}

// ─── Phase C with conditions (used in full pipeline) ───────────────────────

function computeUVSizingWithConditions(
  flowRateM3Hr: number,
  system: SystemInput,
  rules: SizingRulesFile,
): UVSizingResult {
  // Apply cumulative UV multipliers from matching conditions
  let uvMultiplier = 1.0;

  for (const adj of rules.conditionAdjustments) {
    if (matchesConditions(adj, system)) {
      uvMultiplier *= adj.uvMultiplier;
    }
  }

  const requiredFlowM3Hr = flowRateM3Hr * uvMultiplier;
  return computeUVSizing(requiredFlowM3Hr, rules);
}

// ─── Phase D — Oxygen Demand ───────────────────────────────────────────────

export function computeOxygenDemand(
  oxygenFeedLPM: number,
  system: SystemInput,
  rules: SizingRulesFile,
): OxygenDemandResult {
  // 1. Convert oxygen feed from LPM to m³/hr
  const ozoneFeedRequirementM3Hr = oxygenFeedLPM * 0.06;

  // 2. Biomass DO demand: user value or rules default
  let biomassDODemandM3Hr: number;

  if (system.biomassDODemandM3Hr !== undefined) {
    biomassDODemandM3Hr = system.biomassDODemandM3Hr;
  } else {
    const defaultEntry = rules.biomassDODefaults.find(
      (d) =>
        d.species === system.species && d.systemType === system.systemType,
    );

    if (!defaultEntry) {
      throw new EngineError(
        `No biomass DO default found for species="${system.species}" + systemType="${system.systemType}"`,
      );
    }

    biomassDODemandM3Hr = defaultEntry.defaultDODemandM3Hr;
  }

  // 3. Total oxygen demand
  const totalOxygenDemandM3Hr =
    ozoneFeedRequirementM3Hr + biomassDODemandM3Hr;

  // 4. Match to smallest oxygen package
  const sortedPackages = [...rules.oxygenPackages].sort(
    (a, b) => a.maxCapacityM3Hr - b.maxCapacityM3Hr,
  );

  const match = sortedPackages.find(
    (p) =>
      totalOxygenDemandM3Hr >= p.minCapacityM3Hr &&
      totalOxygenDemandM3Hr <= p.maxCapacityM3Hr,
  );

  if (!match) {
    const largest = sortedPackages[sortedPackages.length - 1];
    throw new EngineError(
      `Total oxygen demand ${totalOxygenDemandM3Hr.toFixed(3)} m³/hr exceeds capacity ` +
        `of the largest oxygen package (${largest.model}, max ${largest.maxCapacityM3Hr} m³/hr)`,
    );
  }

  return {
    ozoneFeedRequirementM3Hr,
    biomassDODemandM3Hr,
    totalOxygenDemandM3Hr,
    selectedModel: match.model,
  };
}

// ─── Main Export ───────────────────────────────────────────────────────────

/**
 * Size a hatchery — runs the full 4-phase pipeline for every system and
 * returns a complete recommendation.
 */
export function sizeHatchery(
  input: HatcheryInput,
  rules: SizingRulesFile,
): HatcheryRecommendation {
  const systems: SystemRecommendation[] = [];

  let totalFlowRateM3Hr = 0;
  let totalOzoneDemandGHr = 0;
  let totalOxygenDemandM3Hr = 0;
  const allOzoneGenerators: string[] = [];
  const uvModelMap = new Map<string, number>();
  const allOxygenPackages: string[] = [];

  for (const sys of input.systems) {
    // Phase A
    const flowRate = computeFlowRate(sys);

    // Phase B
    const ozone = computeOzoneDemand(flowRate.flowRateM3Hr, sys, rules);

    // Phase C
    const uv = computeUVSizingWithConditions(flowRate.flowRateM3Hr, sys, rules);

    // Phase D
    const oxygen = computeOxygenDemand(ozone.oxygenFeedLPM, sys, rules);

    systems.push({
      systemName: sys.name,
      flowRate,
      ozoneDemand: ozone.result,
      uvSizing: uv,
      oxygenDemand: oxygen,
      ozoneGeneratorModel: ozone.ozoneGeneratorModel,
    });

    // Accumulate for aggregate summary
    totalFlowRateM3Hr += flowRate.flowRateM3Hr;
    totalOzoneDemandGHr += ozone.result.ozoneDemandGHr;
    totalOxygenDemandM3Hr += oxygen.totalOxygenDemandM3Hr;
    allOzoneGenerators.push(ozone.ozoneGeneratorModel);
    uvModelMap.set(uv.selectedModel, (uvModelMap.get(uv.selectedModel) ?? 0) + uv.parallelUnits);
    allOxygenPackages.push(oxygen.selectedModel);
  }

  const recommendation: HatcheryRecommendation = {
    hatcheryName: input.name,
    mode: input.mode,
    rulesVersion: rules.version,
    computedAt: new Date().toISOString(),
    systems,
  };

  // Add aggregate summary for multi-system mode
  if (input.mode === "multi_system") {
    const allUVUnits: { model: string; quantity: number }[] = [];
    for (const [model, quantity] of uvModelMap) {
      allUVUnits.push({ model, quantity });
    }

    recommendation.aggregateSummary = {
      totalFlowRateM3Hr,
      totalOzoneDemandGHr,
      totalOxygenDemandM3Hr,
      allOzoneGenerators,
      allUVUnits,
      allOxygenPackages,
    };
  }

  return recommendation;
}
