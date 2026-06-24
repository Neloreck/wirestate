export default {
  assumptions: {
    setPublicClassFields: true,
    privateFieldsAsProperties: true,
  },
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
        modules: false,
      },
    ],
    "@babel/preset-typescript",
    "@babel/preset-react",
  ],
  plugins: [
    "@babel/plugin-transform-modules-commonjs",
    ["@babel/plugin-proposal-decorators", { version: "legacy" }],
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-transform-private-methods",
    "@babel/plugin-transform-private-property-in-object",
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
