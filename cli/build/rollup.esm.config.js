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

const isExternal = (pkg) => (id) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));

const createPackageEsmConfig = (pkg, env) => ({
  external: isExternal(pkg),
  input: pkg.entries,
  output: {
    compact: env === EEnvironment.PRODUCTION,
    dir: path.resolve(DIST_ROOT, pkg.name, "esm", env),
    preserveModules: true,
    sourcemap: true,
    format: "es",
  },
  plugins: [
    clear({
      targets: [path.resolve(DIST_ROOT, pkg.name, "esm", env)],
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
      outDir: path.resolve(DIST_ROOT, pkg.name, "esm", env),
    }),
    commonjs(),
    babel({ ...BABEL_CONFIG, babelHelpers: "bundled" }),
    env === EEnvironment.PRODUCTION ? terser({ output: { beautify: false, comments: false } }) : null,
    visualizer({
      filename: path.resolve(STATS_ROOT, `${pkg.name}-esm-${env}-stats.html`),
      gzipSize: true,
      projectRoot: path.resolve(SRC_PATH, pkg.name),
    }),
  ].filter(Boolean),
});

export default PACKAGES.flatMap((pkg) => [
  createPackageEsmConfig(pkg, EEnvironment.PRODUCTION),
  createPackageEsmConfig(pkg, EEnvironment.DEVELOPMENT),
]);
