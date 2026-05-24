import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { PKG_ROOT } from "../config/build.constants";
import { PACKAGES, STABLE_PACKAGE_VERSION_PATTERN } from "../config/packages";

export interface PublishPackage {
  displayName: string;
  dir: string;
  name: string;
  version: string;
}

export function assertCanPublishPackageVersions(packages: Array<PublishPackage>, tag?: string): void {
  const isLatestPublish: boolean = !tag || tag === "latest";

  if (!isLatestPublish) {
    return;
  }

  const invalidPackages = packages.filter((pkg) => !STABLE_PACKAGE_VERSION_PATTERN.test(pkg.version));

  if (invalidPackages.length === 0) {
    return;
  }

  const details = invalidPackages.map((pkg) => `- ${pkg.displayName}: ${pkg.version}`).join("\n");

  throw new Error(
    [
      "Refusing to publish packages to npm's latest tag because normal releases require stable x.y.z versions.",
      details,
      "Use stable package versions for a normal publish, or publish prerelease versions with an explicit npm tag.",
    ].join("\n")
  );
}

export function resolvePublishTag(args: Array<string>): string | undefined {
  const tagIndex = args.indexOf("--tag");

  if (tagIndex === -1) {
    return undefined;
  }

  const tag = args[tagIndex + 1];

  if (!tag || tag.startsWith("--")) {
    throw new Error("Missing publish tag after --tag.");
  }

  return tag;
}

export function readPublishPackages(): Array<PublishPackage> {
  return PACKAGES.map((pkg) => {
    const pkgDir = path.resolve(PKG_ROOT, pkg.name);
    const manifestPath = path.resolve(pkgDir, "package.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    const version = manifest.version;
    const displayName = typeof manifest.name === "string" ? manifest.name : pkg.name;

    if (typeof version !== "string") {
      throw new Error(`Package ${displayName} is missing a string version field.`);
    }

    return {
      displayName,
      dir: pkgDir,
      name: pkg.name,
      version,
    };
  });
}

export function publishPackages(packages: Array<PublishPackage>, tag?: string): void {
  assertCanPublishPackageVersions(packages, tag);

  for (const pkg of packages) {
    const tagArg = tag ? ` --tag ${tag}` : "";

    console.log(`Publishing ${pkg.name}${tag ? ` [${tag}]` : ""}...`);
    execSync(`npm publish --access public${tagArg}`, { cwd: pkg.dir, stdio: "inherit" });
  }
}
