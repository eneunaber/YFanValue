import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PLAYER_DATA_FETCH_TIMEOUT_MS } from "../src/shared/config";

type MessageListener = (
  request: unknown,
  sender: unknown,
  sendResponse: (response: unknown) => void
) => boolean;

interface BackgroundHarness {
  listener: MessageListener;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function loadBackground(
  storedUrls: { draftValueUrl: string; currentValueUrl: string },
  fetchMock: ReturnType<typeof vi.fn>
): Promise<BackgroundHarness> {
  let listener: MessageListener | undefined;
  const chromeMock = {
    runtime: {
      lastError: null,
      onMessage: {
        addListener: vi.fn((registeredListener: MessageListener) => {
          listener = registeredListener;
        })
      }
    },
    storage: {
      sync: {
        get: vi.fn((_keys: string[], callback: (result: Record<string, unknown>) => void) => {
          callback(storedUrls);
        })
      }
    }
  };

  vi.stubGlobal("chrome", chromeMock);
  vi.stubGlobal("fetch", fetchMock);
  await import("../src/background/background");

  if (!listener) {
    throw new Error("Background message listener was not registered");
  }

  return { listener };
}

function sendFetchPlayerData(listener: MessageListener): Promise<unknown> {
  return new Promise((resolve) => {
    expect(listener({ data: "fetchPlayerData" }, {}, resolve)).toBe(true);
  });
}

function playerResponse(yahooId: string, dollars: number): Response {
  return new Response(JSON.stringify([{ YAHOOID: yahooId, Dollars: dollars }]), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

describe("background player-data message flow", () => {
  it("returns draft and current values in the correct fields", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(playerResponse("1001", 12))
      .mockResolvedValueOnce(playerResponse("1002", -4));
    const { listener } = await loadBackground(
      {
        draftValueUrl: "https://example.com/draft.json",
        currentValueUrl: "https://example.com/current.json"
      },
      fetchMock
    );

    await expect(sendFetchPlayerData(listener)).resolves.toEqual({
      DraftValues: '{"1001":"$12"}',
      CurrentValues: '{"1002":"-$4"}'
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://example.com/draft.json", {
      signal: expect.any(AbortSignal)
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://example.com/current.json", {
      signal: expect.any(AbortSignal)
    });
  });

  it("returns the successful feed when the other configured feed fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(playerResponse("1001", 12))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    const { listener } = await loadBackground(
      {
        draftValueUrl: "https://example.com/draft.json",
        currentValueUrl: "https://example.com/current.json"
      },
      fetchMock
    );

    await expect(sendFetchPlayerData(listener)).resolves.toEqual({
      DraftValues: '{"1001":"$12"}',
      CurrentValues: "{}"
    });
  });

  it("returns the successful feed when the other configured feed times out", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controllers = [new AbortController(), new AbortController()];
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValueOnce(controllers[0].signal)
      .mockReturnValueOnce(controllers[1].signal);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(playerResponse("1001", 12))
      .mockImplementationOnce((_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => reject(options.signal?.reason));
        })
      );
    const { listener } = await loadBackground(
      {
        draftValueUrl: "https://example.com/draft.json",
        currentValueUrl: "https://example.com/current.json"
      },
      fetchMock
    );

    const response = sendFetchPlayerData(listener);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    controllers[1].abort(new Error("request timed out"));

    await expect(response).resolves.toEqual({
      DraftValues: '{"1001":"$12"}',
      CurrentValues: "{}"
    });
    expect(timeout).toHaveBeenNthCalledWith(1, PLAYER_DATA_FETCH_TIMEOUT_MS);
    expect(timeout).toHaveBeenNthCalledWith(2, PLAYER_DATA_FETCH_TIMEOUT_MS);
  });

  it("returns an error when every configured feed fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    const { listener } = await loadBackground(
      {
        draftValueUrl: "https://example.com/draft.json",
        currentValueUrl: "https://example.com/current.json"
      },
      fetchMock
    );

    await expect(sendFetchPlayerData(listener)).resolves.toEqual({
      error: "draft URL HTTP error: 503"
    });
  });
});
