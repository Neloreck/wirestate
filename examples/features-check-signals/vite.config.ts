import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset(), "@babel/preset-typescript"],
      plugins: [
        "module:@preact/signals-react-transform",
        "babel-plugin-transform-typescript-metadata",
        ["@babel/plugin-proposal-decorators", { version: "legacy" }],
        ["@babel/plugin-transform-class-properties", { loose: true }],
      ],
    }),
  ],
});
