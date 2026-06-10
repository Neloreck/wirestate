const path = require("path");

module.exports = {
  displayName: "tc39",
  setupFilesAfterEnv: [path.resolve(__dirname, "setup_tests.js")],
  rootDir: "../..",
  roots: ["<rootDir>/cli", "<rootDir>/src"],
  testMatch: ["**/__tc39__/**/*.test.ts"],
  transform: {
    "^.+\\.[t|j]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.tc39.config.js") }],
  },
  transformIgnorePatterns: ["node_modules/.pnpm/(?!@preact|@lit-labs|@adobe|lit|lit-html|@lit)"],
  testEnvironment: "jsdom",
  globals: {},
};
