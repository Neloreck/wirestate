const path = require("path");

module.exports = {
  coveragePathIgnorePatterns: ["/node_modules/", "/fixtures/", "/types/", "/examples/", "/target/", "/__tests__/"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/target/coverage",
  setupFilesAfterEnv: [path.resolve(__dirname, "setup_tests.js")],
  rootDir: "../..",
  transform: {
    "^.+\\.[t|j]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.test.config.js") }],
  },
  transformIgnorePatterns: ["node_modules/.pnpm/(?!inversify|@inversifyjs)"],
  testEnvironment: "jsdom",
  globals: {
    IS_DEV: true,
  },
};
