import { execSync } from "node:child_process";
import * as path from "node:path";

import { PKG_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

const tag = process.argv.includes("--tag") ? process.argv[process.argv.indexOf("--tag") + 1] : undefined;

for (const pkg of PACKAGES) {
  const pkgDir = path.resolve(PKG_ROOT, pkg.name);
  const tagArg = tag ? ` --tag ${tag}` : "";

  console.log(`Publishing ${pkg.name}${tag ? ` [${tag}]` : ""}...`);
  execSync(`npm publish --access public${tagArg}`, { cwd: pkgDir, stdio: "inherit" });
}
