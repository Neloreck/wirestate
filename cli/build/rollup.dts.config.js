import * as path from "path";

import { default as clear } from "rollup-plugin-clear";
import { default as dts } from "rollup-plugin-dts";

import { default as tsconfig } from "../../tsconfig.json";
import { DIST_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

const isExternal = (pkg) => (id) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));

const createPackageDtsConfig = (pkg) => ({
  external: isExternal(pkg),
  input: pkg.entries,
  output: {
    chunkFileNames: "lib.d.ts",
    dir: path.resolve(DIST_ROOT, pkg.name, "dts"),
    format: "es",
    sourcemap: false,
  },
  plugins: [
    dts.default({
      compilerOptions: {
        baseUrl: tsconfig.compilerOptions.baseUrl,
        paths: tsconfig.compilerOptions.paths,
        rootDir: tsconfig.compilerOptions.rootDir,
        sourceMap: false,
      },
    }),
    clear({
      targets: [path.resolve(DIST_ROOT, pkg.name, "dts")],
    }),
  ],
});

export default PACKAGES.map((pkg) => createPackageDtsConfig(pkg));
