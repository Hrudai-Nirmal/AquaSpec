import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Step5Review } from "./Step5Review";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const mockStoreState = {
  hatcheryName: "Lotus Ozone",
  mode: "aggregate" as const,
  systems: [
    {
      name: "System 1",
      waterSource: "seawater",
      qualityBand: "good",
      salinityPpt: "30",
      totalVolumeM3: "100",
      turnoversPerDay: "4",
      operatingHoursPerDay: "12",
      targetPathogen: "vibrio",
      species: "vannamei",
      systemType: "larval_rearing",
      biomassDODemandM3Hr: "",
    },
  ],
  recommendation: null,
  isValid: true,
  isComputing: false,
  computeError: null as string | null,
  triggerCompute: vi.fn(async () => {
    mockStoreState.recommendation = {
      hatcheryName: "Lotus Ozone",
      mode: "aggregate",
      rulesVersion: "2026-07-01",
      computedAt: "2026-07-01T00:00:00.000Z",
      systems: [
        {
          systemName: "System 1",
          flowRate: {
            flowRateM3Hr: 25,
            inputs: {
              totalVolumeM3: 100,
              turnoversPerDay: 4,
              operatingHoursPerDay: 12,
            },
          },
          ozoneDemand: {
            ozoneDemandGHr: 30,
            doseRateGM3: 1.2,
            conditionMultiplier: 1,
            flowRateM3Hr: 25,
          },
          uvSizing: {
            selectedModel: "LTU-T-24",
            parallelUnits: 1,
            ratedFlowPerUnitM3Hr: 24,
            requiredFlowM3Hr: 25,
          },
          oxygenDemand: {
            ozoneFeedRequirementM3Hr: 1,
            biomassDODemandM3Hr: 0.5,
            totalOxygenDemandM3Hr: 1.5,
            selectedModel: "LTX-5",
          },
          ozoneGeneratorModel: "LT-30A",
        },
      ],
    };
  }),
  setProposalOpen: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useStore: Object.assign(
    (selector: (state: typeof mockStoreState) => unknown) =>
      selector(mockStoreState),
    {
      getState: () => mockStoreState,
    }
  ),
}));

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  mockStoreState.recommendation = null;
  mockStoreState.isComputing = false;
  mockStoreState.isValid = true;
  mockStoreState.computeError = null;
  mockStoreState.triggerCompute.mockClear();
  mockStoreState.setProposalOpen.mockClear();
  if (root) {
    act(() => {
      root?.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
});

describe("Step5Review", () => {
  it("computes results before opening the proposal when no recommendation exists yet", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(<Step5Review />);
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes("Generate Proposal")
    );

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockStoreState.triggerCompute).toHaveBeenCalled();
    expect(mockStoreState.setProposalOpen).toHaveBeenCalledWith(true);
  });

  it("does not auto-retry after a compute failure until the user explicitly retries", async () => {
    mockStoreState.computeError = "Sizing request timed out. Please try again.";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(<Step5Review />);
    });

    expect(mockStoreState.triggerCompute).not.toHaveBeenCalled();
  });
});
