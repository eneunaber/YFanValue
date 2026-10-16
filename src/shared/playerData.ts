import { CURRENT_VALUES_KEY, DRAFT_VALUES_KEY } from "./config";
import { playerDataSchema, type PlayerRecord, type StoredPlayerValues } from "./types";

export function parsePlayerData(data: unknown, type: "draft" | "current"): PlayerRecord[] {
  const parsedData = playerDataSchema.safeParse(data);

  if (!parsedData.success) {
    const firstIssue = parsedData.error.issues[0];
    const issuePath = firstIssue?.path.length ? `${firstIssue.path.join(".")}: ` : "";
    throw new Error(`Invalid ${type} player data: ${issuePath}${firstIssue?.message ?? "schema mismatch"}`);
  }

  return parsedData.data;
}

export function buildPlayersHash(
  players: PlayerRecord[],
  type: "draft" | "current",
  logger: Pick<Console, "warn"> = console
): Record<string, string> {
  const playerMap: Record<string, string> = {};

  for (const player of players) {
    const yahooId = String(player.YAHOOID);
    const dollars = Number(player.Dollars);

    if (Number.isNaN(dollars)) {
      logger.warn(`Invalid Dollars value for ${type} player:`, player.YAHOOID, player.Dollars);
      continue;
    }

    const absoluteDollars = Math.abs(dollars).toFixed(0);

    if (absoluteDollars === "0") {
      playerMap[yahooId] = "$0";
    } else if (dollars > 0) {
      playerMap[yahooId] = `$${absoluteDollars}`;
    } else {
      playerMap[yahooId] = `-$${absoluteDollars}`;
    }
  }

  return playerMap;
}

export function buildStoredPlayerValues(
  draftMap: Record<string, string>,
  currentMap: Record<string, string>
): StoredPlayerValues {
  return {
    [DRAFT_VALUES_KEY]: JSON.stringify(draftMap),
    [CURRENT_VALUES_KEY]: JSON.stringify(currentMap)
  };
}
