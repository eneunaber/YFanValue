import { loadConfiguredUrlsFromStorage } from "./configuredUrls";
import { loadPlayerFeeds } from "./playerFeeds";
import { PLAYER_DATA_FETCH_TIMEOUT_MS } from "../shared/config";
import { buildPlayersHash, buildStoredPlayerValues, parsePlayerData } from "../shared/playerData";
import type { PlayerRecord } from "../shared/types";

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.data !== "fetchPlayerData") {
    return false;
  }

  loadConfiguredUrlsFromStorage(chrome.storage.sync, chrome.runtime)
    .then(({ draftValueUrl, currentValueUrl }) =>
      loadPlayerFeeds(draftValueUrl, currentValueUrl, fetchPlayerData)
    )
    .then(([draftPlayers, currentPlayers]) => {
      const draftMap = buildPlayersHash(draftPlayers, "draft");
      const currentMap = buildPlayersHash(currentPlayers, "current");
      return buildStoredPlayerValues(draftMap, currentMap);
    })
    .then((playerValues) => sendResponse(playerValues))
    .catch((error: Error) => {
      console.error("Error fetching/processing player data:", error);
      sendResponse({ error: error.message });
    });

  return true;
});

async function fetchPlayerData(url: string, type: "draft" | "current"): Promise<PlayerRecord[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(PLAYER_DATA_FETCH_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`${type} URL HTTP error: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parsePlayerData(data, type);
}
