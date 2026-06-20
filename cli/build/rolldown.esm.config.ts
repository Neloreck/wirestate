import * as path from "node:path";

import { DIST_ROOT } from "../config/build.constants";
import { type BuildPackage, PACKAGES } from "../config/packages";

import { clean } from "./clean.plugin";
import { swcBuildPlugin, swcStripCommentsPlugin } from "./swc.config";

function isExternal(pkg: BuildPackage) {
  return (id: string) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));
}

function createPackageEsmConfig(pkg: BuildPackage) {
  const dir = path.resolve(DIST_ROOT, pkg.name, "esm");

  return {
    external: isExternal(pkg),
    input: pkg.entries,
    output: {
      dir,
      format: "es" as const,
      preserveModules: true,
      sourcemap: false,
    },
    plugins: [clean(dir), swcBuildPlugin(), swcStripCommentsPlugin()],
  };
}

export default PACKAGES.map((pkg) => createPackageEsmConfig(pkg));
