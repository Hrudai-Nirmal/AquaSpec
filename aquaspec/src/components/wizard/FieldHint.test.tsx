import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FieldHint } from "./FieldHint";

describe("FieldHint", () => {
  it("renders a compact info trigger with the help text", () => {
    const markup = renderToStaticMarkup(
      <FieldHint hint="Explains what this field means">Water Source *</FieldHint>
    );

    expect(markup).toContain("Water Source *");
    expect(markup).toContain('title="Explains what this field means"');
    expect(markup).toContain('aria-label="Explains what this field means"');
  });
});
