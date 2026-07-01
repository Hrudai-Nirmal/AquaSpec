import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input } from "./input";
import { Select, SelectTrigger, SelectValue } from "./select";

describe("form field styles", () => {
  it("uses colored borders for text inputs and selects", () => {
    const inputMarkup = renderToStaticMarkup(<Input placeholder="Name" />);
    const selectMarkup = renderToStaticMarkup(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>
    );

    expect(inputMarkup).toContain("border-primary/55");
    expect(selectMarkup).toContain("border-primary/55");
  });
});
