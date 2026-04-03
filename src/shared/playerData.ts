import { playerDataSchema, type PlayerRecord } from "./types";

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

    if (dollars > 0) {
      playerMap[yahooId] = `$${dollars.toFixed(0)}`;
    } else if (dollars < 0) {
      playerMap[yahooId] = `-$${Math.abs(dollars).toFixed(0)}`;
    } else {
      playerMap[yahooId] = "$0";
    }
  }

  return playerMap;
}
