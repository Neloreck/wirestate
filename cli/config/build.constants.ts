import * as path from "node:path";

export const REPOSITORY_URL: string = "https://github.com/Neloreck/wirestate";

export const EXTERNAL_DEPENDENCIES: Array<string> = [
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

export const PROJECT_ROOT: string = path.resolve(__dirname, "../..");
export const TARGET_ROOT: string = path.resolve(PROJECT_ROOT, "./target");
export const PKG_ROOT: string = path.resolve(TARGET_ROOT, "./pkg");

export const DIST_ROOT: string = path.resolve(TARGET_ROOT, "./dist");
export const CHANGELOG_PATH: string = path.resolve(PROJECT_ROOT, "CHANGELOG.md");

export const SRC_PATH: string = path.resolve(PROJECT_ROOT, "./src");
