"use client";

import { create } from "zustand";
import { z } from "zod";
import {
  WaterSource,
  QualityBand,
  TargetPathogen,
  Species,
  SystemType,
  HatcheryInput,
  type HatcheryRecommendation,
} from "./sizing-engine/types";

// ─── System-level form data (partial, allowing empty/incomplete) ───────────

export interface SystemData {
  name: string;
  waterSource: string; // "" means not selected
  qualityBand: string;
  totalVolumeM3: string; // string for text input
  turnoversPerDay: string;
  operatingHoursPerDay: string;
  salinityPpt: string;
  targetPathogen: string;
  species: string;
  systemType: string;
  biomassDODemandM3Hr: string; // empty = use default
}

export function emptySystem(): SystemData {
  return {
    name: "",
    waterSource: "",
    qualityBand: "",
    totalVolumeM3: "",
    turnoversPerDay: "",
    operatingHoursPerDay: "",
    salinityPpt: "",
    targetPathogen: "",
    species: "",
    systemType: "",
    biomassDODemandM3Hr: "",
  };
}

// ─── Validation (client-side) ──────────────────────────────────────────────

function validateSystem(sys: SystemData): Record<string, string> {
  const errors: Record<string, string> = {};

  // name
  if (!sys.name || sys.name.trim().length === 0) {
    errors.name = "System name is required";
  }

  // waterSource
  const wsResult = WaterSource.safeParse(sys.waterSource);
  if (!wsResult.success) {
    errors.waterSource = "Select a water source";
  }

  // qualityBand
  const qbResult = QualityBand.safeParse(sys.qualityBand);
  if (!qbResult.success) {
    errors.qualityBand = "Select a quality band";
  }

  // totalVolumeM3
  const vol = parseFloat(sys.totalVolumeM3);
  if (isNaN(vol) || vol <= 0) {
    errors.totalVolumeM3 = "Volume must be a positive number";
  }

  // turnoversPerDay
  const turnovers = parseFloat(sys.turnoversPerDay);
  if (isNaN(turnovers) || turnovers <= 0 || !Number.isInteger(turnovers)) {
    errors.turnoversPerDay = "Must be a positive integer";
  }

  // operatingHoursPerDay
  const hours = parseFloat(sys.operatingHoursPerDay);
  if (isNaN(hours) || hours < 1 || hours > 24) {
    errors.operatingHoursPerDay = "Must be between 1 and 24";
  }

  // salinityPpt
  const salinity = parseFloat(sys.salinityPpt);
  if (isNaN(salinity) || salinity < 0 || salinity > 50) {
    errors.salinityPpt = "Must be between 0 and 50";
  }

  // targetPathogen
  const tpResult = TargetPathogen.safeParse(sys.targetPathogen);
  if (!tpResult.success) {
    errors.targetPathogen = "Select a target pathogen";
  }

  // species
  const spResult = Species.safeParse(sys.species);
  if (!spResult.success) {
    errors.species = "Select a species";
  }

  // systemType
  const stResult = SystemType.safeParse(sys.systemType);
  if (!stResult.success) {
    errors.systemType = "Select a system type";
  }

  // biomassDODemandM3Hr — optional; if provided, must be >= 0
  if (sys.biomassDODemandM3Hr !== "") {
    const bio = parseFloat(sys.biomassDODemandM3Hr);
    if (isNaN(bio) || bio < 0) {
      errors.biomassDODemandM3Hr = "Must be 0 or positive";
    }
  }

  return errors;
}

function buildHatcheryInput(
  name: string,
  mode: "aggregate" | "multi_system",
  systems: SystemData[]
): z.infer<typeof HatcheryInput> {
  return {
    mode,
    name,
    systems: systems.map((s) => ({
      name: s.name,
      waterSource: s.waterSource as z.infer<typeof WaterSource>,
      qualityBand: s.qualityBand as z.infer<typeof QualityBand>,
      totalVolumeM3: parseFloat(s.totalVolumeM3),
      turnoversPerDay: parseInt(s.turnoversPerDay, 10),
      operatingHoursPerDay: parseFloat(s.operatingHoursPerDay),
      salinityPpt: parseFloat(s.salinityPpt),
      targetPathogen: s.targetPathogen as z.infer<typeof TargetPathogen>,
      species: s.species as z.infer<typeof Species>,
      systemType: s.systemType as z.infer<typeof SystemType>,
      ...(s.biomassDODemandM3Hr !== ""
        ? { biomassDODemandM3Hr: parseFloat(s.biomassDODemandM3Hr) }
        : {}),
    })),
  };
}

// ─── Store Types ───────────────────────────────────────────────────────────

interface FormState {
  // UI
  activeStep: number;
  activeSystemIndex: number;

  // Form data
  hatcheryName: string;
  mode: "aggregate" | "multi_system";
  systems: SystemData[];

  // Validation
  fieldErrors: Record<string, string>;
  isValid: boolean;

  // Results
  recommendation: HatcheryRecommendation | null;
  isComputing: boolean;
  computeError: string | null;

  // Biomass DO defaults cache (client-side fetch from API)
  biomassDefaults: Record<string, number>; // key: "species|systemType"

  // Proposal modal
  proposalOpen: boolean;

  // Budgetary estimate toggle
  budgetaryEstimateEnabled: boolean;
  toggleBudgetaryEstimate: () => void;

  // Actions
  setActiveStep: (step: number) => void;
  setActiveSystemIndex: (index: number) => void;
  updateField: (path: string, value: string) => void;
  addSystem: () => void;
  removeSystem: (index: number) => void;
  renameSystem: (index: number, name: string) => void;
  setMode: (mode: "aggregate" | "multi_system") => void;
  setHatcheryName: (name: string) => void;
  triggerCompute: () => Promise<void>;
  setProposalOpen: (open: boolean) => void;
  fetchBiomassDefault: (
    species: string,
    systemType: string
  ) => Promise<void>;
}

// ─── Debounce & compute helpers ────────────────────────────────────────────

let computeTimeout: ReturnType<typeof setTimeout> | null = null;
const COMPUTE_DEBOUNCE_MS = 300;

// ─── Store ─────────────────────────────────────────────────────────────────

export const useStore = create<FormState>((set, get) => ({
  activeStep: 1,
  activeSystemIndex: 0,
  hatcheryName: "",
  mode: "aggregate",
  systems: [{ ...emptySystem(), name: "System 1" }],
  fieldErrors: {},
  isValid: false,
  recommendation: null,
  isComputing: false,
  computeError: null,
  biomassDefaults: {},
  proposalOpen: false,
  budgetaryEstimateEnabled: false,

  setActiveStep: (step) => set({ activeStep: Math.max(1, Math.min(5, step)) }),

  setActiveSystemIndex: (index) => set({ activeSystemIndex: index }),

  updateField: (path, value) => {
    // path is like "systems.0.totalVolumeM3" or "hatcheryName"
    const parts = path.split(".");
    set((state) => {
      if (parts[0] === "systems") {
        const idx = parseInt(parts[1], 10);
        const field = parts[2];
        const newSystems = [...state.systems];
        newSystems[idx] = { ...newSystems[idx], [field]: value };
        return { systems: newSystems };
      } else if (parts[0] === "hatcheryName") {
        return { hatcheryName: value };
      }
      return {};
    });

    // Run validation after 200ms for text/number, immediate rebuild of errors
    validateAndSchedule();
  },

  addSystem: () =>
    set((state) => ({
      systems: [
        ...state.systems,
        { ...emptySystem(), name: `System ${state.systems.length + 1}` },
      ],
    })),

  removeSystem: (index) =>
    set((state) => {
      if (state.systems.length <= 1) return state;
      const newSystems = state.systems.filter((_, i) => i !== index);
      return {
        systems: newSystems,
        activeSystemIndex: Math.min(
          state.activeSystemIndex,
          newSystems.length - 1
        ),
      };
    }),

  renameSystem: (index, name) =>
    set((state) => {
      const newSystems = [...state.systems];
      newSystems[index] = { ...newSystems[index], name };
      return { systems: newSystems };
    }),

  setMode: (mode) =>
    set((state) => {
      if (mode === state.mode) return state;
      if (mode === "multi_system") {
        // Switch from aggregate → multi: create one empty system
        return {
          mode: "multi_system" as const,
          systems: [{ ...emptySystem(), name: "System 1" }],
          activeSystemIndex: 0,
          recommendation: null,
          isValid: false,
        };
      }
      // Switch from multi → aggregate: keep first system, discard rest
      return {
        mode: "aggregate" as const,
        systems: [state.systems[0]],
        activeSystemIndex: 0,
        recommendation: null,
        isValid: false,
      };
    }),

  setHatcheryName: (name) => set({ hatcheryName: name }),

  triggerCompute: async () => {
    const state = get();
    if (state.isComputing) return;

    set({ isComputing: true, computeError: null });

    try {
      const hatcheryInput = buildHatcheryInput(
        state.hatcheryName,
        state.mode,
        state.systems
      );

      const resp = await fetch("/api/size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hatcheryInput),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Computation failed");
      }

      const recommendation: HatcheryRecommendation = await resp.json();
      set({ recommendation, isComputing: false });
    } catch (e: any) {
      set({
        computeError: e.message || "Unknown error",
        isComputing: false,
        recommendation: null,
      });
    }
  },

  setProposalOpen: (open) => set({ proposalOpen: open }),

  toggleBudgetaryEstimate: () =>
    set((state) => ({ budgetaryEstimateEnabled: !state.budgetaryEstimateEnabled })),

  fetchBiomassDefault: async (species, systemType) => {
    if (!species || !systemType) return;
    const key = `${species}|${systemType}`;
    if (get().biomassDefaults[key] !== undefined) return;

    try {
      const resp = await fetch(
        `/api/defaults?species=${species}&systemType=${systemType}`
      );
      if (resp.ok) {
        const data = await resp.json();
        set((state) => ({
          biomassDefaults: {
            ...state.biomassDefaults,
            [key]: data.defaultDODemandM3Hr,
          },
        }));
      }
    } catch {
      // silently fail; placeholder will just show nothing
    }
  },
}));

// ─── Internal: validate all systems and schedule compute ───────────────────

function validateAndSchedule() {
  // Clear previous timeout
  if (computeTimeout) clearTimeout(computeTimeout);

  // Quick sync validation
  const state = useStore.getState();
  const errors: Record<string, string> = {};
  let allValid = true;

  if (!state.hatcheryName || state.hatcheryName.trim().length === 0) {
    errors["hatcheryName"] = "Hatchery name is required";
    allValid = false;
  }

  for (let i = 0; i < state.systems.length; i++) {
    const sysErrors = validateSystem(state.systems[i]);
    for (const [field, msg] of Object.entries(sysErrors)) {
      errors[`systems.${i}.${field}`] = msg;
    }
    if (Object.keys(sysErrors).length > 0) allValid = false;
  }

  const isValid =
    allValid &&
    state.hatcheryName.trim().length > 0 &&
    (state.mode === "aggregate"
      ? state.systems.length === 1
      : state.systems.length >= 1);

  useStore.setState({ fieldErrors: errors, isValid });

  // Schedule debounced compute if valid
  if (isValid) {
    computeTimeout = setTimeout(() => {
      useStore.getState().triggerCompute();
    }, COMPUTE_DEBOUNCE_MS);
  }
}
