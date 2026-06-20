import * as path from "node:path";

import { dts } from "rolldown-plugin-dts";

import { DIST_ROOT } from "../config/build.constants";
import { type BuildPackage, PACKAGES } from "../config/packages";

import { clean } from "./clean.plugin";
import { isExternal } from "./external.check";
import { formatDts } from "./format-dts.plugin";

function createPackageDtsConfig(pkg: BuildPackage) {
  const dir = path.resolve(DIST_ROOT, pkg.name, "dts");

  return {
    external: isExternal(pkg),
    input: pkg.entries,
    output: {
      chunkFileNames: "lib.d.ts",
      dir,
      format: "es" as const,
      sourcemap: false,
    },
    plugins: [
      clean(dir),
      dts({
        emitDtsOnly: true,
        oxc: true,
      }),
      formatDts(),
    ],
  };
}

export default PACKAGES.map((pkg) => createPackageDtsConfig(pkg));
