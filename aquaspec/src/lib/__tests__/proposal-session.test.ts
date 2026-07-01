import { afterEach, describe, expect, it } from "vitest";
import {
  clearProposalSession,
  loadProposalSession,
  saveProposalSession,
} from "../proposal-session";
import type { ProposalSessionPayload } from "../proposal-session";

function makePayload(): ProposalSessionPayload {
  return {
    hatcheryName: "Lotus Ozone",
    includeBudgetary: false,
    recommendation: {
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
              turnoversPerDay: 3,
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
    },
    inputs: [
      {
        name: "System 1",
        waterSource: "seawater",
        qualityBand: "good",
        salinityPpt: 30,
        totalVolumeM3: 100,
        turnoversPerDay: 3,
        operatingHoursPerDay: 12,
        targetPathogen: "vibrio",
        species: "vannamei",
        systemType: "larval_rearing",
      },
    ],
  };
}

afterEach(() => {
  clearProposalSession();
});

describe("proposal-session", () => {
  it("persists a proposal payload for the preview route fallback", () => {
    const payload = makePayload();

    saveProposalSession(payload);

    expect(loadProposalSession()).toEqual(payload);
  });
});
