/**
 * Store compute tests cover failure paths that would otherwise leave the
 * wizard in an indeterminate loading state.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore, COMPUTE_TIMEOUT_MS } from "../store";

const originalFetch = globalThis.fetch;

function setValidWizardState() {
  useStore.setState({
    hatcheryName: "Lotus Ozone",
    fullName: "Alex Rivers",
    emailAddress: "alex@lotusozone.com",
    phoneCountryCode: "+91",
    phoneNumber: "9876543210",
    location: "Chennai, Tamil Nadu, India",
    mode: "aggregate",
    systems: [
      {
        name: "System 1",
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: "100",
        turnoversPerDay: "4",
        operatingHoursPerDay: "12",
        salinityPpt: "30",
        targetPathogen: "vibrio",
        species: "vannamei",
        systemType: "larval_rearing",
        biomassDODemandM3Hr: "",
      },
    ],
    isValid: true,
    isComputing: false,
    computeError: null,
    recommendation: null,
  });
}

describe("store compute", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setValidWizardState();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("clears the loading state when the sizing request never resolves", async () => {
    globalThis.fetch = vi.fn(
      () => new Promise<Response>(() => undefined)
    ) as typeof fetch;

    void useStore.getState().triggerCompute();

    expect(useStore.getState().isComputing).toBe(true);

    await vi.advanceTimersByTimeAsync(COMPUTE_TIMEOUT_MS + 1);

    expect(useStore.getState().isComputing).toBe(false);
    expect(useStore.getState().computeError).toBe(
      "Sizing request timed out. Please try again."
    );
  });
});
