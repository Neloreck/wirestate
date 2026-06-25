import * as path from "node:path";

import { swcTransform } from "./jest.swc-transform.mjs";

export default {
  rootDir: path.resolve(import.meta.dirname, "../.."),
  displayName: "extension",
  maxWorkers: "50%",
  reporters: [
    "default",
    ...(process.env.GITHUB_ACTIONS
      ? [["github-actions", { silent: false }], path.resolve(import.meta.dirname, "github-summary-reporter.mjs")]
      : []),
  ],
  setupFilesAfterEnv: [path.resolve(import.meta.dirname, "setup_tests.js")],
  roots: ["<rootDir>/extension/src"],
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": swcTransform({ legacyDecorator: true }),
  },
  transformIgnorePatterns: ["node_modules/.pnpm/(?!@preact|@lit-labs|@adobe|lit|lit-html|@lit)"],
  moduleNameMapper: {
    "^#/devtools$": "<rootDir>/src/wirestate-core/plugin/devtools/index",
    "^@/(.*)$": "<rootDir>/extension/src/$1",
    "^@wirestate/core/devtools$": "<rootDir>/src/wirestate-core/devtools",
    "^@wirestate/react-mobx$": "<rootDir>/src/wirestate-react-mobx/index",
    "^@wirestate/react$": "<rootDir>/src/wirestate-react/index",
    "^@wirestate/mobx$": "<rootDir>/src/wirestate-mobx/index",
    "^@wirestate/core$": "<rootDir>/src/wirestate-core/index",
  },
};
