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
  EEnvironment,
  EXTERNAL_DEPENDENCIES,
  MOBX_ENTRY,
  PORTABLE_DEBUG_ROOT,
  PORTABLE_ENTRY,
  PORTABLE_ROOT,
  STATS_ROOT,
  TS_PORTABLE_CONFIG,
  WS_ROOT,
} from "../config/build.constants";

import { BABEL_CONFIG } from "./babel.modern.config";

const isLoggingEnabled = process.env.LIB_DEBUG_LOGGING === "true" || process.env.LIB_DEBUG_LOGGING === "1";

const createPortableConfig = (env, isDebug) => ({
  external: EXTERNAL_DEPENDENCIES,
  input: [PORTABLE_ENTRY, MOBX_ENTRY],
  output: {
    compact: env === EEnvironment.PRODUCTION,
    dir: isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT,
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.facadeModuleId === MOBX_ENTRY) {
        return "mobx.js";
      }

      return "wirestate.js";
    },
    preserveModules: false,
    sourcemap: true,
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
      sourceMap: true,
      tsconfig: TS_PORTABLE_CONFIG,
      declaration: false,
      declarationMap: false,
      outDir: isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT,
    }),
    visualizer({
      filename: path.resolve(STATS_ROOT, "ptb-stats.html"),
      gzipSize: true,
      projectRoot: WS_ROOT,
    }),
    clear({
      targets: [isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT],
    }),
  ],
});

const createPortableDtsConfig = (env, isDebug) => ({
  external: EXTERNAL_DEPENDENCIES,
  input: [PORTABLE_ENTRY, MOBX_ENTRY],
  output: {
    dir: isDebug ? PORTABLE_DEBUG_ROOT : PORTABLE_ROOT,
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.facadeModuleId === MOBX_ENTRY) {
        return "mobx.d.ts";
      }

      return "wirestate.d.ts";
    },
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
  createPortableDtsConfig(EEnvironment.PRODUCTION, isLoggingEnabled),
  createPortableConfig(EEnvironment.PRODUCTION, isLoggingEnabled),
];
