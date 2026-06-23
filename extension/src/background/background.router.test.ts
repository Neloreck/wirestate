import { asChromePort, mockChromePort } from "@/fixtures/chrome";

import { BackgroundRouter } from "@/background/background.router";
import { CONTENT_PORT, PANEL_PORT_PREFIX } from "@/bridge/bridge.messages";

describe("BackgroundRouter", () => {
  it("relays content->panel and panel->backend once paired", () => {
    const router = new BackgroundRouter();
    const content = mockChromePort({ name: CONTENT_PORT, tabId: 1 });
    const panel = mockChromePort({ name: `${PANEL_PORT_PREFIX}1` });

    router.onConnect(asChromePort(panel));
    router.onConnect(asChromePort(content));

    content.emit({ type: "event" });
    expect(panel.postMessage).toHaveBeenCalledWith({ type: "event" });

    panel.emit({ type: "refresh" });
    expect(content.postMessage).toHaveBeenCalledWith({ type: "refresh" });
  });

  it("notifies an already-connected panel when its page relay connects", () => {
    const router = new BackgroundRouter();
    const panel = mockChromePort({ name: `${PANEL_PORT_PREFIX}1` });
    const content = mockChromePort({ name: CONTENT_PORT, tabId: 1 });

    router.onConnect(asChromePort(panel));
    router.onConnect(asChromePort(content));

    expect(panel.postMessage).toHaveBeenCalledWith({ type: "page-connected" });
  });

  it("stops relaying to a side after it disconnects", () => {
    const router = new BackgroundRouter();
    const content = mockChromePort({ name: CONTENT_PORT, tabId: 1 });
    const panel = mockChromePort({ name: `${PANEL_PORT_PREFIX}1` });

    router.onConnect(asChromePort(content));
    router.onConnect(asChromePort(panel));

    panel.disconnect();
    content.emit({ type: "event" });

    expect(panel.postMessage).not.toHaveBeenCalled();
  });

  it("ignores a content port with no sender tab id", () => {
    const router = new BackgroundRouter();
    const panel = mockChromePort({ name: `${PANEL_PORT_PREFIX}1` });
    const content = mockChromePort({ name: CONTENT_PORT });

    router.onConnect(asChromePort(panel));
    router.onConnect(asChromePort(content));

    expect(panel.postMessage).not.toHaveBeenCalled();
  });

  it("ignores ports with an unrecognized name", () => {
    const router = new BackgroundRouter();
    const other = mockChromePort({ name: "something-else", tabId: 1 });

    expect(() => router.onConnect(asChromePort(other))).not.toThrow();
    expect(other.onMessage.addListener).not.toHaveBeenCalled();
  });
});
