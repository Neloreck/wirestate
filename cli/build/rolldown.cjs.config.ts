import * as path from "node:path";

import { DIST_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

import { clean } from "./clean.plugin";
import { isExternal } from "./external.check";
import { swcBuildPlugin, swcStripCommentsPlugin } from "./swc.config";

export default PACKAGES.map((pkg) => {
  const dir = path.resolve(DIST_ROOT, pkg.name, "cjs");

  return {
    external: isExternal(pkg),
    input: pkg.entries,
    output: {
      chunkFileNames: "lib.js",
      dir,
      format: "cjs" as const,
      sourcemap: false,
    },
    plugins: [clean(dir), swcBuildPlugin(), swcStripCommentsPlugin()],
  };
});
