import { forwardToPage, readContentMessage } from "@/bridge/bridge.connection";
import { CONTENT_PORT, type BackendToPanelPayload } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

/**
 * Isolated-world relay.
 * Bridges the MAIN-world backend (`window.postMessage`) to the background worker (a long-lived port).
 * Reconnects on disconnect so the pair re-forms after the MV3 service worker sleeps and wakes.
 */

let port: Optional<chrome.runtime.Port>;

function connect(): void {
  port = chrome.runtime.connect({ name: CONTENT_PORT });

  // Background worker (panel) -> backend (MAIN world).
  port.onMessage.addListener(forwardToPage);

  port.onDisconnect.addListener((): void => {
    port = undefined;
    // The worker slept (or the panel closed); re-establish so a later panel re-pairs.
    setTimeout(connect, 250);
  });
}

// Backend (MAIN world) -> background worker (panel).
window.addEventListener("message", (messageEvent: MessageEvent): void => {
  const payload: Optional<BackendToPanelPayload> = readContentMessage(messageEvent);

  if (payload !== undefined) {
    port?.postMessage(payload);
  }
});

connect();
