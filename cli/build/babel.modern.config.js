export const BABEL_CONFIG = {
  extensions: [".ts", ".js"],
  presets: [
    [
      "@babel/preset-env",
      {
        modules: false,
        loose: true,
        targets: "> 10%",
        // The 2023-11 decorators transform desugars decorated classes through
        // static class blocks, so the feature must be enabled explicitly.
        include: ["@babel/plugin-transform-class-static-block"],
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { version: "2023-11" }],
    [
      "module-resolver",
      {
        root: ["./"],
        alias: {
          "@": "./src",
        },
      },
    ],
    [
      "macros",
      {
        "babel-plugin-macros": {
          configName: "macros",
        },
      },
    ],
  ],
};
