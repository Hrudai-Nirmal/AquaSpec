import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import Stepper, { Step } from "./Stepper";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
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

  it("advances to the next step and marks the prior step invalid when validation fails", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const canAdvanceFromStep = vi.fn((step: number) => step !== 1);

    await act(async () => {
      root!.render(
        <Stepper
          initialStep={1}
          nextButtonText="Next"
          stepLabels={["Identity", "Water"]}
          canAdvanceFromStep={canAdvanceFromStep}
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
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Next")
    );
    expect(nextButton?.textContent).toContain("Next");

    await act(async () => {
      nextButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(canAdvanceFromStep).toHaveBeenCalledWith(1);
    expect(container.textContent).toContain("Step two content");
    expect(container.innerHTML).toContain('data-step-status="error"');
    expect(container.textContent).not.toContain("marked incomplete in red");
  });

  it("allows direct step clicks to change the active step", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(
        <Stepper
          initialStep={1}
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
    });

    const waterStepButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Water")
    );

    await act(async () => {
      waterStepButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Step two content");
    expect(container.innerHTML).toContain('data-step-status="active"');
  });
});
