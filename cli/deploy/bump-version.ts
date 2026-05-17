import {
  ensureLockstepVersions,
  PackageRecord,
  printUsage,
  readPackages,
  resolveNextVersion,
  writeVersion,
} from "./bump-version.utils";

function main(): void {
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

  if (currentVersion === nextVersion) {
    return console.log(`Packages already use version ${nextVersion}.`);
  }

  console.log(`Bumping wirestate packages from ${currentVersion} to ${nextVersion}${dryRun ? " (dry run)" : ""}`);

  for (const pkg of packages) {
    if (!dryRun) {
      writeVersion(pkg, nextVersion);
    }

    console.log(`- ${pkg.displayName}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
