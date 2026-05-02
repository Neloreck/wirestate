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
  EEnvironment,
  ESM_ROOT,
  EXTERNAL_DEPENDENCIES,
  MOBX_ENTRY,
  STATS_ROOT,
  TEST_UTILS_ENTRY,
  TS_BUILD_CONFIG,
  WS_ROOT,
} from "../config/build.constants";

import { BABEL_CONFIG } from "./babel.modern.config";

const createEsmConfig = (env) => ({
  external: EXTERNAL_DEPENDENCIES,
  input: [CORE_ENTRY, TEST_UTILS_ENTRY, MOBX_ENTRY],
  output: {
    compact: env === EEnvironment.PRODUCTION,
    dir: path.resolve(ESM_ROOT, env),
    preserveModules: true,
    sourcemap: true,
    format: "es",
  },
  plugins: [
    clear({
      targets: [path.resolve(ESM_ROOT, env)],
    }),
    replace({
      preventAssignment: true,
      IS_DEV: env !== EEnvironment.PRODUCTION,
    }),
    typescript({
      sourceMap: true,
      tsconfig: TS_BUILD_CONFIG,
      pretty: env !== EEnvironment.PRODUCTION,
      declaration: false,
      declarationMap: false,
      outDir: path.resolve(ESM_ROOT, env),
    }),
    commonjs(),
    babel({ ...BABEL_CONFIG, babelHelpers: "bundled" }),
    env === EEnvironment.PRODUCTION ? terser({ output: { beautify: false, comments: false } }) : null,
    visualizer({
      filename: path.resolve(STATS_ROOT, `esm-${env}-stats.html`),
      gzipSize: true,
      projectRoot: WS_ROOT,
    }),
  ].filter(Boolean),
});

export default [createEsmConfig(EEnvironment.PRODUCTION), createEsmConfig(EEnvironment.DEVELOPMENT)];
