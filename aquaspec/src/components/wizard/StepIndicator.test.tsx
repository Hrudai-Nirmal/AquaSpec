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
  it("uses the branded footer border and softened blur treatment", () => {
    const markup = renderToStaticMarkup(<StepIndicator />);

    expect(markup).toContain("footer-frost");
    expect(markup).toContain("border-t border-border/80");
    expect(markup).toContain("border-secondary bg-secondary text-secondary-foreground");
    expect(markup).toContain("border-primary bg-primary text-primary-foreground");
  });
});
