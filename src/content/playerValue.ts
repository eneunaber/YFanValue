import type { ErrorResponse, StoredPlayerValues } from "../shared/types";

const playerLinkPattern = /.*sports\.yahoo\.com\/mlb\/players\/(\d{4,5})$/;
const playerValueClassName = "player-value";
const debounceDelay = 500;

let draftValuesMap: Record<string, string> = {};
let currentValuesMap: Record<string, string> = {};
let observer: MutationObserver | null = null;
let debounceTimer: number | undefined;

void getPlayerValues()
  .then((playerValues) => {
    if ("error" in playerValues) {
      console.error("Failed to fetch player data:", playerValues.error);
      return;
    }

    draftValuesMap = JSON.parse(playerValues.DraftValues) as Record<string, string>;
    currentValuesMap = JSON.parse(playerValues.CurrentValues) as Record<string, string>;

    attachPagingEvents();
    showValues();
  })
  .catch((error) => {
    console.error("Failed to retrieve player values:", error);
  });

function attachPagingEvents(): void {
  observer?.disconnect();
  observer = null;

  const playersTable = document.getElementById("players-table-wrapper");

  if (!playersTable) {
    console.warn("Players table wrapper not found on page");
    return;
  }

  observer = new MutationObserver(() => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(showValues, debounceDelay);
  });

  observer.observe(playersTable, {
    childList: true,
    subtree: true
  });
}

function showValues(): void {
  if (Object.keys(draftValuesMap).length === 0 && Object.keys(currentValuesMap).length === 0) {
    return;
  }

  const playerLinks = document.querySelectorAll<HTMLAnchorElement>("a[href]");

  for (const link of playerLinks) {
    const match = link.href.match(playerLinkPattern);

    if (!match) {
      continue;
    }

    const playerId = match[1];
    const draftValue = draftValuesMap[playerId];
    const currentValue = currentValuesMap[playerId];

    if (draftValue == null && currentValue == null) {
      continue;
    }

    const combinedValue = [draftValue, currentValue]
      .filter((value): value is string => value != null)
      .map((value) => `[${value}]`)
      .join("");

    if (!combinedValue || link.querySelector(`.${playerValueClassName}`)?.textContent === ` ${combinedValue}`) {
      continue;
    }

    link.querySelector(`.${playerValueClassName}`)?.remove();

    const valueTag = document.createElement("span");
    valueTag.className = playerValueClassName;
    valueTag.textContent = ` ${combinedValue}`;
    link.appendChild(valueTag);
  }
}

function getPlayerValues(): Promise<StoredPlayerValues | ErrorResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ data: "fetchPlayerData" }, (response: StoredPlayerValues | ErrorResponse) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve(response);
    });
  });
}

export { showValues };
