import {
  CURRENT_STORAGE_KEY,
  CURRENT_VALUES_KEY,
  DEFAULT_CURRENT_URL,
  DEFAULT_DRAFT_URL,
  DRAFT_STORAGE_KEY,
  DRAFT_VALUES_KEY
} from "../shared/config";
import { buildPlayersHash, parsePlayerData } from "../shared/playerData";
import type { PlayerRecord, StoredPlayerValues } from "../shared/types";

let draftValueUrl = DEFAULT_DRAFT_URL;
let currentValueUrl = DEFAULT_CURRENT_URL;

chrome.storage.sync.get([DRAFT_STORAGE_KEY, CURRENT_STORAGE_KEY], (result) => {
  if (chrome.runtime.lastError) {
    console.error("Error loading API URLs from storage:", chrome.runtime.lastError);
    draftValueUrl = DEFAULT_DRAFT_URL;
    currentValueUrl = DEFAULT_CURRENT_URL;
    return;
  }

  draftValueUrl = getStoredUrl(result[DRAFT_STORAGE_KEY], DEFAULT_DRAFT_URL);
  currentValueUrl = getStoredUrl(result[CURRENT_STORAGE_KEY], DEFAULT_CURRENT_URL);
  console.log("API URLs loaded:", draftValueUrl, currentValueUrl);
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.data !== "fetchPlayerData") {
    return false;
  }

  Promise.all([
    fetchOptionalPlayerData(draftValueUrl, "draft"),
    fetchOptionalPlayerData(currentValueUrl, "current")
  ])
    .then(([draftPlayers, currentPlayers]) => {
      const draftMap = buildPlayersHash(draftPlayers, "draft");
      const currentMap = buildPlayersHash(currentPlayers, "current");
      return savePlayerData(draftMap, currentMap);
    })
    .then((savedPlayerValues) => sendResponse(savedPlayerValues))
    .catch((error: Error) => {
      console.error("Error fetching/processing player data:", error);
      sendResponse({ error: error.message });
    });

  return true;
});

function fetchOptionalPlayerData(url: string, type: "draft" | "current"): Promise<PlayerRecord[]> {
  if (!url) {
    return Promise.resolve([]);
  }

  return fetchPlayerData(url, type);
}

async function fetchPlayerData(url: string, type: "draft" | "current"): Promise<PlayerRecord[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${type} URL HTTP error: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parsePlayerData(data, type);
}

function savePlayerData(
  draftMap: Record<string, string>,
  currentMap: Record<string, string>
): Promise<StoredPlayerValues> {
  const playerValuesTemplate: StoredPlayerValues = {
    [DRAFT_VALUES_KEY]: JSON.stringify(draftMap),
    [CURRENT_VALUES_KEY]: JSON.stringify(currentMap)
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.set(playerValuesTemplate, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve(playerValuesTemplate);
    });
  });
}

function getStoredUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
