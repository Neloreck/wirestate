import * as path from "path";

import { default as commonjs } from "@rollup/plugin-commonjs";
import { default as clear } from "rollup-plugin-clear";
import { visualizer } from "rollup-plugin-visualizer";

import { DIST_ROOT, SRC_PATH, STATS_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

import { swcBuildPlugin, swcStripCommentsPlugin } from "./swc.config";

function isExternal(pkg) {
  return (id) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));
}

function createPackageEsmConfig(pkg) {
  return {
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
      swcBuildPlugin(),
      commonjs(),
      swcStripCommentsPlugin(),
      visualizer({
        filename: path.resolve(STATS_ROOT, `${pkg.name}-esm-stats.html`),
        gzipSize: true,
        projectRoot: path.resolve(SRC_PATH, pkg.name),
      }),
    ],
  };
}

export default PACKAGES.map((pkg) => createPackageEsmConfig(pkg));
