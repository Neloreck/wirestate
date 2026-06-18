import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  PANEL_PORT_PREFIX,
  type BackendToPanel,
  type InspectFn,
  type InspectNode,
  type PanelToBackend,
} from "@/bridge/messages";
import { type Optional } from "@/types/general";

const MAX_LOG = 500;

/** State the panel renders, sourced entirely from the v1 hook via the bridge. */
export interface BridgeState {
  readonly connected: boolean;
  readonly protocolVersion: Optional<number>;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  clear(): void;
  readonly inspect: InspectFn;
}

/**
 * Connects the panel to the inspected tab's backend over the bridge: pulls current structure +
 * buffered history on attach, streams deltas thereafter, reconnects when the MV3 worker sleeps, and
 * resets on a full page navigation (a reload starts a fresh page and a fresh backend buffer).
 *
 * @returns The live bridge state the panel renders.
 */
export function useBridge(): BridgeState {
  const [connected, setConnected] = useState(false);
  const [protocolVersion, setProtocolVersion] = useState<Optional<number>>(undefined);
  const [roots, setRoots] = useState<ReadonlyArray<DevtoolsRootSnapshot>>([]);
  const [log, setLog] = useState<ReadonlyArray<DevtoolsEvent>>([]);
  const portRef = useRef<Optional<chrome.runtime.Port>>(undefined);
  const pendingRef = useRef<Map<number, (node: InspectNode) => void>>(new Map());
  const requestIdRef = useRef(0);

  useEffect(() => {
    const tabId: number = chrome.devtools.inspectedWindow.tabId;
    let disposed = false;
    let reconnectTimer: Optional<ReturnType<typeof setTimeout>>;

    function connect(): void {
      const port: chrome.runtime.Port = chrome.runtime.connect({ name: `${PANEL_PORT_PREFIX}${tabId}` });

      portRef.current = port;
      setConnected(true);

      port.onMessage.addListener((message: BackendToPanel): void => {
        switch (message.type) {
          case "init":
            setProtocolVersion(message.protocolVersion);
            setRoots(message.roots);
            setLog(message.events.slice(-MAX_LOG));
            break;
          case "snapshot":
            setRoots(message.roots);
            break;
          case "event":
            setLog((previous) => [...previous, message.event].slice(-MAX_LOG));
            // Structure-affecting deltas → pull a fresh tree; message deltas don't change it.
            if (message.event.kind !== "message") {
              port.postMessage({ type: "refresh" } satisfies PanelToBackend);
            }

            break;
          case "inspectResult":
            pendingRef.current.get(message.requestId)?.(message.node);
            pendingRef.current.delete(message.requestId);
            break;
          case "page-connected":
            // A fresh page backend just paired (reload/first load/worker wake). Re-pull its snapshot
            // + buffered deltas; the onNavigated reset has already cleared the previous page's tree.
            port.postMessage({ type: "attach" } satisfies PanelToBackend);
            break;
        }
      });

      port.onDisconnect.addListener((): void => {
        portRef.current = undefined;
        setConnected(false);
        // Fail any in-flight inspect requests rather than leaving the panel spinning.
        for (const resolve of pendingRef.current.values()) {
          resolve({ t: "unsupported" });
        }

        pendingRef.current.clear();
        if (!disposed) {
          reconnectTimer = setTimeout(connect, 250);
        }
      });

      port.postMessage({ type: "attach" } satisfies PanelToBackend);
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
      }

      portRef.current?.disconnect();
      portRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    // A full reload/navigation starts a fresh page — and a fresh backend ring buffer — so drop the
    // previous page's tree and timeline rather than letting them pile up across loads. The new
    // page's live lifecycle stream repopulates both as it mounts. `onNavigated` fires only on real
    // navigations, not SPA route changes, so in-app route churn stays in the timeline.
    function reset(): void {
      setRoots([]);
      setLog([]);
    }

    chrome.devtools.network.onNavigated.addListener(reset);

    return () => {
      chrome.devtools.network.onNavigated.removeListener(reset);
    };
  }, []);

  const inspect: InspectFn = useCallback(
    (rootId: number, instanceId: number, path: ReadonlyArray<string | number>): Promise<InspectNode> => {
      const port: Optional<chrome.runtime.Port> = portRef.current;

      if (!port) {
        return Promise.resolve({ t: "unsupported" });
      }

      const requestId: number = (requestIdRef.current += 1);

      return new Promise((resolve) => {
        pendingRef.current.set(requestId, resolve);
        port.postMessage({ type: "inspect", requestId, rootId, instanceId, path } satisfies PanelToBackend);
      });
    },
    []
  );

  return {
    connected,
    protocolVersion,
    roots,
    log,
    clear: () => setLog([]),
    inspect,
  };
}
