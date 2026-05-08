import * as path from "path";

import { babel } from "@rollup/plugin-babel";
import { default as commonjs } from "@rollup/plugin-commonjs";
import { default as replace } from "@rollup/plugin-replace";
import { default as terser } from "@rollup/plugin-terser";
import { default as typescript } from "@rollup/plugin-typescript";
import { default as clear } from "rollup-plugin-clear";
import { visualizer } from "rollup-plugin-visualizer";

import { DIST_ROOT, EEnvironment, SRC_PATH, STATS_ROOT, TS_BUILD_CONFIG } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

import { BABEL_CONFIG } from "./babel.modern.config";

const createPackageCjsConfig = (pkg, env) => ({
  external: pkg.external,
  input: pkg.entries,
  output: {
    chunkFileNames: "lib.js",
    compact: env === EEnvironment.PRODUCTION,
    dir: path.resolve(DIST_ROOT, pkg.name, "cjs", env),
    sourcemap: true,
    format: "cjs",
  },
  plugins: [
    clear({
      targets: [path.resolve(DIST_ROOT, pkg.name, "cjs", env)],
    }),
    replace({
      preventAssignment: true,
      IS_DEV: (env !== EEnvironment.PRODUCTION).toString(),
    }),
    typescript({
      tsconfig: TS_BUILD_CONFIG,
      declaration: false,
      declarationMap: false,
      outDir: path.resolve(DIST_ROOT, pkg.name, "cjs", env),
    }),
    commonjs(),
    babel({ ...BABEL_CONFIG, babelHelpers: "bundled" }),
    env === EEnvironment.PRODUCTION ? terser({ output: { beautify: false, comments: false } }) : null,
    visualizer({
      filename: path.resolve(STATS_ROOT, `${pkg.name}-cjs-${env}-stats.html`),
      gzipSize: true,
      projectRoot: path.resolve(SRC_PATH, pkg.name),
    }),
  ].filter(Boolean),
});

export default PACKAGES.flatMap((pkg) => [
  createPackageCjsConfig(pkg, EEnvironment.PRODUCTION),
  createPackageCjsConfig(pkg, EEnvironment.DEVELOPMENT),
]);
