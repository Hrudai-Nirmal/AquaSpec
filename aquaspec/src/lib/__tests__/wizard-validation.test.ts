import { describe, expect, it } from "vitest";
import {
  getStepFieldErrors,
  isStepValid,
  type WizardValidationState,
} from "../wizard-validation";

function createState(
  overrides: Partial<WizardValidationState> = {}
): WizardValidationState {
  return {
    hatcheryName: "Lotus Ozone",
    fullName: "Alex Rivers",
    emailAddress: "alex@lotusozone.com",
    phoneCountryCode: "+91",
    phoneNumber: "+91 98765 43210",
    location: "Chennai, Tamil Nadu, India",
    mode: "aggregate",
    systems: [
      {
        name: "System 1",
        waterSource: "seawater",
        qualityBand: "good",
        totalVolumeM3: "500",
        turnoversPerDay: "4",
        operatingHoursPerDay: "12",
        salinityPpt: "28",
        targetPathogen: "vibrio",
        species: "vannamei",
        systemType: "larval_rearing",
        biomassDODemandM3Hr: "",
      },
    ],
    ...overrides,
  };
}

describe("wizard-validation", () => {
  it("flags the identity step when contact fields are incomplete", () => {
    const state = createState({ fullName: "", emailAddress: "" });

    expect(isStepValid(state, 1)).toBe(false);
    expect(getStepFieldErrors(state, 1)).toEqual(
      expect.objectContaining({
        fullName: "Full name is required",
        emailAddress: "Email address is required",
      })
    );
  });

  it("treats hydraulics as a separate valid section when only its fields are complete", () => {
    const invalidWaterState = createState({
      systems: [
        {
          ...createState().systems[0],
          waterSource: "",
          qualityBand: "",
        },
      ],
    });

    expect(isStepValid(invalidWaterState, 2)).toBe(false);
    expect(isStepValid(invalidWaterState, 3)).toBe(true);
  });

  it("returns no step errors once disinfection inputs are valid", () => {
    const state = createState();

    expect(isStepValid(state, 4)).toBe(true);
    expect(getStepFieldErrors(state, 4)).toEqual({});
  });
});
