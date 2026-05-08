import * as fs from "node:fs";
import * as path from "node:path";

import ncp from "ncp";
import * as rimraf from "rimraf";

import { DIST_ROOT, PKG_ROOT, PROJECT_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

const ncpAsync = (source: string, destination: string): Promise<void> =>
  new Promise((resolve, reject) => ncp(source, destination, (err) => (err ? reject(err) : resolve())));

const copyFile = (source: string, destination: string): void => {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
  }
};

const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

async function stagePackage(pkgName: string): Promise<void> {
  const pkgSrcDir = path.resolve(PROJECT_ROOT, "src", pkgName);
  const pkgDistDir = path.resolve(DIST_ROOT, pkgName);
  const pkgOutDir = path.resolve(PKG_ROOT, pkgName);

  const esmDir = path.resolve(pkgDistDir, "esm");
  const cjsDir = path.resolve(pkgDistDir, "cjs");
  const dtsDir = path.resolve(pkgDistDir, "dts");

  if (!fs.existsSync(pkgDistDir) || !fs.existsSync(esmDir) || !fs.existsSync(cjsDir)) {
    throw new Error(`Build artifacts missing for ${pkgName}. Run the build before prepare.`);
  }

  rimraf.sync(pkgOutDir);
  ensureDir(pkgOutDir);

  const copies: Array<Promise<void>> = [
    ncpAsync(esmDir, path.resolve(pkgOutDir, "esm")),
    ncpAsync(cjsDir, path.resolve(pkgOutDir, "cjs")),
  ];

  // Copy DTS files to package root (package.json uses "./index.d.ts" etc.)
  if (fs.existsSync(dtsDir)) {
    for (const file of fs.readdirSync(dtsDir)) {
      copies.push(ncpAsync(path.resolve(dtsDir, file), path.resolve(pkgOutDir, file)));
    }
  }

  await Promise.all(copies);

  copyFile(path.resolve(PROJECT_ROOT, "LICENSE"), path.resolve(pkgOutDir, "LICENSE"));
  copyFile(path.resolve(PROJECT_ROOT, "README.md"), path.resolve(pkgOutDir, "README.md"));
  copyFile(path.resolve(PROJECT_ROOT, "CHANGELOG.md"), path.resolve(pkgOutDir, "CHANGELOG.md"));
  copyFile(path.resolve(pkgSrcDir, "package.json"), path.resolve(pkgOutDir, "package.json"));
}

async function main(): Promise<void> {
  for (const pkg of PACKAGES) {
    console.log(`Staging package: ${pkg.name}`);

    await stagePackage(pkg.name);

    console.log(`  -> target/pkg/${pkg.name}`);
  }

  console.log("Done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
