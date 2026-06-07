import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { default as observerPlugin } from "mobx-react-observer/vite-plugin";
import { defineConfig, type Plugin } from "vite";

function mobxObserverPlugin(): Plugin {
  const plugin: Plugin = observerPlugin();
  const transform: Plugin["transform"] = plugin.transform;

  return {
    ...plugin,
    async transform(code, id, options) {
      const filePath: string = id.split("?", 1)[0];

      if (!filePath.endsWith(".tsx")) {
        return null;
      }

      if (typeof transform === "function") {
        return transform.call(this, code, id, options);
      }

      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    mobxObserverPlugin(),
    react(),
    babel({
      presets: [reactCompilerPreset(), "@babel/preset-typescript"],
      plugins: [
        "babel-plugin-transform-typescript-metadata",
        ["@babel/plugin-proposal-decorators", { version: "legacy" }],
        ["@babel/plugin-transform-class-properties", { loose: true }],
      ],
    }),
  ],
});
