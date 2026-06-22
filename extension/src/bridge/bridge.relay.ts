import { type BackendToPanelPayload } from "@/bridge/bridge.messages";
import { postToPage, readMessageEvent } from "@/bridge/bridge.messaging";
import { Logger } from "@/lib/logging/Logger";
import { type Nullable } from "@/types/general";

/**
 * Isolated-world relay. Bridges the MAIN-world backend (`window.postMessage`) to the background worker
 * (a long-lived `chrome.runtime` port), forwarding each way and re-opening the port after the MV3
 * service worker sleeps and wakes.
 *
 * @remarks
 * Owns the worker port and its reconnect lifecycle (so it re-wires the port's listeners on every
 * reconnect). The `window` message source is external and wired in the content-script entry; this
 * class only manages the port it opens via the injected factory, so it can be driven in tests.
 */
export class BridgeRelay {
  /**
   * Delay before re-opening the worker port after it drops (MV3 service-worker sleep / panel close).
   */
  public static readonly RECONNECT_DELAY_MS: number = 250;

  private port: Nullable<chrome.runtime.Port> = null;

  private readonly logger: Logger = new Logger("bridge");

  /**
   * Opens the worker port, forwarding its messages to the page and reconnecting when it drops.
   *
   * @param openPort - Opens a fresh worker port (e.g. `() => chrome.runtime.connect({ name })`).
   */
  public connect(openPort: () => chrome.runtime.Port): void {
    const port: chrome.runtime.Port = openPort();

    this.port = port;
    this.logger.info("Worker port opened");

    // Background worker (panel) -> backend (MAIN world).
    port.onMessage.addListener(postToPage);

    port.onDisconnect.addListener((): void => {
      this.port = null;
      this.logger.info("Worker port dropped; reconnecting in", BridgeRelay.RECONNECT_DELAY_MS, "ms");
      // The worker slept (or the panel closed); re-establish so a later panel re-pairs.
      setTimeout(() => this.connect(openPort), BridgeRelay.RECONNECT_DELAY_MS);
    });
  }

  /**
   * Handles one page `message`: forwards a valid backend->panel envelope to the worker port, ignoring
   * anything that isn't one.
   *
   * @param messageEvent - A `message` event observed on the page (from the MAIN-world backend).
   */
  public onPageMessage(messageEvent: MessageEvent): void {
    const payload: Nullable<BackendToPanelPayload> = readMessageEvent(messageEvent);

    if (payload) {
      this.logger.debug("Page message backend->panel:", payload.type);
      this.port?.postMessage(payload);
    }
  }
}
