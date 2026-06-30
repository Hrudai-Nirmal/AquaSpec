/**
 * AquaSpec — Sizing Engine Type Definitions
 * 
 * This file defines the complete type contract for the sizing engine.
 * All types are framework-independent and use Zod for runtime validation.
 */

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────

export const WaterSource = z.enum([
  "seawater",
  "freshwater",
  "borewell",
  "estuary",
]);
export type WaterSource = z.infer<typeof WaterSource>;

export const QualityBand = z.enum(["good", "moderate", "poor"]);
export type QualityBand = z.infer<typeof QualityBand>;

export const TargetPathogen = z.enum([
  "vibrio",
  "wssv",
  "general_disinfection",
]);
export type TargetPathogen = z.infer<typeof TargetPathogen>;

export const HatcheryMode = z.enum(["aggregate", "multi_system"]);
export type HatcheryMode = z.infer<typeof HatcheryMode>;

export const SystemType = z.enum([
  "larval_rearing",
  "broodstock",
  "algae_culture",
  "nauplii",
  "general",
]);
export type SystemType = z.infer<typeof SystemType>;

export const Species = z.enum(["vannamei", "monodon", "indicus", "other"]);
export type Species = z.infer<typeof Species>;

// ─── System Input (per system in multi-system mode, or the sole system in aggregate) ──

export const SystemInput = z.object({
  /** Human-readable name for this system (e.g. "Larval Rearing Tanks") */
  name: z.string().min(1),
  /** Water source type */
  waterSource: WaterSource,
  /** Quality band (good/moderate/poor) */
  qualityBand: QualityBand,
  /** Total water volume in cubic metres (m³) */
  totalVolumeM3: z.number().positive(),
  /** Desired water exchanges per day */
  turnoversPerDay: z.number().positive().int(),
  /** Hours the treatment system operates per day */
  operatingHoursPerDay: z.number().positive().max(24),
  /** Salinity in parts per thousand (ppt) */
  salinityPpt: z.number().min(0).max(50),
  /** Target pathogen for disinfection */
  targetPathogen: TargetPathogen,
  /** Species being cultured (for biomass DO defaults) */
  species: Species,
  /** System type (for biomass DO defaults) */
  systemType: SystemType,
  /**
   * User-specified biomass dissolved oxygen demand (m³/hr).
   * When provided, this overrides the rules file default.
   * When omitted, the engine pulls the default from sizing-rules.json.
   */
  biomassDODemandM3Hr: z.number().min(0).optional(),
});
export type SystemInput = z.infer<typeof SystemInput>;

// ─── Hatchery Input (top-level, wraps one or more systems) ───

export const HatcheryInput = z.object({
  /** Operating mode */
  mode: HatcheryMode,
  /** Hatchery name for identification */
  name: z.string().min(1),
  /** One system in aggregate mode, N systems in multi_system mode */
  systems: z.array(SystemInput).min(1),
}).refine(
  (data) => data.mode === "aggregate" ? data.systems.length === 1 : true,
  { message: "Aggregate mode requires exactly one system" }
);
export type HatcheryInput = z.infer<typeof HatcheryInput>;

// ─── Phase Results ────────────────────────────────────────────────────────

export interface FlowRateResult {
  /** Computed flow rate in m³/hr */
  flowRateM3Hr: number;
  /** Input values used for transparency */
  inputs: {
    totalVolumeM3: number;
    turnoversPerDay: number;
    operatingHoursPerDay: number;
  };
}

export interface OzoneDemandResult {
  /** Computed ozone demand in g/hr */
  ozoneDemandGHr: number;
  /** Dose rate applied from rules file, in g/m³ */
  doseRateGM3: number;
  /** Any condition-based multiplier applied */
  conditionMultiplier: number;
  /** The flow rate this was computed from */
  flowRateM3Hr: number;
}

export interface UVSizingResult {
  /** Selected LTU-T model identifier */
  selectedModel: string;
  /** Number of parallel units required */
  parallelUnits: number;
  /** Rated flow capacity per unit in m³/hr */
  ratedFlowPerUnitM3Hr: number;
  /** The flow rate this was matched against */
  requiredFlowM3Hr: number;
}

export interface OxygenDemandResult {
  /** Ozone generator feed requirement in m³/hr */
  ozoneFeedRequirementM3Hr: number;
  /** Biomass DO demand in m³/hr */
  biomassDODemandM3Hr: number;
  /** Total oxygen demand in m³/hr */
  totalOxygenDemandM3Hr: number;
  /** Selected LTX / LTX-M model identifier */
  selectedModel: string;
}

// ─── Complete Engine Output ────────────────────────────────────────────────

export interface SystemRecommendation {
  /** The system this recommendation belongs to */
  systemName: string;
  /** Phase A result */
  flowRate: FlowRateResult;
  /** Phase B result */
  ozoneDemand: OzoneDemandResult;
  /** Phase C result */
  uvSizing: UVSizingResult;
  /** Phase D result */
  oxygenDemand: OxygenDemandResult;
  /** Selected ozone generator model (LT-G series) */
  ozoneGeneratorModel: string;
}

export interface HatcheryRecommendation {
  /** Hatchery name from input */
  hatcheryName: string;
  /** Mode used */
  mode: HatcheryMode;
  /** Rules file version used for computation */
  rulesVersion: string;
  /** Timestamp of computation */
  computedAt: string;
  /** Per-system recommendations */
  systems: SystemRecommendation[];
  /** Aggregate summary (only present in multi_system mode) */
  aggregateSummary?: {
    totalFlowRateM3Hr: number;
    totalOzoneDemandGHr: number;
    totalOxygenDemandM3Hr: number;
    allOzoneGenerators: string[];
    allUVUnits: { model: string; quantity: number }[];
    allOxygenPackages: string[];
  };
}

// ─── Rules File Schema ────────────────────────────────────────────────────

/**
 * Schema for the sizing-rules.json data file.
 * This is the file the user/engineer edits to update coefficients.
 */

export const OzoneDoseRateEntry = z.object({
  waterSource: WaterSource,
  qualityBand: QualityBand,
  /** Dose rate in grams per cubic metre (g/m³) */
  doseRateGM3: z.number().positive(),
});
export type OzoneDoseRateEntry = z.infer<typeof OzoneDoseRateEntry>;

export const OzoneGeneratorModel = z.object({
  /** Model identifier, e.g. "LT-G-4" */
  model: z.string().min(1),
  /** Minimum ozone output capacity in g/hr */
  minCapacityGHr: z.number().min(0),
  /** Maximum ozone output capacity in g/hr */
  maxCapacityGHr: z.number().positive(),
  /** Required oxygen feed in litres per minute (LPM) */
  oxygenFeedLPM: z.number().positive(),
});
export type OzoneGeneratorModel = z.infer<typeof OzoneGeneratorModel>;

export const UVUnitModel = z.object({
  /** Model identifier, e.g. "LTU-T-100" */
  model: z.string().min(1),
  /** Rated flow capacity in m³/hr at 100 mJ/cm² */
  ratedFlowM3Hr: z.number().positive(),
});
export type UVUnitModel = z.infer<typeof UVUnitModel>;

export const OxygenPackageModel = z.object({
  /** Model identifier, e.g. "LTX-10" */
  model: z.string().min(1),
  /** Minimum oxygen output in m³/hr */
  minCapacityM3Hr: z.number().min(0),
  /** Maximum oxygen output in m³/hr */
  maxCapacityM3Hr: z.number().positive(),
});
export type OxygenPackageModel = z.infer<typeof OxygenPackageModel>;

export const ConditionAdjustment = z.object({
  /** Human-readable description of when this applies */
  description: z.string(),
  /** Conditions that trigger this adjustment */
  conditions: z.object({
    salinityPpt: z.object({
      min: z.number().min(0),
      max: z.number().max(50),
    }).optional(),
    targetPathogen: z.array(TargetPathogen).optional(),
    waterSource: z.array(WaterSource).optional(),
  }),
  /** Multiplier applied to ozone dose (1.0 = no change) */
  ozoneMultiplier: z.number().positive().default(1.0),
  /** Multiplier applied to UV sizing (1.0 = no change) */
  uvMultiplier: z.number().positive().default(1.0),
});
export type ConditionAdjustment = z.infer<typeof ConditionAdjustment>;

export const BiomassDODefault = z.object({
  species: Species,
  systemType: SystemType,
  /** Default biomass DO demand in m³/hr */
  defaultDODemandM3Hr: z.number().min(0),
});
export type BiomassDODefault = z.infer<typeof BiomassDODefault>;

export const SizingRulesFile = z.object({
  /** Semantic version of the rules file */
  version: z.string().min(1),
  /** ISO 8601 timestamp of last update */
  lastUpdated: z.string().min(1),
  /** Ozone dose rate lookup table */
  ozoneDoseRates: z.array(OzoneDoseRateEntry).min(1),
  /** LT-G ozone generator catalog */
  ozoneGenerators: z.array(OzoneGeneratorModel).min(1),
  /** LTU-T UV unit catalog */
  uvUnits: z.array(UVUnitModel).min(1),
  /** LTX / LTX-M oxygen package catalog */
  oxygenPackages: z.array(OxygenPackageModel).min(1),
  /** Condition-based safety factor adjustments */
  conditionAdjustments: z.array(ConditionAdjustment).default([]),
  /** Default biomass DO demand per species + system type */
  biomassDODefaults: z.array(BiomassDODefault).default([]),
});
export type SizingRulesFile = z.infer<typeof SizingRulesFile>;

// ─── Pricing Text (static, separate file) ─────────────────────────────────

export const PricingTextEntry = z.object({
  model: z.string(),
  /** Budgetary estimate text snippet */
  estimateText: z.string(),
});
export type PricingTextEntry = z.infer<typeof PricingTextEntry>;

// ─── Saved Configuration (full snapshot) ──────────────────────────────────

export const SavedConfiguration = z.object({
  /** Unique identifier */
  id: z.string(),
  /** Human-readable name */
  name: z.string(),
  /** ISO timestamp of when this was saved */
  savedAt: z.string(),
  /** The input that generated this config */
  input: HatcheryInput,
  /** The computed recommendation (full snapshot as arbitrary object) */
  recommendation: z.record(z.string(), z.any()),
  /** Rules file version at time of save */
  rulesVersionAtSave: z.string(),
  /** Whether the user opted to include budgetary estimate in PDF */
  includeBudgetaryEstimate: z.boolean().default(false),
});
export type SavedConfiguration = z.infer<typeof SavedConfiguration>;
