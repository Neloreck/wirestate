import * as path from "node:path";

import { DIST_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

import { clean } from "./clean.plugin";
import { isExternal } from "./external.check";
import { swcBuildPlugin, swcStripCommentsPlugin } from "./swc.config";

export default PACKAGES.map((pkg) => {
  const dir = path.resolve(DIST_ROOT, pkg.name, "esm");

  return {
    external: isExternal(pkg),
    input: pkg.entries,
    // Keeps `process.env.NODE_ENV` verbatim in library output, so development-only branches
    // are folded by the consumer bundler (which knows the real mode), not at lib-build time.
    platform: "neutral" as const,
    output: {
      dir,
      format: "es" as const,
      preserveModules: true,
      sourcemap: false,
    },
    plugins: [clean(dir), swcBuildPlugin(), swcStripCommentsPlugin()],
  };
});
