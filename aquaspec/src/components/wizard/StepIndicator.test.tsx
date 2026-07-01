import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StepIndicator } from "./StepIndicator";

const mockStoreState = {
  activeStep: 3,
  hatcheryName: "Lotus Ozone",
  fullName: "Alex Rivers",
  emailAddress: "alex@lotusozone.com",
  phoneCountryCode: "+91",
  phoneNumber: "+91 98765 43210",
  location: "Chennai, Tamil Nadu, India",
  mode: "aggregate" as const,
  systems: [
    {
      name: "System 1",
      waterSource: "seawater",
      qualityBand: "good",
      totalVolumeM3: "",
      turnoversPerDay: "",
      operatingHoursPerDay: "",
      salinityPpt: "28",
      targetPathogen: "vibrio",
      species: "vannamei",
      systemType: "larval_rearing",
      biomassDODemandM3Hr: "",
    },
  ],
  validateActiveStep: vi.fn(() => false),
  setActiveStep: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

describe("StepIndicator", () => {
  it("renders success and pending footer states with the new professional styling", () => {
    const markup = renderToStaticMarkup(<StepIndicator />);

    expect(markup).toContain("footer-frost");
    expect(markup).toContain('data-step-status="success"');
    expect(markup).toContain('data-step-status="active"');
    expect(markup).toContain('data-step-status="pending"');
    expect(markup).toContain("text-sm font-sans font-bold");
  });
});
