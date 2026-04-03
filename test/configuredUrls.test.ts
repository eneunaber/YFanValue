import { describe, expect, it } from "vitest";

import { getStoredUrl, loadConfiguredUrlsFromStorage } from "../src/background/configuredUrls";

describe("getStoredUrl", () => {
  it("trims stored string values", () => {
    expect(getStoredUrl("  https://example.com/feed.json  ")).toBe("https://example.com/feed.json");
  });

  it("returns blank for non-string values", () => {
    expect(getStoredUrl(null)).toBe("");
    expect(getStoredUrl(123)).toBe("");
  });
});

describe("loadConfiguredUrlsFromStorage", () => {
  it("loads trimmed configured URLs from storage", async () => {
    const runtime = { lastError: null };
    const storageSync = {
      get: (_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({
          draftValueUrl: " https://example.com/one.json ",
          currentValueUrl: ""
        });
      }
    };

    await expect(loadConfiguredUrlsFromStorage(storageSync, runtime)).resolves.toEqual({
      draftValueUrl: "https://example.com/one.json",
      currentValueUrl: ""
    });
  });

  it("rejects when chrome runtime reports a storage error", async () => {
    const runtime = { lastError: new Error("storage failed") };
    const storageSync = {
      get: (_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({});
      }
    };

    await expect(loadConfiguredUrlsFromStorage(storageSync, runtime)).rejects.toThrow("storage failed");
  });
});
