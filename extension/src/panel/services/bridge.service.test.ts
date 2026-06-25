import { Container } from "@wirestate/core";
import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { asChromePort, mockChromePort, type MockChromePort } from "@/fixtures/chrome";
import { mockLifecycleEvent, mockMessageEvent, mockRootSnapshot } from "@/fixtures/devtools";

import { type InspectNode } from "@/bridge/bridge.messages";
import { BridgeService } from "@/panel/services/bridge.service";
import { PanelTransport } from "@/panel/services/panel.transport";

const TAB_ID: number = 7;
const PORT_NAME: string = `wirestate-panel:${TAB_ID}`;
const RECONNECT_DELAY_MS: number = 250;
const MAX_LOG: number = 512;

function setup() {
  const ports: Array<MockChromePort> = [];
  const navigated: Array<() => void> = [];

  const container = new Container({
    bindings: [
      {
        token: PanelTransport,
        value: {
          tabId: TAB_ID,
          openPort: jest.fn(() => {
            const port = mockChromePort();

            ports.push(port);

            return asChromePort(port);
          }),
          onNavigated: jest.fn((callback: () => void) => {
            navigated.push(callback);
          }),
        },
      },
      BridgeService,
    ],
  });

  return {
    container,
    service: container.get(BridgeService),
    transport: container.get(PanelTransport),
    ports,
    getActivePort: () => ports[ports.length - 1],
    navigate: () => navigated.forEach((callback) => callback()),
  };
}

function mockEvents(count: number): Array<DevtoolsEvent> {
  return Array.from({ length: count }, (_, index) => mockLifecycleEvent({ timestamp: index }));
}

describe("BridgeService", () => {
  describe("connection lifecycle", () => {
    it("opens a tab-scoped port, marks connected, attaches, and watches navigation on provision", () => {
      const { container, service, transport, getActivePort } = setup();

      container.provision();

      expect(transport.openPort).toHaveBeenCalledWith(PORT_NAME);
      expect(service.isConnected).toBe(true);
      expect(getActivePort().postMessage).toHaveBeenCalledWith({ type: "attach" });
      expect(transport.onNavigated).toHaveBeenCalledTimes(1);
    });

    it("reconnects after the port drops while live", () => {
      jest.useFakeTimers();

      try {
        const { container, transport, getActivePort } = setup();

        container.provision();

        expect(transport.openPort).toHaveBeenCalledTimes(1);

        getActivePort().disconnect();
        jest.advanceTimersByTime(RECONNECT_DELAY_MS);

        expect(transport.openPort).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it("stops reconnecting once deprovisioned", () => {
      jest.useFakeTimers();

      try {
        const { container, transport, getActivePort } = setup();

        container.provision();
        container.deprovision();

        // A late drop after teardown must not schedule another connection.
        getActivePort().disconnect();
        jest.advanceTimersByTime(RECONNECT_DELAY_MS * 4);

        expect(transport.openPort).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("inbound messages", () => {
    it("init applies protocol version, roots, and backlog", () => {
      const { container, service, getActivePort } = setup();
      const roots = [mockRootSnapshot()];
      const events = mockEvents(3);

      container.provision();

      getActivePort().emit({ type: "init", protocolVersion: 2, roots, events });

      expect(service.protocolVersion).toBe(2);
      expect(service.roots).toBe(roots);
      expect(service.log).toEqual(events);
    });

    it("trims the initial backlog to the most recent MAX_LOG entries", () => {
      const { container, service, getActivePort } = setup();
      const events = mockEvents(MAX_LOG + 88);

      container.provision();

      getActivePort().emit({ type: "init", protocolVersion: 1, roots: [], events });

      expect(service.log).toHaveLength(MAX_LOG);
      expect(service.log[0]).toBe(events[88]);
      expect(service.log[MAX_LOG - 1]).toBe(events[events.length - 1]);
    });

    it("snapshot replaces roots without touching the log", () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      getActivePort().emit({ type: "init", protocolVersion: 1, roots: [], events: mockEvents(2) });

      const roots = [mockRootSnapshot(9)];

      getActivePort().emit({ type: "snapshot", roots });

      expect(service.roots).toBe(roots);
      expect(service.log).toHaveLength(2);
    });

    it("a structural event appends to the log and pulls a fresh tree", () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      getActivePort().postMessage.mockClear();

      const event = mockLifecycleEvent();

      getActivePort().emit({ type: "event", event });

      expect(service.log).toEqual([event]);
      expect(getActivePort().postMessage).toHaveBeenCalledWith({ type: "refresh" });
    });

    it("a message event appends without pulling a fresh tree", () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      getActivePort().postMessage.mockClear();

      const event = mockMessageEvent();

      getActivePort().emit({ type: "event", event });

      expect(service.log).toEqual([event]);
      expect(getActivePort().postMessage).not.toHaveBeenCalled();
    });

    it("drops the oldest entry once the streamed log exceeds MAX_LOG", () => {
      const { container, service, getActivePort } = setup();
      const backlog = mockEvents(MAX_LOG);

      container.provision();

      getActivePort().emit({ type: "init", protocolVersion: 1, roots: [], events: backlog });

      const next = mockLifecycleEvent({ timestamp: 9999 });

      getActivePort().emit({ type: "event", event: next });

      expect(service.log).toHaveLength(MAX_LOG);
      expect(service.log[0]).toBe(backlog[1]);
      expect(service.log[MAX_LOG - 1]).toBe(next);
    });

    it("page-connected re-attaches to the freshly paired backend", () => {
      const { container, getActivePort } = setup();

      container.provision();

      getActivePort().postMessage.mockClear();
      getActivePort().emit({ type: "page-connected" });

      expect(getActivePort().postMessage).toHaveBeenCalledWith({ type: "attach" });
    });
  });

  describe("inspect requests", () => {
    it("posts an inspect request and resolves it when the result arrives", async () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      const pending = service.inspect(1, 2, ["count"]);

      expect(getActivePort().postMessage).toHaveBeenCalledWith({
        type: "inspect",
        requestId: 1,
        rootId: 1,
        instanceId: 2,
        path: ["count"],
      });

      const node: InspectNode = { kind: "primitive", value: 42 };

      getActivePort().emit({ type: "inspectResult", requestId: 1, node });

      await expect(pending).resolves.toEqual(node);
    });

    it("posts an inspectBinding request keyed by binding id", () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      void service.inspectBinding(1, 5, ["value"]);

      expect(getActivePort().postMessage).toHaveBeenCalledWith({
        type: "inspectBinding",
        requestId: 1,
        rootId: 1,
        bindingId: 5,
        path: ["value"],
      });
    });

    it("resolves to unsupported when no port is open", async () => {
      const { service, transport } = setup();

      await expect(service.inspect(1, 2, [])).resolves.toEqual({ kind: "unsupported" });
      expect(transport.openPort).not.toHaveBeenCalled();
    });

    it("fails in-flight requests with unsupported when the port drops", async () => {
      jest.useFakeTimers();

      try {
        const { container, service, getActivePort } = setup();

        container.provision();

        const pending = service.inspect(1, 2, ["a"]);

        getActivePort().disconnect();

        await expect(pending).resolves.toEqual({ kind: "unsupported" });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("navigation and clear", () => {
    it("resets roots and log when the inspected page navigates", () => {
      const { container, service, getActivePort, navigate } = setup();

      container.provision();

      getActivePort().emit({ type: "init", protocolVersion: 1, roots: [mockRootSnapshot()], events: mockEvents(2) });
      expect(service.roots).toHaveLength(1);

      navigate();

      expect(service.roots).toEqual([]);
      expect(service.log).toEqual([]);
    });

    it("clear empties the streamed log", () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      getActivePort().emit({ type: "event", event: mockMessageEvent() });
      expect(service.log).toHaveLength(1);

      service.clear();

      expect(service.log).toEqual([]);
    });
  });

  describe("refresh", () => {
    it("re-pulls the tree and swaps the inspect closures so expanded reads re-run", () => {
      const { container, service, getActivePort } = setup();

      container.provision();

      const previousInspect = service.inspect;
      const previousInspectBinding = service.inspectBinding;

      getActivePort().postMessage.mockClear();

      service.refresh();

      // Re-pulls the container tree.
      expect(getActivePort().postMessage).toHaveBeenCalledWith({ type: "refresh" });
      // Gives the inspect closures fresh identities — the signal the Detail value-tree keys
      // its per-node fetch on, so every expanded node re-issues its read against the live page.
      expect(service.inspect).not.toBe(previousInspect);
      expect(service.inspectBinding).not.toBe(previousInspectBinding);
    });
  });
});
