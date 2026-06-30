/**
 * AquaSpec — Config Persistence Module Tests
 *
 * Tests for IndexedDB saved configuration persistence wrapper.
 * Requires jsdom environment (IndexedDB with fake-indexeddb).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  saveConfig,
  loadConfig,
  listConfigs,
  deleteConfig,
} from "../config-persistence";
import type { ConfigRecord } from "../config-persistence";
import type {
  HatcheryInput,
  HatcheryRecommendation,
} from "../sizing-engine/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Clean IndexedDB between tests */
function wipeDB(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("aquaspec-configs");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      resolve();
    };
  });
}

/** Minimal valid HatcheryInput for testing */
function makeInput(overrides: Partial<HatcheryInput> = {}): HatcheryInput {
  return {
    mode: "aggregate",
    name: "Test Hatchery",
    systems: [
      {
        name: "System 1",
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: 100,
        turnoversPerDay: 4,
        operatingHoursPerDay: 8,
        salinityPpt: 30,
        targetPathogen: "general_disinfection",
        species: "vannamei",
        systemType: "larval_rearing",
      },
    ],
    ...overrides,
  };
}

/** Minimal valid HatcheryRecommendation for testing */
function makeRecommendation(
  overrides: Partial<HatcheryRecommendation> = {}
): HatcheryRecommendation {
  return {
    hatcheryName: "Test Hatchery",
    mode: "aggregate",
    rulesVersion: "1.0.0",
    computedAt: new Date().toISOString(),
    systems: [
      {
        systemName: "System 1",
        flowRate: {
          flowRateM3Hr: 50,
          inputs: {
            totalVolumeM3: 100,
            turnoversPerDay: 4,
            operatingHoursPerDay: 8,
          },
        },
        ozoneDemand: {
          ozoneDemandGHr: 75,
          doseRateGM3: 1.5,
          conditionMultiplier: 1.0,
          flowRateM3Hr: 50,
        },
        uvSizing: {
          selectedModel: "LTU-T-100",
          parallelUnits: 1,
          ratedFlowPerUnitM3Hr: 100,
          requiredFlowM3Hr: 50,
        },
        oxygenDemand: {
          ozoneFeedRequirementM3Hr: 3,
          biomassDODemandM3Hr: 2,
          totalOxygenDemandM3Hr: 5,
          selectedModel: "LTX-10",
        },
        ozoneGeneratorModel: "LT-G-4",
      },
    ],
    ...overrides,
  };
}

/** Create a ConfigRecord with defaults */
function makeConfig(overrides: Partial<ConfigRecord> = {}): ConfigRecord {
  return {
    id: crypto.randomUUID(),
    name: "Test Config",
    savedAt: new Date().toISOString(),
    input: makeInput(),
    recommendation: makeRecommendation(),
    rulesVersionAtSave: "1.0.0",
    includeBudgetaryEstimate: false,
    ...overrides,
  };
}

beforeEach(async () => {
  await wipeDB();
});

afterEach(async () => {
  await wipeDB();
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("saveConfig + loadConfig round-trip", () => {
  it("saves and loads a configuration correctly", async () => {
    const config = makeConfig({ name: "Coastal Hatchery" });
    await saveConfig(config);

    const loaded = await loadConfig(config.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(config.id);
    expect(loaded!.name).toBe("Coastal Hatchery");
    expect(loaded!.rulesVersionAtSave).toBe("1.0.0");
    expect(loaded!.includeBudgetaryEstimate).toBe(false);
    expect(loaded!.input.name).toBe("Test Hatchery");
    expect(loaded!.input.systems).toHaveLength(1);
    expect(loaded!.input.systems[0].totalVolumeM3).toBe(100);
    expect(loaded!.recommendation.systems).toHaveLength(1);
    expect(loaded!.recommendation.systems[0].ozoneGeneratorModel).toBe(
      "LT-G-4"
    );
  });

  it("persists all input and recommendation fields faithfully", async () => {
    const config = makeConfig({
      name: "Full Config",
      rulesVersionAtSave: "0.9.0",
      includeBudgetaryEstimate: true,
      input: makeInput({
        name: "Multi Hatchery",
        mode: "multi_system",
        systems: [
          {
            name: "Larval",
            waterSource: "freshwater",
            qualityBand: "moderate",
            totalVolumeM3: 200,
            turnoversPerDay: 6,
            operatingHoursPerDay: 12,
            salinityPpt: 5,
            targetPathogen: "vibrio",
            species: "monodon",
            systemType: "broodstock",
            biomassDODemandM3Hr: 10,
          },
        ],
      }),
    });

    await saveConfig(config);
    const loaded = await loadConfig(config.id);

    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Full Config");
    expect(loaded!.rulesVersionAtSave).toBe("0.9.0");
    expect(loaded!.includeBudgetaryEstimate).toBe(true);
    expect(loaded!.input.mode).toBe("multi_system");
    expect(loaded!.input.systems[0].name).toBe("Larval");
    expect(loaded!.input.systems[0].waterSource).toBe("freshwater");
    expect(loaded!.input.systems[0].qualityBand).toBe("moderate");
    expect(loaded!.input.systems[0].totalVolumeM3).toBe(200);
    expect(loaded!.input.systems[0].turnoversPerDay).toBe(6);
    expect(loaded!.input.systems[0].operatingHoursPerDay).toBe(12);
    expect(loaded!.input.systems[0].salinityPpt).toBe(5);
    expect(loaded!.input.systems[0].targetPathogen).toBe("vibrio");
    expect(loaded!.input.systems[0].species).toBe("monodon");
    expect(loaded!.input.systems[0].systemType).toBe("broodstock");
    expect(loaded!.input.systems[0].biomassDODemandM3Hr).toBe(10);
  });

  it("saves multiple configs and loads each independently", async () => {
    const configA = makeConfig({ name: "Config A" });
    const configB = makeConfig({ name: "Config B" });
    const configC = makeConfig({ name: "Config C" });

    await saveConfig(configA);
    await saveConfig(configB);
    await saveConfig(configC);

    const loadedA = await loadConfig(configA.id);
    const loadedB = await loadConfig(configB.id);
    const loadedC = await loadConfig(configC.id);

    expect(loadedA!.name).toBe("Config A");
    expect(loadedB!.name).toBe("Config B");
    expect(loadedC!.name).toBe("Config C");
  });
});

describe("listConfigs", () => {
  it("returns an empty array when no configs exist", async () => {
    const configs = await listConfigs();
    expect(configs).toEqual([]);
  });

  it("returns all saved configs sorted by savedAt descending", async () => {
    const older = makeConfig({
      name: "Older Config",
      savedAt: "2026-01-01T00:00:00.000Z",
    });
    const newer = makeConfig({
      name: "Newer Config",
      savedAt: "2026-07-01T00:00:00.000Z",
    });
    const middle = makeConfig({
      name: "Middle Config",
      savedAt: "2026-04-01T00:00:00.000Z",
    });

    await saveConfig(older);
    await saveConfig(newer);
    await saveConfig(middle);

    const configs = await listConfigs();
    expect(configs).toHaveLength(3);
    expect(configs[0].name).toBe("Newer Config");
    expect(configs[1].name).toBe("Middle Config");
    expect(configs[2].name).toBe("Older Config");
  });

  it("returns configs with all fields populated", async () => {
    const config = makeConfig();
    await saveConfig(config);

    const configs = await listConfigs();
    expect(configs).toHaveLength(1);
    const c = configs[0];
    expect(c.id).toBe(config.id);
    expect(c.name).toBe(config.name);
    expect(typeof c.savedAt).toBe("string");
    expect(c.input).toBeDefined();
    expect(c.recommendation).toBeDefined();
    expect(c.rulesVersionAtSave).toBeDefined();
    expect(typeof c.includeBudgetaryEstimate).toBe("boolean");
  });
});

describe("loadConfig when no config exists", () => {
  it("returns null when IndexedDB is empty", async () => {
    const result = await loadConfig("nonexistent-id");
    expect(result).toBeNull();
  });

  it("returns null for a non-existent id when other configs exist", async () => {
    const config = makeConfig();
    await saveConfig(config);

    const result = await loadConfig("nonexistent-id");
    expect(result).toBeNull();
  });
});

describe("deleteConfig", () => {
  it("deletes a configuration from IndexedDB", async () => {
    const config = makeConfig();
    await saveConfig(config);

    // Verify it exists
    const before = await loadConfig(config.id);
    expect(before).not.toBeNull();

    // Delete
    await deleteConfig(config.id);

    // Verify gone
    const after = await loadConfig(config.id);
    expect(after).toBeNull();
  });

  it("does not affect other configs when deleting one", async () => {
    const configA = makeConfig({ name: "A" });
    const configB = makeConfig({ name: "B" });

    await saveConfig(configA);
    await saveConfig(configB);

    await deleteConfig(configA.id);

    const configs = await listConfigs();
    expect(configs).toHaveLength(1);
    expect(configs[0].name).toBe("B");
  });

  it("is a no-op when config does not exist (does not throw)", async () => {
    await expect(deleteConfig("nonexistent-id")).resolves.toBeUndefined();
  });
});

describe("saveConfig: overwrites on re-save", () => {
  it("updates an existing config when saved with the same id", async () => {
    const config = makeConfig({ name: "Original" });
    await saveConfig(config);

    // Update and re-save
    const updated = {
      ...config,
      name: "Updated",
      rulesVersionAtSave: "2.0.0",
      savedAt: "2026-08-01T00:00:00.000Z",
      includeBudgetaryEstimate: true,
    };
    await saveConfig(updated);

    const loaded = await loadConfig(config.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Updated");
    expect(loaded!.rulesVersionAtSave).toBe("2.0.0");
    expect(loaded!.savedAt).toBe("2026-08-01T00:00:00.000Z");
    expect(loaded!.includeBudgetaryEstimate).toBe(true);

    // Ensure only one record exists
    const configs = await listConfigs();
    expect(configs).toHaveLength(1);
  });
});
