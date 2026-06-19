const path = require("path");

module.exports = {
  collectCoverage: false,
  rootDir: "../..",
  setupFilesAfterEnv: [path.resolve(__dirname, "setup_tests.js")],
  testEnvironment: "node",
  testMatch: ["<rootDir>/cli/test/package-consumption.e2e.ts"],
  testTimeout: 120000,
  modulePathIgnorePatterns: ["<rootDir>/target"],
  transform: {
    "^.+\\.[t|j]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.e2e.config.js") }],
  },
  transformIgnorePatterns: ["/node_modules/"],
};
