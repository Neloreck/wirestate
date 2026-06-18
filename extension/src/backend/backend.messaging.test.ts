import { afterEach, describe, expect, it, vi } from "vitest";

import { post } from "@/backend/backend.messaging";
import { type BackendToPanel, BRIDGE_SOURCE } from "@/bridge/messages";

describe("post", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("wraps the payload in a to-content bridge envelope and posts it to the page", () => {
    const postMessage = vi.fn();

    vi.stubGlobal("window", { postMessage });

    const payload: BackendToPanel = { type: "snapshot", roots: [] };

    post(payload);

    expect(postMessage).toHaveBeenCalledWith({ source: BRIDGE_SOURCE, dir: "to-content", payload }, "*");
  });
});
