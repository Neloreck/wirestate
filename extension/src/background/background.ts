import { type BackendToPanelPayload, CONTENT_PORT, PANEL_PORT_PREFIX } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

/**
 * Background half of the bridge.
 * Pairs a page's isolated relay with the DevTools panel inspecting that same tab, keyed by tab id,
 * and forwards messages each way. Each side reconnects independently after the worker sleeps,
 * so the pair re-forms on wake.
 */

interface Pair {
  content?: chrome.runtime.Port;
  panel?: chrome.runtime.Port;
}

const pairs: Map<number, Pair> = new Map();

function pairFor(tabId: number): Pair {
  let pair: Optional<Pair> = pairs.get(tabId);

  if (!pair) {
    pair = {};
    pairs.set(tabId, pair);
  }

  return pair;
}

function dropIfEmpty(tabId: number, pair: Pair): void {
  if (!pair.content && !pair.panel) {
    pairs.delete(tabId);
  }
}

chrome.runtime.onConnect.addListener((port: chrome.runtime.Port): void => {
  if (port.name === CONTENT_PORT) {
    const tabId: Optional<number> = port.sender?.tab?.id;

    if (tabId === undefined) {
      return;
    }

    const pair: Pair = pairFor(tabId);

    pair.content = port;

    // A fresh page relay just paired.
    pair.panel?.postMessage({ type: "page-connected" } satisfies BackendToPanelPayload);

    // Backend -> panel.
    port.onMessage.addListener((message: unknown): void => {
      pair.panel?.postMessage(message);
    });

    port.onDisconnect.addListener((): void => {
      if (pair.content === port) {
        pair.content = undefined;
      }

      dropIfEmpty(tabId, pair);
    });

    return;
  }

  if (port.name.startsWith(PANEL_PORT_PREFIX)) {
    const tabId: number = Number(port.name.slice(PANEL_PORT_PREFIX.length));

    if (!Number.isInteger(tabId)) {
      return;
    }

    const pair: Pair = pairFor(tabId);

    pair.panel = port;

    // Panel -> backend.
    port.onMessage.addListener((message: unknown): void => {
      pair.content?.postMessage(message);
    });

    port.onDisconnect.addListener((): void => {
      if (pair.panel === port) {
        pair.panel = undefined;
      }

      dropIfEmpty(tabId, pair);
    });
  }
});
