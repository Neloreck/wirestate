const path = require("node:path");

function swcTransform(decoratorOptions) {
  return [
    "@swc/jest",
    {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
          decorators: true,
        },
        transform: {
          react: { runtime: "automatic" },
          useDefineForClassFields: false,
          ...decoratorOptions,
        },
        target: "es2022",
        keepClassNames: true,
      },
      module: { type: "commonjs" },
    },
  ];
}

/**
 * Shared project options for both decorator transform modes.
 */
const shared = {
  setupFilesAfterEnv: [path.resolve(__dirname, "setup_tests.js")],
  rootDir: path.resolve(__dirname, "../.."),
  roots: ["<rootDir>/cli", "<rootDir>/src"],
  transformIgnorePatterns: ["node_modules/.pnpm/(?!@preact|@lit-labs|@adobe|lit|lit-html|@lit)"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^#/(.*)$": "<rootDir>/cli/$1",
    "^@/fixtures/(.*)$": "<rootDir>/src/fixtures/$1",
    "^@wirestate/core/devtools$": "<rootDir>/src/wirestate-core/devtools",
    "^@wirestate/core$": "<rootDir>/src/wirestate-core/index",
    "^@wirestate/lit$": "<rootDir>/src/wirestate-lit/index",
    "^@wirestate/lit-mobx$": "<rootDir>/src/wirestate-lit-mobx/index",
    "^@wirestate/lit-signals$": "<rootDir>/src/wirestate-lit-signals/index",
    "^@wirestate/mobx$": "<rootDir>/src/wirestate-mobx/index",
    "^@wirestate/react$": "<rootDir>/src/wirestate-react/index",
    "^@wirestate/react-mobx$": "<rootDir>/src/wirestate-react-mobx/index",
    "^@wirestate/react-signals$": "<rootDir>/src/wirestate-react-signals/index",
    "^@wirestate/signals$": "<rootDir>/src/wirestate-signals/index",
  },
};

module.exports = {
  rootDir: path.resolve(__dirname, "../.."),
  maxWorkers: "50%",
  reporters: [
    "default",
    ...(process.env.GITHUB_ACTIONS
      ? [["github-actions", { silent: false }], path.resolve(__dirname, "github-summary-reporter.js")]
      : []),
  ],
  coverageProvider: "v8",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/fixtures/",
    "/types/",
    "/examples/",
    "/target/",
    "/__tests__/",
    "/cli/test/",
  ],
  coverageDirectory: "<rootDir>/target/coverage",
  coverageReporters: ["json", "lcov", "clover"],
  projects: [
    {
      ...shared,
      // Legacy experimental decorators: sweeps every test file, including `*.tc39.test.ts` files.
      // Those run under BOTH transforms. Files using standard-exclusive syntax (the `accessor` keyword)
      // opt out via the `.tc39only.test.ts` suffix and run in the tc39 project alone.
      displayName: "legacy",
      testPathIgnorePatterns: ["\\.tc39only\\.test\\.[jt]sx?$"],
      transform: {
        "^.+\\.[tj]sx?$": swcTransform({ legacyDecorator: true }),
      },
    },
    {
      ...shared,
      // TC39 standard decorators: runs files opting in via the `.tc39.test.ts`
      // (dual-run) and `.tc39only.test.ts` (standard-exclusive syntax) suffixes.
      displayName: "tc39",
      testMatch: ["**/*.tc39.test.ts", "**/*.tc39.test.tsx", "**/*.tc39only.test.ts", "**/*.tc39only.test.tsx"],
      transform: {
        "\\.tc39only\\.test\\.[tj]sx?$": [
          "babel-jest",
          { configFile: path.resolve(__dirname, "babel.tc39.config.js") },
        ],
        "^.+\\.[tj]sx?$": swcTransform({ legacyDecorator: false, decoratorVersion: "2023-11" }),
      },
    },
  ],
};
