import { postToContent } from "@/backend/backend.messaging";
import { type BackendToPanelPayload, BRIDGE_SOURCE } from "@/bridge/bridge.messages";

describe("postToContent", () => {
  const globalScope = globalThis as { window?: unknown };
  const originalWindow: unknown = globalScope.window;

  afterEach(() => {
    globalScope.window = originalWindow;
  });

  it("wraps the payload in a to-content bridge envelope and posts it to the page", () => {
    const postMessage = jest.fn();

    globalScope.window = { postMessage };

    const payload: BackendToPanelPayload = { type: "snapshot", roots: [] };

    postToContent(payload);

    expect(postMessage).toHaveBeenCalledWith({ source: BRIDGE_SOURCE, dir: "to-content", payload }, "*");
  });
});
