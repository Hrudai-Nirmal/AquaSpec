import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "../persistence";
import type { DraftData } from "../persistence";

function wipeDB(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("aquaspec-drafts");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

function makeDraft(): DraftData {
  return {
    schemaVersion: 1,
    hatcheryName: "Example Company",
    fullName: "Ada Lovelace",
    emailAddress: "ada@example.com",
    phoneCountryCode: "+91",
    phoneNumber: "9876543210",
    location: "Chennai, Tamil Nadu, India",
    mode: "aggregate",
    activeStep: 1,
    activeSystemIndex: 0,
    systems: [
      {
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
      },
    ],
  };
}

beforeEach(async () => {
  await wipeDB();
});

afterEach(async () => {
  await clearDraft();
  await wipeDB();
});

describe("draft contact fields", () => {
  it("persists contact metadata alongside the existing wizard draft", async () => {
    const draft = makeDraft();

    await saveDraft(draft);
    const loaded = await loadDraft();

    expect(loaded).not.toBeNull();
    expect(loaded!.fullName).toBe("Ada Lovelace");
    expect(loaded!.emailAddress).toBe("ada@example.com");
    expect(loaded!.phoneCountryCode).toBe("+91");
    expect(loaded!.phoneNumber).toBe("9876543210");
    expect(loaded!.location).toBe("Chennai, Tamil Nadu, India");
    expect(loaded!.hatcheryName).toBe("Example Company");
  });
});
