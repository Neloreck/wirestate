import { defineManifest } from "@crxjs/vite-plugin";

/**
 * MV3 manifest. Declares the four execution contexts of the inspector:
 *
 * - `content_scripts[0]` — the **backend**, injected into the page's MAIN world at
 *   `document_start` so it can pre-seed `globalThis.__WIRESTATE_DEVTOOLS_HOOK__` before the
 *   app's `DevToolsPlugin` installs (first-writer-wins handshake, ADR 0011 Decision 1).
 * - `content_scripts[1]` — the **bridge relay**, in the ISOLATED world, ferrying messages
 *   between the MAIN-world backend (`window.postMessage`) and the background worker (port).
 * - `background` — the service-worker half of the bridge, pairing a page's relay with its panel.
 * - `devtools_page` — registers the panel in the browser DevTools window.
 */
export default defineManifest({
  manifest_version: 3,
  name: "Wirestate DevTools",
  version: "0.0.0",
  description: "Inspect Wirestate containers, bindings, instances, declared handlers, and the live message stream.",
  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
  minimum_chrome_version: "111",
  devtools_page: "src/devtools/devtools.html",
  background: {
    service_worker: "src/bridge/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/backend/backend.ts"],
      run_at: "document_start",
      world: "MAIN",
    },
    {
      matches: ["<all_urls>"],
      js: ["src/bridge/content-script.ts"],
      run_at: "document_start",
      world: "ISOLATED",
    },
  ],
  host_permissions: ["<all_urls>"],
});
