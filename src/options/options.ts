import "./styles.css";

import {
  CURRENT_STORAGE_KEY,
  DEFAULT_CURRENT_URL,
  DEFAULT_DRAFT_URL,
  DRAFT_STORAGE_KEY
} from "../shared/config";
import { getUrlsToTest, validatePlayerValueUrls } from "./urlValidation";

const draftValueInput = getRequiredElement<HTMLInputElement>("draftValueUrl");
const currentValueInput = getRequiredElement<HTMLInputElement>("currentValueUrl");
const saveButton = getRequiredElement<HTMLButtonElement>("save");
const resetButton = getRequiredElement<HTMLButtonElement>("reset");
const statusDiv = getRequiredElement<HTMLDivElement>("status");

document.addEventListener("DOMContentLoaded", loadSettings);
saveButton.addEventListener("click", validateAndSaveSettings);
resetButton.addEventListener("click", resetSettings);

function loadSettings(): void {
  chrome.storage.sync.get([DRAFT_STORAGE_KEY, CURRENT_STORAGE_KEY], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading settings:", chrome.runtime.lastError);
      showStatus("Error loading settings", "error");
      draftValueInput.value = DEFAULT_DRAFT_URL;
      currentValueInput.value = DEFAULT_CURRENT_URL;
      return;
    }

    draftValueInput.value = getStoredUrl(result[DRAFT_STORAGE_KEY], DEFAULT_DRAFT_URL);
    currentValueInput.value = getStoredUrl(result[CURRENT_STORAGE_KEY], DEFAULT_CURRENT_URL);
  });
}

function validateAndSaveSettings(): void {
  const playerValueUrlOne = draftValueInput.value.trim();
  const playerValueUrlTwo = currentValueInput.value.trim();
  const validationError = validatePlayerValueUrls(playerValueUrlOne, playerValueUrlTwo);

  if (validationError) {
    showStatus(validationError, "error");
    return;
  }

  setSaveState(true, "Testing URLs...");

  Promise.all(getUrlsToTest(playerValueUrlOne, playerValueUrlTwo).map((url) => testUrl(url)))
    .then(() => performSave(playerValueUrlOne, playerValueUrlTwo))
    .catch((error: Error) => {
      console.error("Error validating URLs:", error);
      showStatus(`URL validation failed: ${error.message}`, "error");
      setSaveState(false, "Save settings");
    });
}

async function testUrl(url: string): Promise<void> {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });

    if (headResponse.ok) {
      return;
    }
  } catch {
    // Fall through to a GET request for servers that do not support HEAD.
  }

  const getResponse = await fetch(url);

  if (!getResponse.ok) {
    throw new Error(`HTTP ${getResponse.status} for ${url}`);
  }
}

function performSave(playerValueUrlOne: string, playerValueUrlTwo: string): void {
  chrome.storage.sync.set(
    {
      [DRAFT_STORAGE_KEY]: playerValueUrlOne,
      [CURRENT_STORAGE_KEY]: playerValueUrlTwo
    },
    () => {
      setSaveState(false, "Save settings");

      if (chrome.runtime.lastError) {
        console.error("Error saving settings:", chrome.runtime.lastError);
        showStatus("Error saving settings", "error");
        return;
      }

      showStatus("Settings saved successfully. The new feeds will be used on the next page load.", "success");
    }
  );
}

function resetSettings(): void {
  draftValueInput.value = DEFAULT_DRAFT_URL;
  currentValueInput.value = DEFAULT_CURRENT_URL;

  chrome.storage.sync.set(
    {
      [DRAFT_STORAGE_KEY]: DEFAULT_DRAFT_URL,
      [CURRENT_STORAGE_KEY]: DEFAULT_CURRENT_URL
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error resetting settings:", chrome.runtime.lastError);
        showStatus("Error resetting settings", "error");
        return;
      }

      showStatus("Settings reset to the default Player Value URLs.", "success");
    }
  );
}

function setSaveState(disabled: boolean, label: string): void {
  saveButton.disabled = disabled;
  saveButton.textContent = label;
}

function showStatus(message: string, type: "success" | "error"): void {
  statusDiv.textContent = message;
  statusDiv.className =
    "rounded-2xl border px-4 py-3 text-sm font-medium " +
    (type === "success"
      ? "block border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : "block border-rose-400/30 bg-rose-400/10 text-rose-100");

  if (type === "success") {
    window.setTimeout(() => {
      statusDiv.className = "hidden rounded-2xl border px-4 py-3 text-sm font-medium";
    }, 3000);
  }
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Options page is missing required element: ${id}`);
  }

  return element as T;
}

function getStoredUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
