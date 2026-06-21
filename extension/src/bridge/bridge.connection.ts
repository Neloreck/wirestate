import {
  BRIDGE_SOURCE,
  type BackendToPanelPayload,
  type PageMessage,
  type PanelToBackendPayload,
} from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

/**
 * Wraps a worker-port message in a `to-page` bridge envelope and posts it to the MAIN-world backend.
 *
 * @param payload - Message from the background worker (panel) bound for the page.
 */
export function forwardToPage(payload: PanelToBackendPayload): void {
  const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-page", payload };

  window.postMessage(message, "*");
}

/**
 * Validates an incoming `window` message and extracts the payload bound for the worker port.
 *
 * @param messageEvent - A `window` `message` event from the MAIN-world backend.
 * @returns The payload to forward to the port, or `undefined` when the message is not ours.
 */
export function readContentMessage(messageEvent: MessageEvent): Optional<BackendToPanelPayload> {
  const data: Optional<PageMessage> = messageEvent.data as Optional<PageMessage>;

  if (!data || data.source !== BRIDGE_SOURCE || data.dir !== "to-content") {
    return undefined;
  }

  return data.payload;
}
