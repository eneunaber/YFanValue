import { describe, expect, it } from "vitest";

import { getUrlsToTest, validatePlayerValueUrls } from "../src/options/urlValidation";

describe("validatePlayerValueUrls", () => {
  it("allows a single configured URL", () => {
    expect(validatePlayerValueUrls("https://example.com/one.json", "")).toBeNull();
  });

  it("rejects when both URLs are blank", () => {
    expect(validatePlayerValueUrls("", "")).toBe("Please enter at least one valid URL.");
  });

  it("rejects invalid URLs", () => {
    expect(validatePlayerValueUrls("notaurl", "")).toBe("Please enter valid http or https URLs.");
    expect(validatePlayerValueUrls("", "ftp://example.com/feed.json")).toBe(
      "Please enter valid http or https URLs."
    );
  });
});

describe("getUrlsToTest", () => {
  it("returns only non-empty URLs", () => {
    expect(getUrlsToTest("https://example.com/one.json", "")).toEqual(["https://example.com/one.json"]);
    expect(getUrlsToTest("", "https://example.com/two.json")).toEqual(["https://example.com/two.json"]);
    expect(getUrlsToTest("https://example.com/one.json", "https://example.com/two.json")).toEqual([
      "https://example.com/one.json",
      "https://example.com/two.json"
    ]);
  });
});
