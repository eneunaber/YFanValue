import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PLAYER_DATA_FETCH_TIMEOUT_MS } from "../src/shared/config";

type EventHandler = () => void;

interface ElementStub {
  value: string;
  disabled: boolean;
  textContent: string;
  className: string;
  addEventListener: (type: string, handler: EventHandler) => void;
  click: () => void;
}

interface OptionsHarness {
  elements: Record<string, ElementStub>;
  storageSet: ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function createElement(): ElementStub {
  const listeners = new Map<string, EventHandler>();

  return {
    value: "",
    disabled: false,
    textContent: "",
    className: "",
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    click() {
      listeners.get("click")?.();
    }
  };
}

async function loadOptions(fetchMock: ReturnType<typeof vi.fn>): Promise<OptionsHarness> {
  const elements = {
    draftValueUrl: createElement(),
    currentValueUrl: createElement(),
    save: createElement(),
    reset: createElement(),
    status: createElement()
  };
  const storageSet = vi.fn((_values: unknown, callback: () => void) => callback());

  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    getElementById: vi.fn((id: string) => elements[id as keyof typeof elements] ?? null)
  });
  vi.stubGlobal("window", {
    clearTimeout: (timer: number | undefined) => clearTimeout(timer),
    setTimeout: (callback: () => void, delay: number) => setTimeout(callback, delay)
  });
  vi.stubGlobal("chrome", {
    runtime: { lastError: null },
    storage: {
      sync: {
        get: vi.fn(),
        set: storageSet
      }
    }
  });
  vi.stubGlobal("fetch", fetchMock);

  await import("../src/options/options");

  return { elements, storageSet };
}

function playerResponse(): Response {
  return new Response(JSON.stringify([{ YAHOOID: "10835", Dollars: 63 }]), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

describe("options page flow", () => {
  it("disables both actions while validating and saves only after validation succeeds", async () => {
    let finishRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () => new Promise<Response>((resolve) => {
        finishRequest = resolve;
      })
    );
    const { elements, storageSet } = await loadOptions(fetchMock);
    elements.draftValueUrl.value = "https://example.com/draft.json";

    elements.save.click();

    expect(elements.save.disabled).toBe(true);
    expect(elements.reset.disabled).toBe(true);
    expect(elements.save.textContent).toBe("Testing URLs...");
    expect(storageSet).not.toHaveBeenCalled();

    finishRequest?.(playerResponse());

    await vi.waitFor(() => expect(storageSet).toHaveBeenCalledOnce());
    expect(storageSet.mock.calls[0][0]).toEqual({
      draftValueUrl: "https://example.com/draft.json",
      currentValueUrl: ""
    });
    expect(elements.save.disabled).toBe(false);
    expect(elements.reset.disabled).toBe(false);
  });

  it("does not save an invalid feed and restores both actions", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { elements, storageSet } = await loadOptions(
      vi.fn().mockResolvedValue(new Response("<html>sensitive response</html>", { status: 200 }))
    );
    elements.draftValueUrl.value = "https://example.com/draft.json";

    elements.save.click();

    await vi.waitFor(() => expect(elements.status.textContent).toContain("Invalid draft player data"));
    expect(elements.status.textContent).not.toContain("sensitive response");
    expect(storageSet).not.toHaveBeenCalled();
    expect(elements.save.disabled).toBe(false);
    expect(elements.reset.disabled).toBe(false);
  });

  it("restores both actions when a feed request times out", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    const fetchMock = vi.fn((_url: string, options: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(options.signal?.reason));
      })
    );
    const { elements, storageSet } = await loadOptions(fetchMock);
    elements.draftValueUrl.value = "https://example.com/draft.json";

    elements.save.click();
    controller.abort(new Error("request timed out"));

    await vi.waitFor(() => expect(elements.status.textContent).toContain("request timed out"));
    expect(timeout).toHaveBeenCalledWith(PLAYER_DATA_FETCH_TIMEOUT_MS);
    expect(storageSet).not.toHaveBeenCalled();
    expect(elements.save.disabled).toBe(false);
    expect(elements.reset.disabled).toBe(false);
  });

  it("clears an old success timer before showing a newer error", async () => {
    vi.useFakeTimers();
    const { elements } = await loadOptions(vi.fn());

    elements.reset.click();
    elements.reset.click();
    expect(vi.getTimerCount()).toBe(1);

    elements.draftValueUrl.value = "not-a-url";
    elements.save.click();

    expect(elements.status.textContent).toBe("Please enter valid https URLs or http://localhost URLs.");
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(3000);
    expect(elements.status.className).toContain("block border-rose");
  });
});
