import { fileURLToPath } from "node:url";

import { crx } from "@crxjs/vite-plugin";
import { default as tailwindcss } from "@tailwindcss/vite";
import { default as react } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { default as manifest } from "./manifest.config";

const SRC_DIR: string = fileURLToPath(new URL("./src", import.meta.url));
const PROTOCOL_SRC: string = fileURLToPath(new URL("../src/wirestate-core/devtools.ts", import.meta.url));

const CHROME_TARGET: string = "chrome99";

// https://crxjs.dev / https://tailwindcss.com / https://vite.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": SRC_DIR,
      "@wirestate/core/devtools": PROTOCOL_SRC,
    },
  },
  esbuild: { target: CHROME_TARGET },
  optimizeDeps: { esbuildOptions: { target: CHROME_TARGET } },
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    target: CHROME_TARGET,
    rollupOptions: {
      input: {
        panel: "src/panel/panel.html",
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    hmr: { port: 5181 },
  },
});
