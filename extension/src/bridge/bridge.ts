import { CONTENT_PORT } from "@/bridge/bridge.messages";
import { BridgeRelay } from "@/bridge/bridge.relay";

/**
 * Isolated-world content-script entry and composition root. Constructs the relay, opens its worker
 * port, and wires the page's `message` events (from the MAIN-world backend) to the relay's handler.
 */
const relay: BridgeRelay = new BridgeRelay();

relay.connect(() => chrome.runtime.connect({ name: CONTENT_PORT }));

window.addEventListener("message", (event) => relay.onPageMessage(event));
