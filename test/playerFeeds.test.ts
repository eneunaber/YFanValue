import { describe, expect, it, vi } from "vitest";

import { loadPlayerFeeds } from "../src/background/playerFeeds";
import type { PlayerRecord } from "../src/shared/types";

const draftPlayers: PlayerRecord[] = [{ YAHOOID: "1001", Dollars: 12 }];
const currentPlayers: PlayerRecord[] = [{ YAHOOID: "1002", Dollars: 8 }];

describe("loadPlayerFeeds", () => {
  it("loads both configured feeds", async () => {
    const fetchPlayerData = vi
      .fn()
      .mockResolvedValueOnce(draftPlayers)
      .mockResolvedValueOnce(currentPlayers);

    await expect(
      loadPlayerFeeds("https://example.com/draft.json", "https://example.com/current.json", fetchPlayerData)
    ).resolves.toEqual([draftPlayers, currentPlayers]);
  });

  it("keeps the successful feed when the other feed fails", async () => {
    const fetchPlayerData = vi
      .fn()
      .mockResolvedValueOnce(draftPlayers)
      .mockRejectedValueOnce(new Error("current unavailable"));
    const warn = vi.fn();

    await expect(
      loadPlayerFeeds(
        "https://example.com/draft.json",
        "https://example.com/current.json",
        fetchPlayerData,
        { warn }
      )
    ).resolves.toEqual([draftPlayers, []]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("rejects when every configured feed fails", async () => {
    const fetchPlayerData = vi.fn().mockRejectedValue(new Error("feed unavailable"));

    await expect(
      loadPlayerFeeds("https://example.com/draft.json", "https://example.com/current.json", fetchPlayerData)
    ).rejects.toThrow("feed unavailable");
  });

  it("does not treat an omitted feed as a failure", async () => {
    const fetchPlayerData = vi.fn().mockResolvedValue(currentPlayers);

    await expect(loadPlayerFeeds("", "https://example.com/current.json", fetchPlayerData)).resolves.toEqual([
      [],
      currentPlayers
    ]);
    expect(fetchPlayerData).toHaveBeenCalledOnce();
  });
});
