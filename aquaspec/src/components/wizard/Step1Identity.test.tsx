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
  fieldErrors: {},
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
  it("renders the new contact-first fields and phone prefix selector", () => {
    const markup = renderToStaticMarkup(<Step1Identity />);

    expect(markup).toContain("Full Name");
    expect(markup).toContain("Email Address");
    expect(markup).toContain("Phone Number");
    expect(markup).toContain("Company Name");
    expect(markup).toContain("Location");
    expect(markup).toContain("+91");
  });
});
