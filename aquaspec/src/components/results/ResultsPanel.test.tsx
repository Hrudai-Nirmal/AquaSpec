import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HatcheryRecommendation } from "@/lib/sizing-engine/types";
import { ResultsPanel } from "./ResultsPanel";

const mockRecommendation: HatcheryRecommendation = {
  hatcheryName: "Coastal Shrimp Hatchery",
  mode: "aggregate",
  rulesVersion: "2026-07-01",
  computedAt: "2026-07-01T00:00:00.000Z",
  systems: [
    {
      systemName: "System 1",
      flowRate: {
        flowRateM3Hr: 250,
        inputs: {
          totalVolumeM3: 500,
          turnoversPerDay: 6,
          operatingHoursPerDay: 12,
        },
      },
      ozoneDemand: {
        ozoneDemandGHr: 375,
        doseRateGM3: 1.5,
        conditionMultiplier: 1,
        flowRateM3Hr: 250,
      },
      uvSizing: {
        selectedModel: "LTU-T-100",
        parallelUnits: 2,
        ratedFlowPerUnitM3Hr: 150,
        requiredFlowM3Hr: 250,
      },
      oxygenDemand: {
        ozoneFeedRequirementM3Hr: 4,
        biomassDODemandM3Hr: 4,
        totalOxygenDemandM3Hr: 8,
        selectedModel: "LTX-10",
      },
      ozoneGeneratorModel: "LT-G-4",
    },
  ],
};

const mockStoreState = {
  recommendation: mockRecommendation,
  isComputing: false,
  computeError: null as string | null,
  isValid: true,
  mode: "aggregate" as const,
  fieldErrors: {},
  showVersionMismatchBanner: false,
  showStaleEditsBanner: false,
  triggerCompute: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

describe("ResultsPanel", () => {
  beforeEach(() => {
    mockStoreState.recommendation = mockRecommendation;
    mockStoreState.isComputing = false;
    mockStoreState.computeError = null;
    mockStoreState.isValid = true;
    mockStoreState.mode = "aggregate";
    mockStoreState.fieldErrors = {};
    mockStoreState.showVersionMismatchBanner = false;
    mockStoreState.showStaleEditsBanner = false;
  });

  it("renders branded result cards with cyan model tags and heading typography", () => {
    const markup = renderToStaticMarkup(<ResultsPanel />);

    expect(markup).toContain("bg-cyan-50 text-cyan-700 border-cyan-100");
    expect(markup).toContain("font-heading");
    expect(markup).toContain("Flow Rate");
    expect(markup).toContain("LT-G-4");
  });
});
