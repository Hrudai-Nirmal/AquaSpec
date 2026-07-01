import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StepIndicator } from "./StepIndicator";

const mockStoreState = {
  activeStep: 3,
  setActiveStep: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

describe("StepIndicator", () => {
  it("uses the branded active, complete, and navigation styles", () => {
    const markup = renderToStaticMarkup(<StepIndicator />);

    expect(markup).toContain("border-secondary bg-secondary text-secondary-foreground");
    expect(markup).toContain("border-primary bg-primary text-primary-foreground");
    expect(markup).toContain("border-border bg-background");
    expect(markup).toContain("bg-primary text-primary-foreground");
  });
});
