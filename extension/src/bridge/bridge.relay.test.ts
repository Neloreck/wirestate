import { asChromePort, mockChromePort, mockPageMessageEvent } from "@/fixtures/chrome";

import { BRIDGE_SOURCE, type BackendToPanelPayload, type PageMessage } from "@/bridge/bridge.messages";
import { postToPage } from "@/bridge/bridge.messaging";
import { BridgeRelay } from "@/bridge/bridge.relay";

describe("BridgeRelay", () => {
  it("opens a port and wires its message + disconnect listeners on connect", () => {
    const port = mockChromePort();
    const relay = new BridgeRelay();

    relay.connect(() => asChromePort(port));

    expect(port.onMessage.addListener).toHaveBeenCalledWith(postToPage);
    expect(port.onDisconnect.addListener).toHaveBeenCalledTimes(1);
  });

  it("forwards a valid backend->panel envelope to the worker port", () => {
    const port = mockChromePort();
    const relay = new BridgeRelay();
    const payload: BackendToPanelPayload = { type: "snapshot", roots: [] };
    const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-content", payload };

    relay.connect(() => asChromePort(port));
    relay.onPageMessage(mockPageMessageEvent(message));

    expect(port.postMessage).toHaveBeenCalledWith(payload);
  });

  it("ignores anything that is not a backend->panel bridge envelope", () => {
    const port = mockChromePort();
    const relay = new BridgeRelay();

    relay.connect(() => asChromePort(port));
    relay.onPageMessage(mockPageMessageEvent(undefined));
    relay.onPageMessage(mockPageMessageEvent({ source: BRIDGE_SOURCE, dir: "to-page", payload: { type: "refresh" } }));

    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it("re-opens the port after it disconnects", () => {
    jest.useFakeTimers();

    try {
      const ports = [mockChromePort(), mockChromePort()];
      const openPort = jest
        .fn()
        .mockReturnValueOnce(asChromePort(ports[0]))
        .mockReturnValueOnce(asChromePort(ports[1]));
      const relay = new BridgeRelay();

      relay.connect(openPort);
      expect(openPort).toHaveBeenCalledTimes(1);

      ports[0].disconnect();
      jest.advanceTimersByTime(250);

      expect(openPort).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
