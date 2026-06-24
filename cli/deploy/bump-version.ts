import * as fs from "node:fs";
import * as process from "node:process";

import { CHANGELOG_PATH } from "../config/build.constants";

import {
  type PackageRecord,
  ensureLockstepVersions,
  printUsage,
  readPackages,
  readRootPackage,
  resolveNextVersion,
  writeVersion,
} from "./bump-version.utils";
import { finalizeChangelog, isStableVersion } from "./changelog.utils";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function finalizeChangelogForRelease(version: string, dryRun: boolean): void {
  if (!isStableVersion(version)) {
    console.log(`Leaving CHANGELOG.md [Unreleased] in place (prerelease ${version}).`);

    return;
  }

  const source = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const updated = finalizeChangelog(source, version, getToday());

  if (!dryRun) {
    fs.writeFileSync(CHANGELOG_PATH, updated);
  }

  console.log(`Finalized CHANGELOG.md [Unreleased] -> [${version}]${dryRun ? " (dry run)" : ""}`);
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const target = args.find((arg) => arg !== "--dry-run");

    if (!target) {
      printUsage();
      process.exit(1);
    }

    const packages: Array<PackageRecord> = readPackages();
    const rootPackage: PackageRecord = readRootPackage();
    const currentVersion: string = ensureLockstepVersions(packages);
    const nextVersion: string = resolveNextVersion(currentVersion, target);
    const wirestatePackagesNames: Set<string> = new Set(packages.map((pkg) => pkg.displayName));
    const manifests: Array<PackageRecord> = [rootPackage, ...packages];

    if (currentVersion === nextVersion && rootPackage.version === nextVersion) {
      console.log(`Package manifests already use version ${nextVersion}.`);
      process.exit(0);
    }

    console.log(`Bumping wirestate manifests to ${nextVersion}${dryRun ? " (dry run)" : ""}`);

    for (const pkg of manifests) {
      if (!dryRun) {
        writeVersion(pkg, nextVersion, wirestatePackagesNames);
      }

      console.log(`- ${pkg.displayName}`);
    }

    finalizeChangelogForRelease(nextVersion, dryRun);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
