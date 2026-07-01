import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Step1Identity } from "./Step1Identity";

const mockStoreState = {
  hatcheryName: "",
  fullName: "",
  emailAddress: "",
  phoneCountryCode: "+91",
  phoneNumber: "",
  location: "",
  mode: "aggregate" as const,
  systems: [{ name: "System 1" }],
  fieldErrors: {
    fullName: "Full name is required",
    emailAddress: "Email address is required",
    phoneNumber: "Phone number is required",
    hatcheryName: "Company name is required",
    location: "Location is required",
  },
  updateField: vi.fn(),
  setMode: vi.fn(),
  addSystem: vi.fn(),
  removeSystem: vi.fn(),
  renameSystem: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

describe("Step1Identity", () => {
  it("renders the combined phone field with the selected prefix in the placeholder", () => {
    const markup = renderToStaticMarkup(<Step1Identity />);

    expect(markup).toContain("Full Name");
    expect(markup).toContain("Email Address");
    expect(markup).toContain("Phone Number");
    expect(markup).toContain("Company Name");
    expect(markup).toContain("Location");
    expect(markup).toContain("+91");
    expect(markup).toContain('placeholder="+91 xxxxx xxxxx"');
    expect(markup).not.toContain("Country Prefix");
    expect(markup).not.toContain("Full name is required");
    expect(markup).not.toContain("Email address is required");
    expect(markup).not.toContain("Phone number is required");
    expect(markup).not.toContain("Company name is required");
    expect(markup).not.toContain("Location is required");
  });
});
