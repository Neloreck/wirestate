module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
        modules: false,
        loose: true,
        // The 2023-11 decorators transform desugars decorated classes through
        // static class blocks, so the feature must be enabled explicitly.
        include: ["@babel/plugin-transform-class-static-block"],
      },
    ],
    "@babel/preset-typescript",
    "@babel/preset-react",
  ],
  plugins: [
    "@babel/plugin-transform-modules-commonjs",
    ["@babel/plugin-proposal-decorators", { version: "2023-11" }],
    ["@babel/plugin-transform-class-properties", { loose: true }],
    ["@babel/plugin-transform-private-methods", { loose: true }],
    ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    [
      "module-resolver",
      {
        root: ["./"],
        alias: {
          "#": "./cli",
          "@/fixtures": "./src/fixtures",
          "@wirestate/core": "./src/wirestate-core",
          "@wirestate/lit": "./src/wirestate-lit",
          "@wirestate/lit-mobx": "./src/wirestate-lit-mobx",
          "@wirestate/lit-signals": "./src/wirestate-lit-signals",
          "@wirestate/mobx": "./src/wirestate-mobx",
          "@wirestate/react": "./src/wirestate-react",
          "@wirestate/react-mobx": "./src/wirestate-react-mobx",
          "@wirestate/react-signals": "./src/wirestate-react-signals",
          "@wirestate/signals": "./src/wirestate-signals",
        },
      },
    ],
  ],
};
