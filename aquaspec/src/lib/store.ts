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
import {
  saveDraft,
  loadDraft,
  clearDraft as clearPersistenceDraft,
  type DraftData,
} from "./persistence";
import {
  saveConfig as saveConfigToDB,
  loadConfig as loadConfigFromDB,
  listConfigs as listConfigsFromDB,
  deleteConfig as deleteConfigFromDB,
  type ConfigRecord,
} from "./config-persistence";
import rulesData from "@/data/sizing-rules.json";

const CURRENT_RULES_VERSION = rulesData.version;

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

// ─── Stale detection helper ────────────────────────────────────────────────

/** Pristine snapshot of the loaded config's input for stale-edit detection. */
let pristineInput: z.infer<typeof HatcheryInput> | null = null;

function setPristine(input: z.infer<typeof HatcheryInput>): void {
  pristineInput = input;
}

function isDirty(): boolean {
  if (pristineInput === null) return false;
  const state = useStore.getState();
  const current = buildHatcheryInput(state.hatcheryName, state.mode, state.systems);
  return JSON.stringify(current) !== JSON.stringify(pristineInput);
}

// ─── Store Types ───────────────────────────────────────────────────────────

interface FormState {
  // UI
  activeStep: number;
  activeSystemIndex: number;

  // Hydration
  isHydrated: boolean;

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

  // Saved configs
  activeConfigId: string | null;
  configs: ConfigRecord[];
  configsLoaded: boolean;

  // Banners
  showVersionMismatchBanner: boolean;
  showStaleEditsBanner: boolean;

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
  clearDraft: () => Promise<void>;

  // Config actions
  loadConfig: (id: string) => Promise<void>;
  saveConfig: (name: string) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  loadConfigsList: () => Promise<void>;
}

// ─── Debounce & compute helpers ────────────────────────────────────────────

let computeTimeout: ReturnType<typeof setTimeout> | null = null;
const COMPUTE_DEBOUNCE_MS = 300;

// ─── Store ─────────────────────────────────────────────────────────────────

export const useStore = create<FormState>((set, get) => ({
  activeStep: 1,
  activeSystemIndex: 0,
  isHydrated: false,
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

  // Saved configs defaults
  activeConfigId: null,
  configs: [],
  configsLoaded: false,

  // Banners defaults
  showVersionMismatchBanner: false,
  showStaleEditsBanner: false,

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

    // Stale detection: if an active config is loaded and form is dirty, show banner
    if (get().activeConfigId !== null && isDirty()) {
      set({ showStaleEditsBanner: true });
    }

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

      // After successful compute: hide banners and auto-save loaded config
      const currentState = get();
      if (currentState.activeConfigId !== null) {
        // Hide both banners
        set({
          showVersionMismatchBanner: false,
          showStaleEditsBanner: false,
        });

        // Auto-save updated results + rules version to IndexedDB
        const config = await loadConfigFromDB(currentState.activeConfigId);
        if (config) {
          config.recommendation = recommendation;
          config.rulesVersionAtSave = CURRENT_RULES_VERSION;
          config.savedAt = new Date().toISOString();
          await saveConfigToDB(config);

          // Update pristine snapshot
          setPristine(hatcheryInput);

          // Refresh configs list
          await listConfigsFromDB().then((configs) =>
            set({ configs, configsLoaded: true })
          );
        }
      }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Unknown error";
      set({
        computeError: message,
        isComputing: false,
        recommendation: null,
      });
    }
  },

  setProposalOpen: (open) => set({ proposalOpen: open }),

  toggleBudgetaryEstimate: () =>
    set((state) => ({
      budgetaryEstimateEnabled: !state.budgetaryEstimateEnabled,
    })),

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

  clearDraft: async () => {
    // Delete from IndexedDB
    await clearPersistenceDraft();

    // Reset store to default empty state
    set({
      hatcheryName: "",
      mode: "aggregate",
      activeStep: 1,
      activeSystemIndex: 0,
      systems: [{ ...emptySystem(), name: "System 1" }],
      fieldErrors: {},
      isValid: false,
      recommendation: null,
      isComputing: false,
      computeError: null,
      proposalOpen: false,
      activeConfigId: null,
      showVersionMismatchBanner: false,
      showStaleEditsBanner: false,
    });
    pristineInput = null;
  },

  // ─── Config Actions ────────────────────────────────────────────────────

  loadConfig: async (id: string) => {
    const state = get();

    // If already loaded, no-op
    if (state.activeConfigId === id) return;

    // The UI should handle unsaved-work dialog before calling this.
    // This function assumes the caller has already resolved unsaved work.

    const config = await loadConfigFromDB(id);
    if (!config) return;

    // Populate form fields from config.input
    const systems: SystemData[] = config.input.systems.map((sys) => ({
      name: sys.name,
      waterSource: sys.waterSource,
      qualityBand: sys.qualityBand,
      totalVolumeM3: String(sys.totalVolumeM3),
      turnoversPerDay: String(sys.turnoversPerDay),
      operatingHoursPerDay: String(sys.operatingHoursPerDay),
      salinityPpt: String(sys.salinityPpt),
      targetPathogen: sys.targetPathogen,
      species: sys.species,
      systemType: sys.systemType,
      biomassDODemandM3Hr:
        sys.biomassDODemandM3Hr !== undefined
          ? String(sys.biomassDODemandM3Hr)
          : "",
    }));

    // Check version mismatch
    const versionMismatch =
      config.rulesVersionAtSave !== CURRENT_RULES_VERSION;

    set({
      activeConfigId: config.id,
      hatcheryName: config.input.name,
      mode: config.input.mode,
      systems,
      activeStep: 1,
      activeSystemIndex: 0,
      fieldErrors: {},
      isValid: true,
      recommendation: config.recommendation,
      budgetaryEstimateEnabled: config.includeBudgetaryEstimate,
      isComputing: false,
      computeError: null,
      showVersionMismatchBanner: versionMismatch,
      showStaleEditsBanner: false,
    });

    // Set pristine snapshot for stale-edit detection
    setPristine(buildHatcheryInput(config.input.name, config.input.mode, systems));
  },

  saveConfig: async (name: string) => {
    const state = get();

    if (!state.recommendation) {
      throw new Error("Cannot save without computed results");
    }

    const hatcheryInput = buildHatcheryInput(
      state.hatcheryName,
      state.mode,
      state.systems
    );

    const configId =
      state.activeConfigId ?? crypto.randomUUID();

    const config: ConfigRecord = {
      id: configId,
      name,
      savedAt: new Date().toISOString(),
      input: hatcheryInput,
      recommendation: state.recommendation,
      rulesVersionAtSave: CURRENT_RULES_VERSION,
      includeBudgetaryEstimate: state.budgetaryEstimateEnabled,
    };

    await saveConfigToDB(config);

    set({
      activeConfigId: configId,
      showVersionMismatchBanner: false,
      showStaleEditsBanner: false,
    });

    setPristine(hatcheryInput);

    // Refresh configs list
    await get().loadConfigsList();
  },

  deleteConfig: async (id: string) => {
    await deleteConfigFromDB(id);

    // If the deleted config was the active one, reset state
    if (get().activeConfigId === id) {
      await clearPersistenceDraft();
      set({
        hatcheryName: "",
        mode: "aggregate",
        activeStep: 1,
        activeSystemIndex: 0,
        systems: [{ ...emptySystem(), name: "System 1" }],
        fieldErrors: {},
        isValid: false,
        recommendation: null,
        isComputing: false,
        computeError: null,
        proposalOpen: false,
        activeConfigId: null,
        showVersionMismatchBanner: false,
        showStaleEditsBanner: false,
      });
      pristineInput = null;
    }

    // Refresh configs list
    await get().loadConfigsList();
  },

  loadConfigsList: async () => {
    const configs = await listConfigsFromDB();
    set({ configs, configsLoaded: true });
  },
}));

// ─── Persistence: debounced auto-save via subscribe ────────────────────────

let persistTimeout: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 500;

/** Extract only the persistable subset from the store state */
function extractDraftData(state: FormState): DraftData {
  return {
    schemaVersion: 1,
    hatcheryName: state.hatcheryName,
    mode: state.mode,
    activeStep: state.activeStep,
    activeSystemIndex: state.activeSystemIndex,
    systems: state.systems.map((s) => ({
      name: s.name,
      waterSource: s.waterSource,
      qualityBand: s.qualityBand,
      totalVolumeM3: s.totalVolumeM3,
      turnoversPerDay: s.turnoversPerDay,
      operatingHoursPerDay: s.operatingHoursPerDay,
      salinityPpt: s.salinityPpt,
      targetPathogen: s.targetPathogen,
      species: s.species,
      systemType: s.systemType,
      biomassDODemandM3Hr: s.biomassDODemandM3Hr,
    })),
  };
}

// Subscribe to all state changes for auto-persist
useStore.subscribe((state) => {
  // Only persist after hydration is complete
  if (!state.isHydrated) return;

  // Debounce writes (independent of compute debounce)
  if (persistTimeout) clearTimeout(persistTimeout);

  persistTimeout = setTimeout(() => {
    const current = useStore.getState();
    // Guard again in case hydration was flipped between timer set and fire
    if (!current.isHydrated) return;
    saveDraft(extractDraftData(current));
  }, PERSIST_DEBOUNCE_MS);
});

// ─── Hydration: load draft + configs list from IndexedDB on init ──────────

// Kick off async hydration immediately (non-blocking)
(async () => {
  try {
    const draft = await loadDraft();

    if (draft) {
      // Restore form state from draft
      useStore.setState({
        hatcheryName: draft.hatcheryName,
        mode: draft.mode,
        activeStep: draft.activeStep,
        activeSystemIndex: draft.activeSystemIndex,
        systems: draft.systems.map((s) => ({
          name: s.name,
          waterSource: s.waterSource,
          qualityBand: s.qualityBand,
          totalVolumeM3: s.totalVolumeM3,
          turnoversPerDay: s.turnoversPerDay,
          operatingHoursPerDay: s.operatingHoursPerDay,
          salinityPpt: s.salinityPpt,
          targetPathogen: s.targetPathogen,
          species: s.species,
          systemType: s.systemType,
          biomassDODemandM3Hr: s.biomassDODemandM3Hr,
        })),
      });
    }

    // Mark hydration complete
    useStore.setState({ isHydrated: true });

    // Load configs list after hydration
    const configs = await listConfigsFromDB();
    useStore.setState({ configs, configsLoaded: true });

    // If a draft was restored, trigger validation + debounced compute
    if (draft) {
      validateAndSchedule();
    }
  } catch {
    // If hydration fails for any reason, proceed with defaults
    useStore.setState({ isHydrated: true, configsLoaded: true });
  }
})();

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
