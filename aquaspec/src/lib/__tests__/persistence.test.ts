/**
 * AquaSpec — Persistence Module Tests
 *
 * Tests for IndexedDB draft persistence wrapper.
 * Requires jsdom environment (IndexedDB).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { saveDraft, loadDraft, clearDraft } from "../persistence";
import type { DraftData, DraftSystemData } from "../persistence";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Clean IndexedDB between tests */
function wipeDB(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("aquaspec-drafts");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      // Close any open connections if blocked
      resolve();
    };
  });
}

function makeDraftSystem(overrides: Partial<DraftSystemData> = {}): DraftSystemData {
  return {
    name: "System 1",
    waterSource: "seawater",
    qualityBand: "good",
    totalVolumeM3: "100",
    turnoversPerDay: "4",
    operatingHoursPerDay: "8",
    salinityPpt: "30",
    targetPathogen: "general_disinfection",
    species: "vannamei",
    systemType: "larval_rearing",
    biomassDODemandM3Hr: "",
    ...overrides,
  };
}

function makeDraft(overrides: Partial<DraftData> = {}): DraftData {
  return {
    schemaVersion: 1,
    hatcheryName: "Test Hatchery",
    fullName: "Test Person",
    emailAddress: "test@example.com",
    phoneCountryCode: "+91",
    phoneNumber: "9876543210",
    location: "Chennai, Tamil Nadu, India",
    mode: "aggregate",
    activeStep: 3,
    activeSystemIndex: 0,
    systems: [makeDraftSystem()],
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

describe("saveDraft + loadDraft round-trip", () => {
  it("saves and loads a draft correctly", async () => {
    const draft = makeDraft();
    await saveDraft(draft);

    const loaded = await loadDraft();
    expect(loaded).not.toBeNull();
    expect(loaded!.schemaVersion).toBe(1);
    expect(loaded!.hatcheryName).toBe("Test Hatchery");
    expect(loaded!.fullName).toBe("Test Person");
    expect(loaded!.emailAddress).toBe("test@example.com");
    expect(loaded!.mode).toBe("aggregate");
    expect(loaded!.activeStep).toBe(3);
    expect(loaded!.activeSystemIndex).toBe(0);
    expect(loaded!.systems).toHaveLength(1);
    expect(loaded!.systems[0].name).toBe("System 1");
    expect(loaded!.systems[0].totalVolumeM3).toBe("100");
    expect(loaded!.systems[0].biomassDODemandM3Hr).toBe("");
  });

  it("persists all string fields as-is (no parsing, no validation)", async () => {
    const draft = makeDraft({
      hatcheryName: "  leading spaces  ",
      systems: [
        makeDraftSystem({
          totalVolumeM3: "not-a-number",
          salinityPpt: "-999",
        }),
      ],
    });

    await saveDraft(draft);
    const loaded = await loadDraft();

    expect(loaded!.hatcheryName).toBe("  leading spaces  ");
    expect(loaded!.systems[0].totalVolumeM3).toBe("not-a-number");
    expect(loaded!.systems[0].salinityPpt).toBe("-999");
  });

  it("handles multi-system drafts", async () => {
    const draft: DraftData = {
      schemaVersion: 1,
      hatcheryName: "Multi Hatchery",
      fullName: "Multi Contact",
      emailAddress: "multi@example.com",
      phoneCountryCode: "+91",
      phoneNumber: "9999999999",
      location: "Mumbai, Maharashtra, India",
      mode: "multi_system",
      activeStep: 2,
      activeSystemIndex: 1,
      systems: [
        makeDraftSystem({ name: "Larval Rearing" }),
        makeDraftSystem({ name: "Broodstock", waterSource: "freshwater" }),
        makeDraftSystem({ name: "Algae Culture", waterSource: "borewell" }),
      ],
    };

    await saveDraft(draft);
    const loaded = await loadDraft();

    expect(loaded).not.toBeNull();
    expect(loaded!.mode).toBe("multi_system");
    expect(loaded!.systems).toHaveLength(3);
    expect(loaded!.systems[0].name).toBe("Larval Rearing");
    expect(loaded!.systems[1].name).toBe("Broodstock");
    expect(loaded!.systems[2].name).toBe("Algae Culture");
    expect(loaded!.activeSystemIndex).toBe(1);
  });
});

describe("loadDraft when no draft exists", () => {
  it("returns null when IndexedDB is empty", async () => {
    const result = await loadDraft();
    expect(result).toBeNull();
  });
});

describe("loadDraft schema version mismatch", () => {
  it("returns null for schema version 0 (non-existent version)", async () => {
    // Manually insert a record with wrong schema version
    // We need to use the raw IDB API to insert a record with schemaVersion !== 1
    const draft = makeDraft({ schemaVersion: 0 as number });
    await saveDraft(draft as DraftData); // This won't quite work since DraftData requires schemaVersion 1
    // Actually, TypeScript will complain. Let's test via a different approach.

    // We'll use raw IDB to insert a version-mismatch record
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("aquaspec-drafts", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("drafts", "readwrite");
        const store = tx.objectStore("drafts");
        store.put({ id: "current", schemaVersion: 2, hatcheryName: "Stale" });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });

    const result = await loadDraft();
    expect(result).toBeNull();
  });
});

describe("clearDraft", () => {
  it("deletes the draft from IndexedDB", async () => {
    // Save first
    const draft = makeDraft();
    await saveDraft(draft);

    // Verify it exists
    const before = await loadDraft();
    expect(before).not.toBeNull();

    // Clear
    await clearDraft();

    // Verify gone
    const after = await loadDraft();
    expect(after).toBeNull();
  });

  it("is a no-op when no draft exists (does not throw)", async () => {
    await expect(clearDraft()).resolves.toBeUndefined();
  });
});

describe("saveDraft: overwrites previous draft", () => {
  it("replaces the existing draft when saveDraft is called again", async () => {
    const draft1 = makeDraft({ hatcheryName: "First", activeStep: 1 });
    await saveDraft(draft1);

    const draft2 = makeDraft({ hatcheryName: "Second", activeStep: 5, mode: "multi_system" });
    await saveDraft(draft2);

    const loaded = await loadDraft();
    expect(loaded!.hatcheryName).toBe("Second");
    expect(loaded!.activeStep).toBe(5);
    expect(loaded!.mode).toBe("multi_system");
  });
});
