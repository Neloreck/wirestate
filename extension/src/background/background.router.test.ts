import { BackgroundRouter } from "@/background/background.router";
import { CONTENT_PORT, PANEL_PORT_PREFIX } from "@/bridge/bridge.messages";

interface FakePort {
  readonly name: string;
  readonly sender?: { readonly tab?: { readonly id?: number } };
  readonly postMessage: jest.Mock;
  readonly onMessage: { readonly addListener: jest.Mock };
  readonly onDisconnect: { readonly addListener: jest.Mock };
  /**
   * Invokes every registered `onMessage` listener (simulates an inbound port message).
   */
  emit(message: unknown): void;
  /**
   * Invokes every registered `onDisconnect` listener (simulates the port dropping).
   */
  disconnect(): void;
}

function mockFakePort(name: string, tabId?: number): FakePort {
  const onMessage = { addListener: jest.fn() };
  const onDisconnect = { addListener: jest.fn() };

  return {
    name,
    sender: tabId === undefined ? undefined : { tab: { id: tabId } },
    postMessage: jest.fn(),
    onMessage,
    onDisconnect,
    emit: (message) => onMessage.addListener.mock.calls.forEach(([listener]) => listener(message)),
    disconnect: () => onDisconnect.addListener.mock.calls.forEach(([listener]) => listener()),
  };
}

function mockAsPort(port: FakePort): chrome.runtime.Port {
  return port as unknown as chrome.runtime.Port;
}

describe("BackgroundRouter", () => {
  it("relays content->panel and panel->backend once paired", () => {
    const router = new BackgroundRouter();
    const content = mockFakePort(CONTENT_PORT, 1);
    const panel = mockFakePort(`${PANEL_PORT_PREFIX}1`);

    router.onConnect(mockAsPort(panel));
    router.onConnect(mockAsPort(content));

    content.emit({ type: "event" });
    expect(panel.postMessage).toHaveBeenCalledWith({ type: "event" });

    panel.emit({ type: "refresh" });
    expect(content.postMessage).toHaveBeenCalledWith({ type: "refresh" });
  });

  it("notifies an already-connected panel when its page relay connects", () => {
    const router = new BackgroundRouter();
    const panel = mockFakePort(`${PANEL_PORT_PREFIX}1`);
    const content = mockFakePort(CONTENT_PORT, 1);

    router.onConnect(mockAsPort(panel));
    router.onConnect(mockAsPort(content));

    expect(panel.postMessage).toHaveBeenCalledWith({ type: "page-connected" });
  });

  it("stops relaying to a side after it disconnects", () => {
    const router = new BackgroundRouter();
    const content = mockFakePort(CONTENT_PORT, 1);
    const panel = mockFakePort(`${PANEL_PORT_PREFIX}1`);

    router.onConnect(mockAsPort(content));
    router.onConnect(mockAsPort(panel));

    panel.disconnect();
    content.emit({ type: "event" });

    expect(panel.postMessage).not.toHaveBeenCalled();
  });

  it("ignores a content port with no sender tab id", () => {
    const router = new BackgroundRouter();
    const panel = mockFakePort(`${PANEL_PORT_PREFIX}1`);
    const content = mockFakePort(CONTENT_PORT);

    router.onConnect(mockAsPort(panel));
    router.onConnect(mockAsPort(content));

    expect(panel.postMessage).not.toHaveBeenCalled();
  });

  it("ignores ports with an unrecognized name", () => {
    const router = new BackgroundRouter();
    const other = mockFakePort("something-else", 1);

    expect(() => router.onConnect(mockAsPort(other))).not.toThrow();
    expect(other.onMessage.addListener).not.toHaveBeenCalled();
  });
});
