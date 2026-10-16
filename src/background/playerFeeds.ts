import type { PlayerRecord } from "../shared/types";

type PlayerDataFetcher = (url: string, type: "draft" | "current") => Promise<PlayerRecord[]>;

export async function loadPlayerFeeds(
  draftValueUrl: string,
  currentValueUrl: string,
  fetchPlayerData: PlayerDataFetcher,
  logger: Pick<Console, "warn"> = console
): Promise<[PlayerRecord[], PlayerRecord[]]> {
  const feeds = [
    { url: draftValueUrl, type: "draft" as const },
    { url: currentValueUrl, type: "current" as const }
  ];
  const results = await Promise.allSettled(
    feeds.map(({ url, type }) => (url ? fetchPlayerData(url, type) : Promise.resolve([])))
  );
  const failures = results.filter(
    (result, index): result is PromiseRejectedResult => Boolean(feeds[index].url) && result.status === "rejected"
  );
  const configuredFeedCount = feeds.filter(({ url }) => Boolean(url)).length;

  if (configuredFeedCount > 0 && failures.length === configuredFeedCount) {
    throw failures[0].reason;
  }

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.warn(`Failed to load ${feeds[index].type} player data:`, result.reason);
    }
  });

  return [
    results[0].status === "fulfilled" ? results[0].value : [],
    results[1].status === "fulfilled" ? results[1].value : []
  ];
}
