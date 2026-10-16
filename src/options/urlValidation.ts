import { parsePlayerData } from "../shared/playerData";

export interface PlayerValueUrlToTest {
  type: "draft" | "current";
  url: string;
}

export function validatePlayerValueUrls(playerValueUrlOne: string, playerValueUrlTwo: string): string | null {
  if (!playerValueUrlOne && !playerValueUrlTwo) {
    return "Please enter at least one valid URL.";
  }

  if (!isValidOptionalUrl(playerValueUrlOne) || !isValidOptionalUrl(playerValueUrlTwo)) {
    return "Please enter valid http or https URLs.";
  }

  return null;
}

export function getUrlsToTest(playerValueUrlOne: string, playerValueUrlTwo: string): PlayerValueUrlToTest[] {
  return [
    { url: playerValueUrlOne, type: "draft" as const },
    { url: playerValueUrlTwo, type: "current" as const }
  ].filter(({ url }) => Boolean(url));
}

export async function testPlayerValueUrl(url: string, type: "draft" | "current"): Promise<void> {
  const response = await fetch(url);

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
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
