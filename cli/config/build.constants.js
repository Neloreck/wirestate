import * as path from "node:path";

export const EXTERNAL_DEPENDENCIES = [
  "react",
  "mobx",
  "mobx-react-lite",
  "@preact/signals-core",
  "@preact/signals-react",
  "@preact/signals-react/runtime",
  "tslib",
  "lit",
  "@lit/reactive-element",
  "@lit/context",
  "@lit-labs/preact-signals",
  "@adobe/lit-mobx",
];

export const PROJECT_ROOT = path.resolve(__dirname, "../..");
export const TARGET_ROOT = path.resolve(PROJECT_ROOT, "./target");
export const PKG_ROOT = path.resolve(TARGET_ROOT, "./pkg");

export const DIST_ROOT = path.resolve(TARGET_ROOT, "./dist");
export const STATS_ROOT = path.resolve(DIST_ROOT, "./stats");

export const TS_BUILD_CONFIG = path.resolve(__dirname, "./tsconfig.build.json");

export const SRC_PATH = path.resolve(PROJECT_ROOT, "./src");
