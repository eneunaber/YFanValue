import { parsePlayerData } from "../shared/playerData";
import { PLAYER_DATA_FETCH_TIMEOUT_MS } from "../shared/config";

export function validatePlayerValueUrls(playerValueUrlOne: string, playerValueUrlTwo: string): string | null {
  if (!playerValueUrlOne && !playerValueUrlTwo) {
    return "Please enter at least one valid URL.";
  }

  if (!isValidOptionalUrl(playerValueUrlOne) || !isValidOptionalUrl(playerValueUrlTwo)) {
    return "Please enter valid https URLs or http://localhost URLs.";
  }

  return null;
}

export async function testPlayerValueUrl(url: string, type: "draft" | "current"): Promise<void> {
  const response = await fetch(url, { signal: AbortSignal.timeout(PLAYER_DATA_FETCH_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`${type} URL HTTP error: ${response.status}`);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid ${type} player data: response is not valid JSON`);
  }

  parsePlayerData(data, type);
}

export function isValidOptionalUrl(value: string): boolean {
  return !value || isValidUrl(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return false;
  }
}
