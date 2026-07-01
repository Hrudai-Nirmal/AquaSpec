import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Stepper, { Step } from "./Stepper";

describe("Stepper", () => {
  it("renders the combined step content and footer controls", () => {
    const markup = renderToStaticMarkup(
      <Stepper
        initialStep={1}
        backButtonText="Previous"
        nextButtonText="Next"
        stepLabels={["Identity", "Water"]}
      >
        <Step>
          <h2>Identity</h2>
          <p>Step one content</p>
        </Step>
        <Step>
          <h2>Water</h2>
          <p>Step two content</p>
        </Step>
      </Stepper>
    );

    expect(markup).toContain('data-slot="wizard-stepper"');
    expect(markup).toContain("Step one content");
    expect(markup).toContain("Next");
    expect(markup).toContain("Identity");
    expect(markup).toContain('data-step-status="active"');
  });
});
