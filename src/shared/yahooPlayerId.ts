export const YAHOO_PLAYER_ID_PATTERN = /^\d{4,7}$/;

const yahooPlayerPathPattern = /^\/mlb\/players\/([^/]+)$/;

export function getYahooPlayerIdFromUrl(url: string): string | null {
  try {
    const playerUrl = new URL(url);
    const playerId = playerUrl.pathname.match(yahooPlayerPathPattern)?.[1];
    return playerUrl.hostname === "sports.yahoo.com" && playerId && YAHOO_PLAYER_ID_PATTERN.test(playerId)
      ? playerId
      : null;
  } catch {
    return null;
  }
}
