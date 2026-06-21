import { forwardToPage, readContentMessage } from "@/bridge/bridge.connection";
import {
  type BackendToPanelPayload,
  BRIDGE_SOURCE,
  type PageMessage,
  type PanelToBackendPayload,
} from "@/bridge/bridge.messages";

describe("forwardToPage", () => {
  const globalScope = globalThis as { window?: unknown };
  const originalWindow: unknown = globalScope.window;

  afterEach(() => {
    globalScope.window = originalWindow;
  });

  it("wraps the payload in a to-page bridge envelope and posts it to the page", () => {
    const postMessage = jest.fn();

    globalScope.window = { postMessage };

    const payload: PanelToBackendPayload = { type: "refresh" };

    forwardToPage(payload);

    expect(postMessage).toHaveBeenCalledWith({ source: BRIDGE_SOURCE, dir: "to-page", payload }, "*");
  });
});

describe("readContentMessage", () => {
  function eventWith(data: unknown): MessageEvent {
    return { data } as MessageEvent;
  }

  it("returns the payload of a valid to-content message", () => {
    const payload: BackendToPanelPayload = { type: "snapshot", roots: [] };
    const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-content", payload };

    expect(readContentMessage(eventWith(message))).toBe(payload);
  });

  it("ignores messages stamped with another source", () => {
    const foreign = { source: "other", dir: "to-content", payload: { type: "refresh" } };

    expect(readContentMessage(eventWith(foreign))).toBeUndefined();
  });

  it("ignores to-page messages (the opposite direction)", () => {
    const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-page", payload: { type: "refresh" } };

    expect(readContentMessage(eventWith(message))).toBeUndefined();
  });

  it("ignores empty or non-bridge data", () => {
    expect(readContentMessage(eventWith(undefined))).toBeUndefined();
    expect(readContentMessage(eventWith(null))).toBeUndefined();
  });
});
