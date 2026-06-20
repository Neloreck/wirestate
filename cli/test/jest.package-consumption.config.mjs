import path from "node:path";

export default {
  collectCoverage: false,
  rootDir: "../..",
  setupFilesAfterEnv: [path.resolve(import.meta.dirname, "setup_tests.js")],
  testEnvironment: "node",
  testMatch: ["<rootDir>/cli/test/package-consumption.e2e.ts"],
  testTimeout: 120000,
  modulePathIgnorePatterns: ["<rootDir>/target"],
  transform: {
    "^.+\\.[t|j]sx?$": ["babel-jest", { configFile: path.resolve(import.meta.dirname, "babel.e2e.config.mjs") }],
  },
  transformIgnorePatterns: ["/node_modules/"],
};
