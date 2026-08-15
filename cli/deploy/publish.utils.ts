import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { PKG_ROOT } from "../config/build.constants";
import { PACKAGES, STABLE_PACKAGE_VERSION_PATTERN } from "../config/packages";

const PUBLISH_TAG_PATTERN = /^[A-Za-z][A-Za-z0-9-]{0,15}$/;

export interface PublishPackage {
  displayName: string;
  dir: string;
  name: string;
  version: string;
}

interface PublishCommand {
  args: Array<string>;
  command: string;
}

/**
 * One reason a package cannot be published, collected during preflight.
 */
export interface PreflightIssue {
  displayName: string;
  reason: string;
}

/**
 * Registry state a preflight needs, isolated behind an interface.
 *
 * @remarks
 * npm publishes one package per invocation, so a run that fails part-way leaves the earlier
 * packages published and the rest not. Preflight exists to make that outcome improbable rather
 * than to make it impossible: every question that can be asked before the first upload is asked
 * here. It is an interface so the decision logic can be tested without a network.
 */
export interface RegistryProbe {
  /**
   * Checks whether a version already exists on the registry.
   *
   * @param pkg - Package to look up.
   * @returns `true` when the exact `name@version` is already published.
   */
  isVersionPublished(pkg: PublishPackage): boolean;

  /**
   * Packs the package and validates it the way a real publish would, without uploading.
   *
   * @remarks
   * This is also the authentication check. `npm publish` resolves credentials per package -
   * including the trusted-publishing OIDC exchange, which is per package - and it does so before
   * it honours `--dry-run`, so a dry run exercises the same credential path the upload will take.
   *
   * @param pkg - Package to check.
   * @param tag - Publish tag, when one was requested.
   * @returns The failure output, or `undefined` when the dry run succeeded.
   */
  dryRunPublish(pkg: PublishPackage, tag?: string): string | undefined;
}

/**
 * Matches the warning npm logs when it resolved no usable credentials for a package.
 *
 * @remarks
 * `npm publish` throws `ENEEDAUTH` for this, except under `--dry-run`, where it downgrades the
 * same condition to a warning and still exits `0`. Trusting the exit code would therefore pass a
 * package whose credentials do not work - which under trusted publishing means a missing or
 * mismatched per-package publisher configuration, discovered only after earlier packages have
 * already been uploaded.
 */
const NO_CREDENTIALS_PATTERN = /requires you to be logged in/i;

/**
 * Judges the outcome of a publish dry run.
 *
 * @param ok - Whether npm exited cleanly.
 * @param output - Combined npm output.
 * @returns The failure reason, or `undefined` when the package is publishable.
 */
export function detectDryRunFailure(ok: boolean, output: string): string | undefined {
  if (NO_CREDENTIALS_PATTERN.test(output)) {
    return [
      "npm resolved no usable credentials for this package.",
      "With trusted publishing, check that this exact package has a trusted publisher configured for this",
      "repository and workflow, and that the job grants `id-token: write`. With a token, check NODE_AUTH_TOKEN.",
    ].join(" ");
  }

  if (!ok) {
    return output || "npm publish --dry-run failed.";
  }

  return undefined;
}

function assertPublishTag(tag: string): void {
  if (!PUBLISH_TAG_PATTERN.test(tag)) {
    throw new Error("Publish tag must be 1-16 letters, numbers, or dashes and start with a letter.");
  }
}

function createNpmCommand(npmArgs: Array<string>): PublishCommand {
  if (process.platform !== "win32") {
    return {
      args: npmArgs,
      command: "npm",
    };
  }

  const npmCliPath = path.resolve(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

  if (fs.existsSync(npmCliPath)) {
    return {
      args: [npmCliPath, ...npmArgs],
      command: process.execPath,
    };
  }

  return {
    args: npmArgs,
    command: "npm.cmd",
  };
}

function createPublishArgs(tag?: string): Array<string> {
  const npmArgs: Array<string> = ["publish", "--access", "public"];

  if (tag) {
    npmArgs.push("--tag", tag);
  }

  return npmArgs;
}

function createPublishCommand(tag?: string): PublishCommand {
  return createNpmCommand(createPublishArgs(tag));
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

  assertPublishTag(tag);

  return tag;
}

export function readPublishPackages(): Array<PublishPackage> {
  return PACKAGES.map((pkg) => {
    const pkgDir = path.resolve(PKG_ROOT, pkg.name);
    const manifestPath = path.resolve(pkgDir, "package.json");

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`No staged package at ${manifestPath}. Run \`pnpm build\` before publishing or checking.`);
    }

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

export function buildPublishSummary(packages: Array<PublishPackage>, tag?: string): string {
  const distTag = tag ?? "latest";

  return [
    "## NPM Publish Report",
    "",
    "### Summary",
    "",
    `- **Packages**: ✅ **${packages.length} published**`,
    `- **Tag**: \`${distTag}\``,
    "",
    "| Package | Version |",
    "| --- | --- |",
    ...packages.map((pkg) => `| \`${pkg.displayName}\` | \`${pkg.version}\` |`),
  ].join("\n");
}

// Appends an npm-publish summary to the GitHub Actions job summary ($GITHUB_STEP_SUMMARY).
export function writeGithubActionPublishSummary(packages: Array<PublishPackage>, tag?: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;

  if (!summaryFile) {
    return;
  }

  fs.appendFileSync(summaryFile, `${buildPublishSummary(packages, tag)}\n`);
}

/**
 * Runs an npm command, capturing its output instead of failing the process.
 *
 * @param npmArgs - Arguments passed to npm.
 * @param cwd - Directory to run in.
 * @returns Whether npm exited cleanly, plus its combined output.
 */
function runNpm(npmArgs: Array<string>, cwd?: string): { ok: boolean; output: string } {
  const command: PublishCommand = createNpmCommand(npmArgs);
  const result = cp.spawnSync(command.command, command.args, { cwd, encoding: "utf8" });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

/**
 * Builds the probe that answers preflight questions against the real npm registry.
 *
 * @returns A probe backed by the npm CLI.
 */
export function createNpmRegistryProbe(): RegistryProbe {
  return {
    isVersionPublished(pkg: PublishPackage): boolean {
      // `npm view` exits non-zero with E404 when the version does not exist, which is the
      // expected answer for a release, so only a clean exit with output counts as published.
      return runNpm(["view", `${pkg.displayName}@${pkg.version}`, "version"]).ok;
    },

    dryRunPublish(pkg: PublishPackage, tag?: string): string | undefined {
      const result = runNpm([...createPublishArgs(tag), "--dry-run"], pkg.dir);

      return detectDryRunFailure(result.ok, result.output);
    },
  };
}

/**
 * Collects every reason the release cannot go out, without publishing anything.
 *
 * @param packages - Packages staged for release.
 * @param tag - Publish tag, when one was requested.
 * @param probe - Registry probe to ask.
 * @param resume - Whether an already-published version is acceptable, for resuming a partial run.
 * @returns Every issue found, empty when the release is ready.
 */
export function collectPreflightIssues(
  packages: Array<PublishPackage>,
  tag: string | undefined,
  probe: RegistryProbe,
  resume: boolean = false
): Array<PreflightIssue> {
  const issues: Array<PreflightIssue> = [];

  for (const pkg of packages) {
    if (probe.isVersionPublished(pkg)) {
      if (!resume) {
        issues.push({
          displayName: pkg.displayName,
          reason: `Version ${pkg.version} is already published. Bump the version, or pass --resume to skip the packages that already went out.`,
        });
      }

      // A published version cannot be dry-run published again, so there is nothing left to ask.
      continue;
    }

    const failure: string | undefined = probe.dryRunPublish(pkg, tag);

    if (failure) {
      issues.push({ displayName: pkg.displayName, reason: failure });
    }
  }

  return issues;
}

/**
 * Fails the release unless every package is publishable.
 *
 * @param packages - Packages staged for release.
 * @param tag - Publish tag, when one was requested.
 * @param probe - Registry probe to ask.
 * @param resume - Whether an already-published version is acceptable.
 *
 * @throws Error listing every problem found.
 */
export function assertPublishable(
  packages: Array<PublishPackage>,
  tag?: string,
  probe: RegistryProbe = createNpmRegistryProbe(),
  resume: boolean = false
): void {
  if (tag) {
    assertPublishTag(tag);
  }

  assertCanPublishPackageVersions(packages, tag);

  const issues: Array<PreflightIssue> = collectPreflightIssues(packages, tag, probe, resume);

  if (issues.length === 0) {
    return;
  }

  throw new Error(
    [
      `Preflight failed for ${issues.length} of ${packages.length} package(s). Nothing was published.`,
      ...issues.map((issue) => `- ${issue.displayName}: ${issue.reason}`),
    ].join("\n")
  );
}

/**
 * Returns the packages still needing an upload, skipping any already published at this version.
 *
 * @param packages - Packages staged for release.
 * @param probe - Registry probe to ask.
 * @returns The packages to publish.
 */
export function selectUnpublishedPackages(
  packages: Array<PublishPackage>,
  probe: RegistryProbe = createNpmRegistryProbe()
): Array<PublishPackage> {
  return packages.filter((pkg) => !probe.isVersionPublished(pkg));
}

/**
 * Uploads each package in turn.
 *
 * @remarks
 * npm has no multi-package transaction, so preflight cannot make this atomic - a network fault
 * between two uploads still splits the release. When that happens the error names exactly which
 * packages went out and which did not, so the run can be resumed instead of guessed at.
 *
 * @param packages - Packages to publish.
 * @param tag - Publish tag, when one was requested.
 *
 * @throws Error naming the published and unpublished packages when an upload fails.
 */
export function publishPackages(packages: Array<PublishPackage>, tag?: string): void {
  if (tag) {
    assertPublishTag(tag);
  }

  assertCanPublishPackageVersions(packages, tag);

  const published: Array<PublishPackage> = [];

  for (const pkg of packages) {
    const command = createPublishCommand(tag);

    console.log(`Publishing ${pkg.name}${tag ? ` [${tag}]` : ""}...`);

    try {
      cp.execFileSync(command.command, command.args, { cwd: pkg.dir, stdio: "inherit" });
    } catch (error) {
      throw new Error(buildPartialPublishReport(published, packages, pkg, tag, error));
    }

    published.push(pkg);
  }
}

/**
 * Describes a release that stopped part-way, and how to finish it.
 *
 * @param published - Packages already uploaded.
 * @param packages - Every package in the run.
 * @param failed - Package whose upload failed.
 * @param tag - Publish tag, when one was requested.
 * @param error - Underlying npm failure.
 * @returns The report to raise.
 */
export function buildPartialPublishReport(
  published: Array<PublishPackage>,
  packages: Array<PublishPackage>,
  failed: PublishPackage,
  tag: string | undefined,
  error: unknown
): string {
  const remaining: Array<PublishPackage> = packages.slice(packages.indexOf(failed) + 1);
  // The script name is not derivable from the tag - only `experimental` has one - so point at the
  // entry point itself, which is correct for every tag.
  const resumeCommand: string = `pnpm tsx cli/deploy/publish.ts${tag ? ` --tag ${tag}` : ""} --resume`;

  return [
    `Publishing ${failed.displayName} failed: ${error instanceof Error ? error.message : String(error)}`,
    "",
    "This release is incomplete.",
    published.length > 0 ? `- Published: ${published.map((pkg) => pkg.displayName).join(", ")}` : "- Published: none",
    `- Failed: ${failed.displayName}`,
    remaining.length > 0
      ? `- Not attempted: ${remaining.map((pkg) => pkg.displayName).join(", ")}`
      : "- Not attempted: none",
    "",
    `Fix the cause, then re-run with the same versions to publish the rest: ${resumeCommand}`,
  ].join("\n");
}
