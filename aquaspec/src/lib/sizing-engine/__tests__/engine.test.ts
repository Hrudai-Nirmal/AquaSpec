/**
 * AquaSpec — Sizing Engine Unit Tests
 *
 * 11 mandatory test cases exercising the 4-phase computation pipeline.
 */

import { describe, it, expect } from "vitest";
import {
  sizeHatchery,
  computeFlowRate,
  computeOzoneDemand,
  computeUVSizing,
  computeOxygenDemand,
  EngineError,
} from "../engine";
import type {
  HatcheryInput,
  SystemInput,
  SizingRulesFile,
} from "../types";
import rules from "../../../data/sizing-rules.json";

// Type-cast the imported JSON to our known shape
const sizingRules = rules as unknown as SizingRulesFile;

// ─── Shared helpers ────────────────────────────────────────────────────────

/** Create a base system input with sensible defaults overridden by partial. */
function makeSystem(overrides: Partial<SystemInput> = {}): SystemInput {
  return {
    name: "Test System",
    waterSource: "seawater",
    qualityBand: "good",
    totalVolumeM3: 100,
    turnoversPerDay: 4,
    operatingHoursPerDay: 8,
    salinityPpt: 30,
    targetPathogen: "general_disinfection",
    species: "vannamei",
    systemType: "larval_rearing",
    ...overrides,
  };
}

/** Create an aggregate hatchery input. */
function aggregate(system: SystemInput, name = "Test Hatchery"): HatcheryInput {
  return { mode: "aggregate", name, systems: [system] };
}

/** Create a multi-system hatchery input. */
function multiSystem(
  systems: SystemInput[],
  name = "Multi Hatchery",
): HatcheryInput {
  return { mode: "multi_system", name, systems };
}

// ─── Test 1 ────────────────────────────────────────────────────────────────

describe("Test 1: Aggregate seawater+good", () => {
  it("computes correct flow rate, ozone dose, and models", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 100,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // Phase A — flow rate
    // (100 × 4) / 8 = 50
    expect(rec.flowRate.flowRateM3Hr).toBe(50);
    expect(rec.flowRate.inputs.totalVolumeM3).toBe(100);
    expect(rec.flowRate.inputs.turnoversPerDay).toBe(4);
    expect(rec.flowRate.inputs.operatingHoursPerDay).toBe(8);

    // Phase B — ozone
    // seawater+good = 1.0 g/m³
    expect(rec.ozoneDemand.doseRateGM3).toBe(1.0);
    // no conditions match (general_disinfection not in any condition)
    expect(rec.ozoneDemand.conditionMultiplier).toBe(1.0);
    // ozoneDemand = 50 × 1.0 × 1.0 = 50
    expect(rec.ozoneDemand.ozoneDemandGHr).toBe(50);
    expect(rec.ozoneDemand.flowRateM3Hr).toBe(50);
    // 50 fits in LT-G-50 [30, 50]
    expect(rec.ozoneGeneratorModel).toBe("LT-G-50");

    // Phase C — UV
    // requiredFlow = 50, smallest unit >= 50 is LTU-T-50
    expect(rec.uvSizing.selectedModel).toBe("LTU-T-50");
    expect(rec.uvSizing.parallelUnits).toBe(1);
    expect(rec.uvSizing.ratedFlowPerUnitM3Hr).toBe(50);
    expect(rec.uvSizing.requiredFlowM3Hr).toBe(50);

    // Phase D — oxygen
    // oxygenFeedLPM for LT-G-50 = 30
    // ozoneFeedRequirement = 30 × 0.06 = 1.8
    expect(rec.oxygenDemand.ozoneFeedRequirementM3Hr).toBeCloseTo(1.8, 6);
    // biomassDO: vannamei+larval_rearing = 0.5
    expect(rec.oxygenDemand.biomassDODemandM3Hr).toBe(0.5);
    // total = 1.8 + 0.5 = 2.3
    expect(rec.oxygenDemand.totalOxygenDemandM3Hr).toBeCloseTo(2.3, 6);
    // 2.3 fits in LTX-5 [0, 5]
    expect(rec.oxygenDemand.selectedModel).toBe("LTX-5");
  });
});

// ─── Test 2 ────────────────────────────────────────────────────────────────

describe("Test 2: Aggregate freshwater+poor → higher dose rate", () => {
  it("uses a higher dose rate than seawater+good", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "freshwater",
        qualityBand: "poor",
        totalVolumeM3: 30,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 10,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // Phase A: (30 × 4) / 8 = 15
    expect(rec.flowRate.flowRateM3Hr).toBe(15);

    // freshwater+poor = 1.8 g/m³ — higher than seawater+good (1.0)
    expect(rec.ozoneDemand.doseRateGM3).toBe(1.8);
    expect(rec.ozoneDemand.doseRateGM3).toBeGreaterThan(1.0);

    // conditionMultiplier = 1.0 (general_disinfection, no matching conditions)
    expect(rec.ozoneDemand.conditionMultiplier).toBe(1.0);

    // ozoneDemand = 15 × 1.8 × 1.0 = 27
    expect(rec.ozoneDemand.ozoneDemandGHr).toBe(27);

    // 27 fits in LT-G-30 [20, 30]
    expect(rec.ozoneGeneratorModel).toBe("LT-G-30");

    // UV: requiredFlow = 15, smallest unit >= 15 is LTU-T-50
    expect(rec.uvSizing.selectedModel).toBe("LTU-T-50");
    expect(rec.uvSizing.parallelUnits).toBe(1);
  });
});

// ─── Test 3 ────────────────────────────────────────────────────────────────

describe("Test 3: Condition salinity 30 + Vibrio → ozone multiplier 1.3", () => {
  it("applies the 1.3 ozone multiplier for high-salinity Vibrio", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 50,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "vibrio",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // Phase A: (50 × 4) / 8 = 25
    expect(rec.flowRate.flowRateM3Hr).toBe(25);

    // doseRate = 1.0 (seawater+good)
    expect(rec.ozoneDemand.doseRateGM3).toBe(1.0);

    // Condition: salinity 25-50 + vibrio → ozoneMultiplier 1.3
    expect(rec.ozoneDemand.conditionMultiplier).toBe(1.3);

    // ozoneDemand = 25 × 1.0 × 1.3 = 32.5
    expect(rec.ozoneDemand.ozoneDemandGHr).toBeCloseTo(32.5, 6);

    // 32.5 fits in LT-G-50 [30, 50]
    expect(rec.ozoneGeneratorModel).toBe("LT-G-50");
  });
});

// ─── Test 4 ────────────────────────────────────────────────────────────────

describe("Test 4: Condition salinity 10 + Vibrio → NO multiplier", () => {
  it("does NOT apply the 1.3 multiplier when salinity is below 25", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 50,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 10,
        targetPathogen: "vibrio",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // No condition matches — salinity 10 is below the 25 threshold
    expect(rec.ozoneDemand.conditionMultiplier).toBe(1.0);

    // ozoneDemand = 25 × 1.0 × 1.0 = 25
    expect(rec.ozoneDemand.ozoneDemandGHr).toBe(25);

    // 25 fits in LT-G-30 [20, 30]
    expect(rec.ozoneGeneratorModel).toBe("LT-G-30");
  });
});

// ─── Test 5 ────────────────────────────────────────────────────────────────

describe("Test 5: Multi-condition stacking", () => {
  it("applies all matching adjustments cumulatively for estuary+Vibrio at salinity 30", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "estuary",
        qualityBand: "good",
        totalVolumeM3: 30,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "vibrio",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // Phase A: (30 × 4) / 8 = 15
    expect(rec.flowRate.flowRateM3Hr).toBe(15);

    // estuary+good = 1.2 g/m³
    expect(rec.ozoneDemand.doseRateGM3).toBe(1.2);

    // Two conditions match:
    //   1. salinity 25-50 + vibrio → ozoneMultiplier 1.3
    //   2. estuary + vibrio → ozoneMultiplier 1.4
    // Cumulative: 1.0 × 1.3 × 1.4 = 1.82
    expect(rec.ozoneDemand.conditionMultiplier).toBeCloseTo(1.82, 6);

    // ozoneDemand = 15 × 1.2 × 1.82 = 32.76
    expect(rec.ozoneDemand.ozoneDemandGHr).toBeCloseTo(32.76, 6);

    // 32.76 fits in LT-G-50 [30, 50]
    expect(rec.ozoneGeneratorModel).toBe("LT-G-50");
  });
});

// ─── Test 6 ────────────────────────────────────────────────────────────────

describe("Test 6: UV parallel — flow 450 m³/hr → 2×LTU-T-300", () => {
  it("returns 2 parallel LTU-T-300 units when required flow exceeds the largest single unit", () => {
    // Phase C is tested in isolation since a flow of 450 would blow past
    // all ozone generator capacities in Phase B of the full pipeline.
    const result = computeUVSizing(450, sizingRules);

    expect(result.selectedModel).toBe("LTU-T-300");
    expect(result.parallelUnits).toBe(2);
    expect(result.ratedFlowPerUnitM3Hr).toBe(300);
    expect(result.requiredFlowM3Hr).toBe(450);
  });
});

// ─── Test 7 ────────────────────────────────────────────────────────────────

describe("Test 7: Error — missing dose rate combo", () => {
  it("throws EngineError when waterSource+qualityBand is not in rules", () => {
    // Build a custom rules object that is missing the freshwater+poor entry
    const partialRules: SizingRulesFile = {
      ...sizingRules,
      ozoneDoseRates: sizingRules.ozoneDoseRates.filter(
        (d) => !(d.waterSource === "freshwater" && d.qualityBand === "poor"),
      ),
    };

    const input = aggregate(
      makeSystem({
        waterSource: "freshwater",
        qualityBand: "poor",
        totalVolumeM3: 30,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 10,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    expect(() => sizeHatchery(input, partialRules)).toThrow(EngineError);
    expect(() => sizeHatchery(input, partialRules)).toThrow(
      /No dose rate found/,
    );
  });
});

// ─── Test 8 ────────────────────────────────────────────────────────────────

describe("Test 8: Ozone parallel — demand 120 g/hr → 2×LT-G-80", () => {
  it("uses parallel largest ozone generators when demand exceeds a single-unit maximum", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 240,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 10,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    expect(rec.flowRate.flowRateM3Hr).toBe(120);
    expect(rec.ozoneDemand.ozoneDemandGHr).toBe(120);
    expect(rec.ozoneGeneratorModel).toBe("LT-G-80 ×2");
    expect(rec.oxygenDemand.ozoneFeedRequirementM3Hr).toBeCloseTo(5.4, 6);
    expect(rec.oxygenDemand.totalOxygenDemandM3Hr).toBeCloseTo(5.9, 6);
    expect(rec.oxygenDemand.selectedModel).toBe("LTX-10");
  });
});

// ─── Test 9 ────────────────────────────────────────────────────────────────

describe("Test 9: Multi-system — 2 systems + aggregate summary", () => {
  it("returns 2 recommendations and correct aggregate totals", () => {
    const input = multiSystem([
      makeSystem({
        name: "System A",
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 80,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
      makeSystem({
        name: "System B",
        waterSource: "freshwater",
        qualityBand: "good",
        totalVolumeM3: 60,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 10,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      }),
    ]);

    const result = sizeHatchery(input, sizingRules);

    // Two systems
    expect(result.systems).toHaveLength(2);
    expect(result.systems[0].systemName).toBe("System A");
    expect(result.systems[1].systemName).toBe("System B");

    // Mode
    expect(result.mode).toBe("multi_system");

    // Aggregate summary must exist
    expect(result.aggregateSummary).toBeDefined();

    const summary = result.aggregateSummary!;

    // System A: flowRate = (80×4)/8 = 40, ozoneDemand = 40×1.0 = 40
    // System B: flowRate = (60×4)/8 = 30, ozoneDemand = 30×0.8 = 24
    expect(summary.totalFlowRateM3Hr).toBeCloseTo(70, 6);
    expect(summary.totalOzoneDemandGHr).toBeCloseTo(64, 6);

    // Ozone generators: System A → LT-G-50 (40 in [30,50]), System B → LT-G-30 (24 in [20,30])
    expect(summary.allOzoneGenerators).toEqual(["LT-G-50", "LT-G-30"]);

    // UV: both flows < 50 so both use LTU-T-50, aggregated
    expect(summary.allUVUnits).toEqual(
      expect.arrayContaining([{ model: "LTU-T-50", quantity: 2 }]),
    );

    // Oxygen: System A — oxygenFeedLPM=30, ozoneFeed=1.8, biomassDO=0.5, total=2.3 → LTX-5
    //         System B — oxygenFeedLPM=20, ozoneFeed=1.2, biomassDO=0.5, total=1.7 → LTX-5
    expect(summary.totalOxygenDemandM3Hr).toBeCloseTo(4.0, 6);
    expect(summary.allOxygenPackages).toEqual(["LTX-5", "LTX-5"]);

    // Verify per-system details
    expect(result.systems[0].ozoneGeneratorModel).toBe("LT-G-50");
    expect(result.systems[1].ozoneGeneratorModel).toBe("LT-G-30");
    expect(result.systems[0].oxygenDemand.totalOxygenDemandM3Hr).toBeCloseTo(2.3, 6);
    expect(result.systems[1].oxygenDemand.totalOxygenDemandM3Hr).toBeCloseTo(1.7, 6);
  });
});

// ─── Test 10 ───────────────────────────────────────────────────────────────

describe("Test 10: Biomass DO — user value overrides rules default", () => {
  it("uses the user-provided biomassDODemandM3Hr instead of the default", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 100,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
        // User provided 2.0 — default for vannamei+larval_rearing is 0.5
        biomassDODemandM3Hr: 2.0,
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // Should use the user value, not the default
    expect(rec.oxygenDemand.biomassDODemandM3Hr).toBe(2.0);

    // ozoneFeedRequirement = 30 × 0.06 = 1.8 (LT-G-50 oxygenFeedLPM=30)
    expect(rec.oxygenDemand.ozoneFeedRequirementM3Hr).toBeCloseTo(1.8, 6);

    // total = 1.8 + 2.0 = 3.8
    expect(rec.oxygenDemand.totalOxygenDemandM3Hr).toBeCloseTo(3.8, 6);

    // 3.8 fits in LTX-5 [0, 5]
    expect(rec.oxygenDemand.selectedModel).toBe("LTX-5");
  });
});

// ─── Test 11 ────────────────────────────────────────────────────────────────

describe("Test 11: Biomass DO — no user value → falls back to rules default", () => {
  it("falls back to the rules default when biomassDODemandM3Hr is not provided", () => {
    const input = aggregate(
      makeSystem({
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 100,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
        // biomassDODemandM3Hr intentionally omitted
      }),
    );

    const result = sizeHatchery(input, sizingRules);
    const rec = result.systems[0];

    // Default for vannamei+larval_rearing is 0.5
    expect(rec.oxygenDemand.biomassDODemandM3Hr).toBe(0.5);
  });
});
