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
  EXTERNAL_DEPENDENCIES,
  PORTABLE_CORE_ENTRY,
  PORTABLE_CORE_LIT_SIGNALS_ENTRY,
  PORTABLE_CORE_REACT_MOBX_ENTRY,
  PORTABLE_CORE_REACT_SIGNALS_ENTRY,
  PORTABLE_DEBUG_ROOT,
  PORTABLE_ROOT,
  SRC_PATH,
  STATS_ROOT,
  TS_PORTABLE_CONFIG,
} from "../config/build.constants";

import { BABEL_CONFIG } from "./babel.modern.config";

const isLoggingEnabled = process.env.LIB_DEBUG_LOGGING === "true" || process.env.LIB_DEBUG_LOGGING === "1";

const createPortableConfig = (entry, isDebug) => ({
  external: EXTERNAL_DEPENDENCIES,
  input: entry,
  output: {
    compact: false,
    dir: isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT,
    preserveModules: false,
    sourcemap: true,
    format: "es",
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
    replace({ preventAssignment: true }),
    typescript({
      sourceMap: true,
      tsconfig: TS_PORTABLE_CONFIG,
      declaration: false,
      declarationMap: false,
      outDir: isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT,
    }),
    visualizer({
      filename: path.resolve(STATS_ROOT, "ptb-stats.html"),
      gzipSize: true,
      projectRoot: SRC_PATH,
    }),
    clear({
      targets: [isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT],
    }),
  ],
});

const createPortableDtsConfig = (entry, isDebug) => ({
  external: EXTERNAL_DEPENDENCIES,
  input: entry,
  output: {
    dir: isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT,
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
  PORTABLE_CORE_ENTRY,
  PORTABLE_CORE_LIT_SIGNALS_ENTRY,
  PORTABLE_CORE_REACT_SIGNALS_ENTRY,
  PORTABLE_CORE_REACT_MOBX_ENTRY,
]
  .map((entry) => [createPortableDtsConfig(entry, isLoggingEnabled), createPortableConfig(entry, isLoggingEnabled)])
  .flat();
