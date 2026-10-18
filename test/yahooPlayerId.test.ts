import { describe, expect, it } from "vitest";

import { getYahooPlayerIdFromUrl } from "../src/shared/yahooPlayerId";

describe("getYahooPlayerIdFromUrl", () => {
  it("extracts supported Yahoo MLB player IDs", () => {
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/1234")).toBe("1234");
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/12345")).toBe("12345");
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/1000002")).toBe("1000002");
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/12345?src=fantasy")).toBe("12345");
  });

  it("rejects unsupported links and player IDs", () => {
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/player-one")).toBeNull();
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/123")).toBeNull();
    expect(getYahooPlayerIdFromUrl("https://sports.yahoo.com/mlb/players/12345678")).toBeNull();
    expect(getYahooPlayerIdFromUrl("https://example.com/mlb/players/1234")).toBeNull();
    expect(getYahooPlayerIdFromUrl("not-a-url")).toBeNull();
  });
});
