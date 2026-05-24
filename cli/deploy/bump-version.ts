import * as process from "node:process";

import {
  ensureLockstepVersions,
  PackageRecord,
  printUsage,
  readPackages,
  resolveNextVersion,
  writeVersion,
} from "./bump-version.utils";

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
    const currentVersion: string = ensureLockstepVersions(packages);
    const nextVersion: string = resolveNextVersion(currentVersion, target);
    const wirestatePackagesNames: Set<string> = new Set(packages.map((pkg) => pkg.displayName));

    if (currentVersion === nextVersion) {
      console.log(`Packages already use version ${nextVersion}.`);
      process.exit(0);
    }

    console.log(`Bumping wirestate packages from ${currentVersion} to ${nextVersion}${dryRun ? " (dry run)" : ""}`);

    for (const pkg of packages) {
      if (!dryRun) {
        writeVersion(pkg, nextVersion, wirestatePackagesNames);
      }

      console.log(`- ${pkg.displayName}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
