const path = require("path");

/**
 * Shared project options for both decorator transform modes.
 */
const shared = {
  setupFilesAfterEnv: [path.resolve(__dirname, "setup_tests.js")],
  rootDir: path.resolve(__dirname, "../.."),
  roots: ["<rootDir>/cli", "<rootDir>/src"],
  transformIgnorePatterns: ["node_modules/.pnpm/(?!@preact|@lit-labs|@adobe|lit|lit-html|@lit)"],
  testEnvironment: "jsdom",
};

module.exports = {
  rootDir: path.resolve(__dirname, "../.."),
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/", "/fixtures/", "/types/", "/examples/", "/target/", "/__tests__/"],
  coverageDirectory: "<rootDir>/target/coverage",
  coverageReporters: ["json", "lcov", "clover"],
  projects: [
    {
      ...shared,
      // Legacy experimental decorators: sweeps every test file, including
      // `*.tc39.test.ts` files — those run under BOTH transforms.
      displayName: "legacy",
      transform: {
        "^.+\\.[t|j]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.test.config.js") }],
      },
    },
    {
      ...shared,
      // TC39 standard decorators: runs only files opting in via the
      // `.tc39.test.ts` suffix.
      displayName: "tc39",
      testMatch: ["**/*.tc39.test.ts", "**/*.tc39.test.tsx"],
      transform: {
        "^.+\\.[t|j]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.tc39.config.js") }],
      },
    },
  ],
};
