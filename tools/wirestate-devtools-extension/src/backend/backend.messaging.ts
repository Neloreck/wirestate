import { type BackendToPanel, BRIDGE_SOURCE } from "@/bridge/messages";

/**
 * Posts a message to the panel, wrapped in the bridge envelope the ISOLATED-world relay expects.
 *
 * @param payload - The message to deliver to the panel.
 */
export function post(payload: BackendToPanel): void {
  window.postMessage({ source: BRIDGE_SOURCE, dir: "to-content", payload }, "*");
}
