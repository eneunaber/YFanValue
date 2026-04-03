import { CURRENT_STORAGE_KEY, DRAFT_STORAGE_KEY } from "../shared/config";

export interface ConfiguredUrls {
  currentValueUrl: string;
  draftValueUrl: string;
}

export interface RuntimeLike {
  lastError?: { message?: string } | null;
}

export interface StorageSyncAreaLike {
  get(keys: string[], callback: (result: Record<string, unknown>) => void): void;
}

export function loadConfiguredUrlsFromStorage(
  storageSync: StorageSyncAreaLike,
  runtime: RuntimeLike
): Promise<ConfiguredUrls> {
  return new Promise((resolve, reject) => {
    storageSync.get([DRAFT_STORAGE_KEY, CURRENT_STORAGE_KEY], (result) => {
      if (runtime.lastError) {
        reject(runtime.lastError);
        return;
      }

      resolve({
        draftValueUrl: getStoredUrl(result[DRAFT_STORAGE_KEY]),
        currentValueUrl: getStoredUrl(result[CURRENT_STORAGE_KEY])
      });
    });
  });
}

export function getStoredUrl(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
