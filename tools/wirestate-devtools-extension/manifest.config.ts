import { defineManifest } from "@crxjs/vite-plugin";

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
      js: ["src/bridge/bridge.ts"],
      run_at: "document_start",
      world: "ISOLATED",
    },
  ],
  host_permissions: ["<all_urls>"],
});
