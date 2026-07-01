import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HatcheryRecommendation } from "@/lib/sizing-engine/types";
import { WizardContainer } from "./WizardContainer";

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
  activeStep: 1,
  isHydrated: true,
  clearDraft: vi.fn(async () => {}),
  recommendation: null as HatcheryRecommendation | null,
};

vi.mock("@/lib/store", () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

vi.mock("./StepIndicator", () => ({
  StepIndicator: () => <div data-testid="step-indicator" />,
}));

vi.mock("./Step1Identity", () => ({
  Step1Identity: () => <div>Step 1</div>,
}));

vi.mock("./Step2WaterProfile", () => ({
  Step2WaterProfile: () => <div>Step 2</div>,
}));

vi.mock("./Step3Hydraulics", () => ({
  Step3Hydraulics: () => <div>Step 3</div>,
}));

vi.mock("./Step4Disinfection", () => ({
  Step4Disinfection: () => <div>Step 4</div>,
}));

vi.mock("./Step5Review", () => ({
  Step5Review: () => <div>Step 5</div>,
}));

vi.mock("@/components/results/ResultsPanel", () => ({
  ResultsPanel: () => <div data-testid="results-panel" />,
}));

vi.mock("@/components/proposal/ProposalPreview", () => ({
  ProposalPreview: () => null,
}));

vi.mock("@/components/configs/SavedConfigsSidebar", () => ({
  SavedConfigsSidebar: () => null,
}));

describe("WizardContainer", () => {
  beforeEach(() => {
    mockStoreState.activeStep = 1;
    mockStoreState.isHydrated = true;
    mockStoreState.recommendation = null;
    mockStoreState.clearDraft.mockClear();
  });

  it("only mounts the desktop results panel when recommendations exist", () => {
    const incompleteMarkup = renderToStaticMarkup(<WizardContainer />);
    const incompletePanelCount =
      incompleteMarkup.match(/data-testid="results-panel"/g)?.length ?? 0;

    expect(incompletePanelCount).toBe(1);
    expect(incompleteMarkup).toContain("LotusOzoneLogo.png");
    expect(incompleteMarkup).toContain("Direct Call");
    expect(incompleteMarkup).toContain("WhatsApp");
    expect(incompleteMarkup).toContain("What happens next?");
    expect(incompleteMarkup).toContain("Prefer to Speak Directly?");

    mockStoreState.recommendation = mockRecommendation;

    const readyMarkup = renderToStaticMarkup(<WizardContainer />);
    const readyPanelCount =
      readyMarkup.match(/data-testid="results-panel"/g)?.length ?? 0;

    expect(readyPanelCount).toBe(2);
    expect(readyMarkup).toContain("animate-slide-in-right");
    expect(readyMarkup).toContain("Submit Quote Request");
  });
});
