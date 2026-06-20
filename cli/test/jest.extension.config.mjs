import * as path from "node:path";

import { swcTransform } from "./jest.swc-transform.mjs";

export default {
  rootDir: path.resolve(import.meta.dirname, "../.."),
  displayName: "extension",
  maxWorkers: "50%",
  reporters: [
    "default",
    ...(process.env.GITHUB_ACTIONS
      ? [["github-actions", { silent: false }], path.resolve(import.meta.dirname, "github-summary-reporter.js")]
      : []),
  ],
  setupFilesAfterEnv: [path.resolve(import.meta.dirname, "setup_tests.js")],
  roots: ["<rootDir>/extension/src"],
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": swcTransform({ legacyDecorator: false, decoratorVersion: "2023-11" }),
  },
  transformIgnorePatterns: ["node_modules/.pnpm/(?!@preact|@lit-labs|@adobe|lit|lit-html|@lit)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/extension/src/$1",
    "^@wirestate/core/devtools$": "<rootDir>/src/wirestate-core/devtools",
    "^@wirestate/core$": "<rootDir>/src/wirestate-core/index",
  },
};
