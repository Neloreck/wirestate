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
      },
    ],
    "@babel/preset-typescript",
    "@babel/preset-react",
  ],
  plugins: [
    "@babel/plugin-transform-modules-commonjs",
    "babel-plugin-transform-typescript-metadata",
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-transform-class-properties", { loose: true }],
    ["@babel/plugin-transform-private-methods", { loose: true }],
    ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    [
      "module-resolver",
      {
        root: ["./"],
        alias: {
          "@": "./src",
          "@wirestate/core": "./src/wirestate-core",
          "@wirestate/react": "./src/wirestate-react",
          "@wirestate/react-mobx": "./src/wirestate-react-mobx",
          "@wirestate/react-signals": "./src/wirestate-react-signals",
        },
      },
    ],
    "macros",
  ],
};
