import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getUrlsToTest,
  testPlayerValueUrl,
  validatePlayerValueUrls
} from "../src/options/urlValidation";

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    expect(getUrlsToTest("https://example.com/one.json", "")).toEqual([
      { url: "https://example.com/one.json", type: "draft" }
    ]);
    expect(getUrlsToTest("", "https://example.com/two.json")).toEqual([
      { url: "https://example.com/two.json", type: "current" }
    ]);
    expect(getUrlsToTest("https://example.com/one.json", "https://example.com/two.json")).toEqual([
      { url: "https://example.com/one.json", type: "draft" },
      { url: "https://example.com/two.json", type: "current" }
    ]);
  });
});

describe("testPlayerValueUrl", () => {
  it("downloads and validates a player feed once", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ YAHOOID: "10835", Dollars: 63 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(testPlayerValueUrl("https://example.com/feed.json", "draft")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/feed.json");
  });

  it("rejects a response that is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html></html>", { status: 200 })));

    await expect(testPlayerValueUrl("https://example.com/feed", "current")).rejects.toThrow(
      "Invalid current player data: response is not valid JSON"
    );
  });

  it("rejects JSON with the wrong player-data shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ YAHOOID: "10835" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    await expect(testPlayerValueUrl("https://example.com/feed.json", "draft")).rejects.toThrow(
      "Invalid draft player data: 0.Dollars:"
    );
  });
});
