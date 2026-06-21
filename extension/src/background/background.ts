import { BackgroundRouter } from "@/background/background.router";

/**
 * Background service-worker entry and composition root. Constructs the router and wires Chrome's
 * port-connection events to it; the router pairs each page relay with its panel and relays messages.
 */
const router: BackgroundRouter = new BackgroundRouter();

chrome.runtime.onConnect.addListener((port) => router.onConnect(port));
