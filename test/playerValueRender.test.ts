import { describe, expect, it } from "vitest";

import { buildPlayerValueRenderModel, shouldUpdatePlayerValue } from "../src/content/playerValueRender";

describe("buildPlayerValueRenderModel", () => {
  it("renders positive and negative values with the expected colors", () => {
    expect(buildPlayerValueRenderModel("$12", "-$4")).toEqual({
      badges: [
        { text: "[$12]", color: "#16a34a" },
        { text: "[-$4]", color: "#dc2626" }
      ],
      combinedText: "[$12][-$4]"
    });
  });

  it("omits missing values", () => {
    expect(buildPlayerValueRenderModel(undefined, "$7")).toEqual({
      badges: [{ text: "[$7]", color: "#16a34a" }],
      combinedText: "[$7]"
    });
  });
});

describe("shouldUpdatePlayerValue", () => {
  it("returns false when there is no value to render", () => {
    expect(shouldUpdatePlayerValue(null, "")).toBe(false);
  });

  it("returns false when the rendered value is unchanged", () => {
    expect(shouldUpdatePlayerValue(" [$12][-$4]", "[$12][-$4]")).toBe(false);
  });

  it("returns true when the rendered value has changed", () => {
    expect(shouldUpdatePlayerValue(" [$12]", "[$12][-$4]")).toBe(true);
  });
});
