import * as path from "path";

import { babel } from "@rollup/plugin-babel";
import { default as commonjs } from "@rollup/plugin-commonjs";
import { default as typescript } from "@rollup/plugin-typescript";
import { default as clear } from "rollup-plugin-clear";
import { visualizer } from "rollup-plugin-visualizer";

import { DIST_ROOT, SRC_PATH, STATS_ROOT, TS_BUILD_CONFIG } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

import { BABEL_CONFIG } from "./babel.modern.config";

const isExternal = (pkg) => (id) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));

const createPackageEsmConfig = (pkg) => ({
  external: isExternal(pkg),
  input: pkg.entries,
  output: {
    dir: path.resolve(DIST_ROOT, pkg.name, "esm"),
    preserveModules: true,
    sourcemap: false,
    format: "es",
  },
  plugins: [
    clear({
      targets: [path.resolve(DIST_ROOT, pkg.name, "esm")],
    }),
    typescript({
      sourceMap: false,
      tsconfig: TS_BUILD_CONFIG,
      pretty: true,
      declaration: false,
      declarationMap: false,
      outDir: path.resolve(DIST_ROOT, pkg.name, "esm"),
    }),
    commonjs(),
    babel({ ...BABEL_CONFIG, babelHelpers: "bundled" }),
    visualizer({
      filename: path.resolve(STATS_ROOT, `${pkg.name}-esm-stats.html`),
      gzipSize: true,
      projectRoot: path.resolve(SRC_PATH, pkg.name),
    }),
  ],
});

export default PACKAGES.map((pkg) => createPackageEsmConfig(pkg));
