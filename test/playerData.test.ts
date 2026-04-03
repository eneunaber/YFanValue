import { describe, expect, it, vi } from "vitest";

import { buildPlayersHash, parsePlayerData } from "../src/shared/playerData";

describe("parsePlayerData", () => {
  it("accepts valid player arrays", () => {
    const result = parsePlayerData(
      [
        { YAHOOID: 1234, Dollars: 15 },
        { YAHOOID: "5678", Dollars: "-3" }
      ],
      "draft"
    );

    expect(result).toEqual([
      { YAHOOID: 1234, Dollars: 15 },
      { YAHOOID: "5678", Dollars: "-3" }
    ]);
  });

  it("rejects non-array payloads", () => {
    expect(() => parsePlayerData({ YAHOOID: 1234, Dollars: 15 }, "current")).toThrow(
      "Invalid current player data:"
    );
  });
});

describe("buildPlayersHash", () => {
  it("formats positive, negative, and zero values", () => {
    const result = buildPlayersHash(
      [
        { YAHOOID: 1001, Dollars: 12.6 },
        { YAHOOID: "1002", Dollars: "-4" },
        { YAHOOID: 1003, Dollars: 0 }
      ],
      "draft"
    );

    expect(result).toEqual({
      "1001": "$13",
      "1002": "-$4",
      "1003": "$0"
    });
  });

  it("skips invalid rows and logs warnings", () => {
    const warn = vi.fn();

    const result = buildPlayersHash(
      [
        { Dollars: 10 },
        { YAHOOID: 1002, Dollars: "oops" },
        { YAHOOID: 1003, Dollars: null },
        { YAHOOID: 1004, Dollars: 7 }
      ],
      "current",
      { warn }
    );

    expect(result).toEqual({
      "1004": "$7"
    });
    expect(warn).toHaveBeenCalledTimes(3);
  });
});
