import * as path from "path";

import { babel } from "@rollup/plugin-babel";
import { default as commonjs } from "@rollup/plugin-commonjs";
import { default as replace } from "@rollup/plugin-replace";
import { default as terser } from "@rollup/plugin-terser";
import { default as typescript } from "@rollup/plugin-typescript";
import { default as clear } from "rollup-plugin-clear";
import { visualizer } from "rollup-plugin-visualizer";

import {
  CORE_ENTRY,
  TEST_UTILS_ENTRY,
  MOBX_ENTRY,
  TS_BUILD_CONFIG,
  CJS_ROOT,
  EEnvironment,
  WS_ROOT,
  STATS_ROOT,
} from "../config/build.constants";

import { BABEL_CONFIG } from "./babel.modern.config";

const createCjsConfig = (env) => ({
  external: ["react", "inversify", "mobx", "mobx-react-lite", "tslib"],
  input: [CORE_ENTRY, TEST_UTILS_ENTRY, MOBX_ENTRY],
  output: {
    chunkFileNames: "lib.js",
    compact: env === EEnvironment.PRODUCTION,
    dir: path.resolve(CJS_ROOT, env),
    sourcemap: true,
    format: "cjs",
  },
  plugins: [
    typescript({
      tsconfig: TS_BUILD_CONFIG,
      declaration: false,
      declarationMap: false,
      outDir: path.resolve(CJS_ROOT, env),
    }),
    commonjs(),
    babel({ ...BABEL_CONFIG, babelHelpers: "bundled" }),
    replace({
      preventAssignment: true,
      IS_DEV: (env !== EEnvironment.PRODUCTION).toString(),
    }),
  ]
    .concat(env === EEnvironment.PRODUCTION ? [terser({ output: { beautify: false, comments: false } })] : [])
    .concat([
      visualizer({
        filename: path.resolve(STATS_ROOT, `cjs-${env}-stats.html`),
        gzipSize: true,
        projectRoot: WS_ROOT,
      }),
      clear({
        targets: [path.resolve(CJS_ROOT, env)],
      }),
    ]),
});

export default [createCjsConfig(EEnvironment.PRODUCTION), createCjsConfig(EEnvironment.DEVELOPMENT)];
