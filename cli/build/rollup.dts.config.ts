import * as path from "node:path";

import { default as clear } from "rollup-plugin-clear";
import { dts } from "rollup-plugin-dts";

import { default as tsconfig } from "../../tsconfig.json";
import { DIST_ROOT } from "../config/build.constants";
import { PACKAGES, type BuildPackage } from "../config/packages";

const isExternal = (pkg: BuildPackage) => (id: string) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));

const createPackageDtsConfig = (pkg: BuildPackage) => ({
  external: isExternal(pkg),
  input: pkg.entries,
  output: {
    chunkFileNames: "lib.d.ts",
    dir: path.resolve(DIST_ROOT, pkg.name, "dts"),
    format: "es",
    sourcemap: false,
  },
  plugins: [
    dts({
      compilerOptions: {
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
