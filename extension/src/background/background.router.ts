import { type BackendToPanelPayload, CONTENT_PORT, PANEL_PORT_PREFIX } from "@/bridge/bridge.messages";
import { Logger } from "@/lib/logging/Logger";
import { type Optional } from "@/types/general";

/**
 * A page's isolated relay and the DevTools panel inspecting that same tab, paired by tab id.
 */
interface Pair {
  content?: chrome.runtime.Port;
  panel?: chrome.runtime.Port;
}

/**
 * Background half of the bridge.
 * Pairs a page's isolated relay with the DevTools panel inspecting that same tab (keyed by tab id) and forwards
 * messages each way.
 *
 * Each side reconnects independently after the worker sleeps, so the pair re-forms on wake.
 *
 * @remarks
 * Owns the tab->pair registry. The `chrome.runtime.onConnect` subscription is external and wired in the
 * service-worker entry; this class only routes the ports handed to {@link onConnect}, so it can be
 * driven directly in tests.
 */
export class BackgroundRouter {
  private readonly pairs: Map<number, Pair> = new Map();

  private readonly logger: Logger = new Logger("background");

  /**
   * Routes a newly-connected port — a page relay (`CONTENT_PORT`) or a panel (`PANEL_PORT_PREFIX:<tabId>`).
   * Unknown port names are ignored.
   *
   * @param port - The newly-connected runtime port.
   */
  public onConnect(port: chrome.runtime.Port): void {
    this.logger.debug("Port connected:", port.name);

    if (port.name === CONTENT_PORT) {
      this.connectContent(port);
    } else if (port.name.startsWith(PANEL_PORT_PREFIX)) {
      this.connectPanel(port);
    }
  }

  /**
   * Pairs a page relay to its tab and wires backend->panel forwarding.
   *
   * @param port - The content (relay) port; ignored when it carries no sender tab id.
   */
  private connectContent(port: chrome.runtime.Port): void {
    const tabId: Optional<number> = port.sender?.tab?.id;

    if (tabId === undefined) {
      this.logger.debug("Content port without sender tab id; ignoring");

      return;
    }

    const pair: Pair = this.pairFor(tabId);

    pair.content = port;

    this.logger.info("Page relay paired:", { tabId });

    // A fresh page relay just paired.
    pair.panel?.postMessage({ type: "page-connected" } satisfies BackendToPanelPayload);

    // Backend -> panel.
    port.onMessage.addListener((message: unknown): void => {
      this.logger.debug("Received message backend->panel:", message);
      pair.panel?.postMessage(message);
    });

    port.onDisconnect.addListener((): void => {
      if (pair.content === port) {
        pair.content = undefined;
      }

      this.logger.info("Page relay disconnected:", { tabId });
      this.dropIfEmpty(tabId, pair);
    });
  }

  /**
   * Pairs a panel to its tab (parsed from the port name) and wires panel->backend forwarding.
   *
   * @param port - The panel port, named `PANEL_PORT_PREFIX:<tabId>`; ignored when the id isn't an integer.
   */
  private connectPanel(port: chrome.runtime.Port): void {
    const tabId: number = Number(port.name.slice(PANEL_PORT_PREFIX.length));

    if (!Number.isInteger(tabId)) {
      this.logger.debug("Panel port with invalid tab id:", port.name);

      return;
    }

    const pair: Pair = this.pairFor(tabId);

    pair.panel = port;
    this.logger.info("Panel paired", { tabId });

    // Panel -> backend.
    port.onMessage.addListener((message: unknown): void => {
      this.logger.debug("Received message panel->backend:", message);
      pair.content?.postMessage(message);
    });

    port.onDisconnect.addListener((): void => {
      if (pair.panel === port) {
        pair.panel = undefined;
      }

      this.logger.info("Panel disconnected:", { tabId });
      this.dropIfEmpty(tabId, pair);
    });
  }

  /**
   * Returns the pair for a tab, creating an empty one on first use.
   *
   * @param tabId - Tab to pair on.
   * @returns The (possibly new) pair.
   */
  private pairFor(tabId: number): Pair {
    let pair: Optional<Pair> = this.pairs.get(tabId);

    if (!pair) {
      pair = {};
      this.pairs.set(tabId, pair);
    }

    return pair;
  }

  /**
   * Drops a tab's pair once both sides have disconnected, so the registry doesn't leak.
   *
   * @param tabId - Tab whose pair to consider.
   * @param pair - The tab's pair.
   */
  private dropIfEmpty(tabId: number, pair: Pair): void {
    if (!pair.content && !pair.panel) {
      this.pairs.delete(tabId);
    }
  }
}
