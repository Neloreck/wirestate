import * as path from "node:path";

import { SRC_PATH, EXTERNAL_DEPENDENCIES } from "./build.constants";

export const PACKAGES = [
  {
    name: "wirestate-core",
    entries: [
      path.resolve(SRC_PATH, "wirestate-core/index.ts"),
      path.resolve(SRC_PATH, "wirestate-core/test-utils.ts"),
    ],
    external: EXTERNAL_DEPENDENCIES,
  },
  {
    name: "wirestate-react",
    entries: [
      path.resolve(SRC_PATH, "wirestate-react/index.ts"),
      path.resolve(SRC_PATH, "wirestate-react/test-utils.ts"),
    ],
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
    entries: [path.resolve(SRC_PATH, "wirestate-lit/index.ts")],
    external: [...EXTERNAL_DEPENDENCIES, "lit", "@wirestate/core"],
  },
  {
    name: "wirestate-lit-signals",
    entries: [path.resolve(SRC_PATH, "wirestate-lit-signals/index.ts")],
    external: EXTERNAL_DEPENDENCIES,
  },
];
