import { fileURLToPath } from "node:url";

import { crx } from "@crxjs/vite-plugin";
import { default as tailwindcss } from "@tailwindcss/vite";
import { default as react } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { default as manifest } from "./manifest.config";

const SRC_DIR: string = fileURLToPath(new URL("./src", import.meta.url));
const PROTOCOL_SRC: string = fileURLToPath(new URL("../src/wirestate-core/devtools.ts", import.meta.url));
const CORE_SRC: string = fileURLToPath(new URL("../src/wirestate-core/index.ts", import.meta.url));
const REACT_SRC: string = fileURLToPath(new URL("../src/wirestate-react/index.ts", import.meta.url));
const MOBX_SRC: string = fileURLToPath(new URL("../src/wirestate-mobx/index.ts", import.meta.url));
const REACT_MOBX_SRC: string = fileURLToPath(new URL("../src/wirestate-react-mobx/index.ts", import.meta.url));

const CHROME_TARGET: string = "chrome99";

// https://crxjs.dev / https://tailwindcss.com / https://vite.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": SRC_DIR,
      // More specific aliases first so `@rollup/plugin-alias` prefix-matching doesn't mis-resolve them.
      "@wirestate/core/devtools": PROTOCOL_SRC,
      "@wirestate/react-mobx": REACT_MOBX_SRC,
      "@wirestate/react": REACT_SRC,
      "@wirestate/mobx": MOBX_SRC,
      "@wirestate/core": CORE_SRC,
    },
  },
  oxc: { target: CHROME_TARGET, decorator: { legacy: true } },
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    target: CHROME_TARGET,
    rolldownOptions: {
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
