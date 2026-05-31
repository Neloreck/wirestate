import * as path from "node:path";

import { SRC_PATH, EXTERNAL_DEPENDENCIES } from "./build.constants";

export const STABLE_PACKAGE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export const PACKAGES = [
  {
    name: "wirestate-core",
    entries: [path.resolve(SRC_PATH, "wirestate-core/index.ts")],
    external: EXTERNAL_DEPENDENCIES,
  },
  {
    name: "wirestate-react",
    entries: [path.resolve(SRC_PATH, "wirestate-react/index.ts")],
    external: [...EXTERNAL_DEPENDENCIES, "@wirestate/core"],
  },
  {
    name: "wirestate-react-mobx",
    entries: [path.resolve(SRC_PATH, "wirestate-react-mobx/index.ts")],
    external: EXTERNAL_DEPENDENCIES,
  },
  {
    name: "wirestate-react-signals",
    entries: [path.resolve(SRC_PATH, "wirestate-react-signals/index.ts")],
    external: EXTERNAL_DEPENDENCIES,
  },
  {
    name: "wirestate-lit",
    entries: [path.resolve(SRC_PATH, "wirestate-lit/index.ts"), path.resolve(SRC_PATH, "wirestate-lit/test-utils.ts")],
    external: [...EXTERNAL_DEPENDENCIES, "lit", "@wirestate/core"],
  },
  {
    name: "wirestate-lit-signals",
    entries: [path.resolve(SRC_PATH, "wirestate-lit-signals/index.ts")],
    external: EXTERNAL_DEPENDENCIES,
  },
  {
    name: "wirestate",
    entries: [
      path.resolve(SRC_PATH, "wirestate/index.ts"),
      path.resolve(SRC_PATH, "wirestate/mobx.ts"),
      path.resolve(SRC_PATH, "wirestate/signals.ts"),
    ],
    external: [...EXTERNAL_DEPENDENCIES],
  },
];
