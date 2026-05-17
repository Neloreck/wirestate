import * as fs from "node:fs";
import * as path from "node:path";

import { PROJECT_ROOT } from "../config/build.constants";
import { PACKAGES } from "../config/packages";

export type ReleaseType = "major" | "minor" | "patch";

export interface PackageRecord {
  displayName: string;
  manifestPath: string;
  manifest: Record<string, unknown>;
  version: string;
}

const RELEASE_TYPES: Set<ReleaseType> = new Set(["major", "minor", "patch"]);
const SEMVER_PATTERN: RegExp = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/;

export function printUsage(): void {
  console.log("Usage: pnpm version:packages <major|minor|patch|x.y.z[-tag]> [--dry-run]");
}

export function isReleaseType(value: string): value is ReleaseType {
  return RELEASE_TYPES.has(value as ReleaseType);
}

export function bumpVersion(version: string, releaseType: ReleaseType): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);

  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (releaseType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

export function resolveNextVersion(currentVersion: string, target: string): string {
  if (isReleaseType(target)) {
    return bumpVersion(currentVersion, target);
  }

  if (!SEMVER_PATTERN.test(target)) {
    throw new Error(`Invalid target version "${target}". Use major, minor, patch, or an explicit semver version.`);
  }

  return target;
}

export function readPackages(): Array<PackageRecord> {
  return PACKAGES.map((pkg) => {
    const manifestPath = path.resolve(PROJECT_ROOT, "src", pkg.name, "package.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    const version = manifest.version;
    const displayName = typeof manifest.name === "string" ? manifest.name : pkg.name;

    if (typeof version !== "string") {
      throw new Error(`Package ${displayName} is missing a string version field.`);
    }

    return {
      displayName,
      manifestPath,
      manifest,
      version,
    };
  });
}

export function ensureLockstepVersions(packages: Array<PackageRecord>): string {
  const versions = new Set(packages.map((pkg) => pkg.version));

  if (versions.size !== 1) {
    const details = packages.map((pkg) => `- ${pkg.displayName}: ${pkg.version}`).join("\n");

    throw new Error(`Package versions are not aligned:\n${details}`);
  }

  return packages[0].version;
}

export function writeVersion(pkg: PackageRecord, nextVersion: string): void {
  pkg.manifest.version = nextVersion;
  fs.writeFileSync(pkg.manifestPath, `${JSON.stringify(pkg.manifest, null, 2)}\n`);
}
