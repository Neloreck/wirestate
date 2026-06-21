import { forwardToPage } from "@/bridge/bridge.connection";
import { BRIDGE_SOURCE, type BackendToPanelPayload, type PageMessage } from "@/bridge/bridge.messages";
import { BridgeRelay } from "@/bridge/bridge.relay";

interface FakePort {
  readonly onMessage: { readonly addListener: jest.Mock };
  readonly onDisconnect: { readonly addListener: jest.Mock };
  readonly postMessage: jest.Mock;
}

function fakePort(): FakePort {
  return {
    onMessage: { addListener: jest.fn() },
    onDisconnect: { addListener: jest.fn() },
    postMessage: jest.fn(),
  };
}

/**
 * Wraps arbitrary `data` as a page `message` event.
 *
 * @param data - Payload to expose as the event's `data` property.
 * @returns A `MessageEvent` whose `data` is the given value.
 */
const messageEvent = (data: unknown): MessageEvent => ({ data }) as unknown as MessageEvent;

describe("BridgeRelay", () => {
  it("opens a port and wires its message + disconnect listeners on connect", () => {
    const port = fakePort();
    const relay = new BridgeRelay(() => port as unknown as chrome.runtime.Port);

    relay.connect();

    expect(port.onMessage.addListener).toHaveBeenCalledWith(forwardToPage);
    expect(port.onDisconnect.addListener).toHaveBeenCalledTimes(1);
  });

  it("forwards a valid backend->panel envelope to the worker port", () => {
    const port = fakePort();
    const relay = new BridgeRelay(() => port as unknown as chrome.runtime.Port);
    const payload: BackendToPanelPayload = { type: "snapshot", roots: [] };
    const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-content", payload };

    relay.connect();
    relay.onPageMessage(messageEvent(message));

    expect(port.postMessage).toHaveBeenCalledWith(payload);
  });

  it("ignores anything that is not a backend->panel bridge envelope", () => {
    const port = fakePort();
    const relay = new BridgeRelay(() => port as unknown as chrome.runtime.Port);

    relay.connect();
    relay.onPageMessage(messageEvent(undefined));
    relay.onPageMessage(messageEvent({ source: BRIDGE_SOURCE, dir: "to-page", payload: { type: "refresh" } }));

    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it("re-opens the port after it disconnects", () => {
    jest.useFakeTimers();

    try {
      const ports = [fakePort(), fakePort()];
      const openPort = jest
        .fn()
        .mockReturnValueOnce(ports[0] as unknown as chrome.runtime.Port)
        .mockReturnValueOnce(ports[1] as unknown as chrome.runtime.Port);
      const relay = new BridgeRelay(openPort);

      relay.connect();
      expect(openPort).toHaveBeenCalledTimes(1);

      const onDisconnect = ports[0].onDisconnect.addListener.mock.calls[0][0] as () => void;

      onDisconnect();
      jest.advanceTimersByTime(250);

      expect(openPort).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
