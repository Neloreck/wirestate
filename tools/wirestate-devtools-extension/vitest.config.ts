import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Standalone from vite.config.ts on purpose:
// the crx/tailwind plugins expect a browser build context and aren't needed to unit-test pure logic.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@wirestate/core/devtools": fileURLToPath(new URL("../../src/wirestate-core/devtools.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
