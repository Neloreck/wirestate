import {
  type BackendToPanelPayload,
  BRIDGE_SOURCE,
  type PageMessage,
  type PanelToBackendPayload,
} from "@/bridge/bridge.messages";
import { postToPage, readMessageEvent } from "@/bridge/bridge.messaging";

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

    postToPage(payload);

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

    expect(readMessageEvent(eventWith(message))).toBe(payload);
  });

  it("ignores messages stamped with another source", () => {
    const foreign = { source: "other", dir: "to-content", payload: { type: "refresh" } };

    expect(readMessageEvent(eventWith(foreign))).toBeUndefined();
  });

  it("ignores to-page messages (the opposite direction)", () => {
    const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-page", payload: { type: "refresh" } };

    expect(readMessageEvent(eventWith(message))).toBeUndefined();
  });

  it("ignores empty or non-bridge data", () => {
    expect(readMessageEvent(eventWith(undefined))).toBeUndefined();
    expect(readMessageEvent(eventWith(null))).toBeUndefined();
  });
});
