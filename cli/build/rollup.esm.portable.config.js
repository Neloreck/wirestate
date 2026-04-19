import * as path from "path";

import { babel } from "@rollup/plugin-babel";
import { default as commonjs } from "@rollup/plugin-commonjs";
import { default as replace } from "@rollup/plugin-replace";
import { default as typescript } from "@rollup/plugin-typescript";
import { default as clear } from "rollup-plugin-clear";
import { default as dts } from "rollup-plugin-dts";
import { visualizer } from "rollup-plugin-visualizer";

import { default as tsconfig } from "../../tsconfig.json";
import {
  PORTABLE_ENTRY,
  TS_PORTABLE_CONFIG,
  PORTABLE_ROOT,
  EEnvironment,
  WS_ROOT,
  STATS_ROOT,
} from "../config/build.constants";

import { BABEL_CONFIG } from "./babel.modern.config";

const isLoggingEnabled = process.env.LIB_DEBUG_LOGGING === "true" || process.env.LIB_DEBUG_LOGGING === "1";

const createPortableConfig = (env, name) => ({
  external: ["react", "mobx", "mobx-react-lite", "inversify", "tslib"],
  input: PORTABLE_ENTRY,
  output: {
    compact: env === EEnvironment.PRODUCTION,
    file: path.resolve(PORTABLE_ROOT, name),
    preserveModules: false,
    sourcemap: false,
    format: "es",
    banner: "'use no memo';",
  },
  plugins: [
    babel({
      ...BABEL_CONFIG,
      babelHelpers: "bundled",
      skipPreflightCheck: true,
      include: ["src/**/*"],
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      IS_DEV: env !== EEnvironment.PRODUCTION,
      __filename: (id) => `"${path.relative(WS_ROOT, id)}"`,
    }),
    typescript({
      sourceMap: false,
      tsconfig: TS_PORTABLE_CONFIG,
      declaration: false,
    }),
    visualizer({
      filename: path.resolve(STATS_ROOT, "ptb-stats.html"),
      gzipSize: true,
      projectRoot: WS_ROOT,
    }),
    clear({
      targets: [PORTABLE_ROOT],
    }),
  ],
});

const createPortableDtsConfig = (env, name) => ({
  input: [PORTABLE_ENTRY],
  output: {
    file: path.resolve(PORTABLE_ROOT, name),
    format: "es",
  },
  plugins: [
    dts.default({
      compilerOptions: {
        baseUrl: tsconfig.compilerOptions.baseUrl,
        paths: tsconfig.compilerOptions.paths,
        rootDir: tsconfig.compilerOptions.rootDir,
      },
    }),
  ],
});

export default [
  createPortableDtsConfig(EEnvironment.PRODUCTION, isLoggingEnabled ? "wirestate.debug.d.ts" : "wirestate.d.ts"),
  createPortableConfig(EEnvironment.PRODUCTION, isLoggingEnabled ? "wirestate.debug.js" : "wirestate.js"),
];
