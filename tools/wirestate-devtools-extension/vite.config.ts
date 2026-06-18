import { fileURLToPath } from "node:url";

import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import manifest from "./manifest.config";

const srcDir: string = fileURLToPath(new URL("./src", import.meta.url));

// All `@wirestate/core/devtools` imports here are type-only (erased before bundling); this alias
// mirrors the tsconfig `paths` entry and points the public specifier at the published barrel.
const protocolSource: string = fileURLToPath(new URL("../../src/wirestate-core/devtools.ts", import.meta.url));

// https://crxjs.dev / https://tailwindcss.com / https://vite.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": srcDir,
      "@wirestate/core/devtools": protocolSource,
    },
  },
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    rollupOptions: {
      // The DevTools panel page is referenced only as a runtime string in
      // `chrome.devtools.panels.create(...)`, so crx can't discover it from the manifest.
      // Register it explicitly so the panel (and its React bundle) is emitted.
      input: {
        panel: "src/panel/panel.html",
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    // crx HMR needs a websocket port the page can reach.
    hmr: { port: 5181 },
  },
});
