import { BRIDGE_SOURCE, CONTENT_PORT, type PageMessage } from "@/bridge/messages";
import { type Optional } from "@/types/general";

/**
 * ISOLATED-world relay. Bridges the MAIN-world backend (`window.postMessage`) to the background
 * worker (a long-lived port). Reconnects on disconnect so the pair re-forms after the MV3 service
 * worker sleeps and wakes.
 */

let port: Optional<chrome.runtime.Port>;

function connect(): void {
  port = chrome.runtime.connect({ name: CONTENT_PORT });

  // Background worker (panel) -> backend (MAIN world).
  port.onMessage.addListener((payload: PageMessage["payload"]): void => {
    const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-page", payload } as PageMessage;

    window.postMessage(message, "*");
  });

  port.onDisconnect.addListener((): void => {
    port = undefined;
    // The worker slept (or the panel closed); re-establish so a later panel re-pairs.
    setTimeout(connect, 250);
  });
}

// Backend (MAIN world) -> background worker (panel).
window.addEventListener("message", (messageEvent: MessageEvent): void => {
  const data: Optional<PageMessage> = messageEvent.data as Optional<PageMessage>;

  if (!data || data.source !== BRIDGE_SOURCE || data.dir !== "to-content") {
    return;
  }

  port?.postMessage(data.payload);
});

connect();
