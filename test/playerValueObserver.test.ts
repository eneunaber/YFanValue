import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ObserverCallback = (mutations: Array<{ addedNodes: unknown[]; removedNodes: unknown[] }>) => void;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("player value page observer", () => {
  it("ignores extension badges but debounces Yahoo page changes", async () => {
    let observerCallback: ObserverCallback | undefined;
    const observe = vi.fn();
    const setTimeoutMock = vi.fn(() => 1);
    const clearTimeoutMock = vi.fn();

    vi.stubGlobal("MutationObserver", class {
      constructor(callback: ObserverCallback) {
        observerCallback = callback;
      }

      disconnect(): void {}

      observe = observe;
    });
    vi.stubGlobal("document", {
      body: {},
      documentElement: {},
      querySelectorAll: vi.fn(() => [])
    });
    vi.stubGlobal("window", {
      clearTimeout: clearTimeoutMock,
      setTimeout: setTimeoutMock
    });
    vi.stubGlobal("chrome", {
      runtime: {
        lastError: null,
        sendMessage: vi.fn((_request: unknown, callback: (response: unknown) => void) => {
          callback({ DraftValues: '{"10835":"$12"}', CurrentValues: "{}" });
        })
      }
    });

    await import("../src/content/playerValue");
    await vi.waitFor(() => expect(observe).toHaveBeenCalledOnce());

    const playerValueNode = {
      classList: { contains: (className: string) => className === "player-value" }
    };
    const yahooNode = { classList: { contains: () => false } };

    observerCallback?.([{ addedNodes: [playerValueNode], removedNodes: [] }]);
    expect(setTimeoutMock).not.toHaveBeenCalled();

    observerCallback?.([{ addedNodes: [yahooNode], removedNodes: [] }]);
    expect(setTimeoutMock).toHaveBeenCalledOnce();
    expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 500);

    observerCallback?.([{ addedNodes: [yahooNode], removedNodes: [] }]);
    expect(clearTimeoutMock).toHaveBeenCalledWith(1);
    expect(setTimeoutMock).toHaveBeenCalledTimes(2);
  });
});
