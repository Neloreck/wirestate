export default {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
        modules: false,
        loose: true,
      },
    ],
    "@babel/preset-typescript",
    "@babel/preset-react",
  ],
  plugins: [
    "@babel/plugin-transform-modules-commonjs",
    ["@babel/plugin-proposal-decorators", { legacy: true }],
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
