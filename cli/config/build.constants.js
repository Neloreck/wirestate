import * as path from "node:path";

export const EXTERNAL_DEPENDENCIES = [
  "@adobe/lit-mobx",
  "@lit-labs/preact-signals",
  "@lit/context",
  "@lit/reactive-element",
  "@preact/signals-core",
  "@preact/signals-react",
  "@preact/signals-react/runtime",
  "@swc/helpers",
  "@wirestate/core",
  "@wirestate/lit-mobx",
  "@wirestate/lit-signals",
  "@wirestate/mobx",
  "@wirestate/react",
  "@wirestate/react-mobx",
  "@wirestate/react-signals",
  "@wirestate/signals",
  "lit",
  "mobx",
  "mobx-react-lite",
  "react",
];

export const PROJECT_ROOT = path.resolve(__dirname, "../..");
export const TARGET_ROOT = path.resolve(PROJECT_ROOT, "./target");
export const PKG_ROOT = path.resolve(TARGET_ROOT, "./pkg");

export const DIST_ROOT = path.resolve(TARGET_ROOT, "./dist");
export const STATS_ROOT = path.resolve(DIST_ROOT, "./stats");

export const SRC_PATH = path.resolve(PROJECT_ROOT, "./src");
