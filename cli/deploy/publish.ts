import {
  type PublishPackage,
  type RegistryProbe,
  assertPublishable,
  createNpmRegistryProbe,
  publishPackages,
  readPublishPackages,
  resolvePublishTag,
  selectUnpublishedPackages,
  writeGithubActionPublishSummary,
} from "./publish.utils";

if (require.main === module) {
  try {
    const args: Array<string> = process.argv.slice(2);
    const tag: string | undefined = resolvePublishTag(args);
    const preflightOnly: boolean = args.includes("--dry-run");
    const resume: boolean = args.includes("--resume");
    const probe: RegistryProbe = createNpmRegistryProbe();
    const packages: Array<PublishPackage> = readPublishPackages();

    // Phase one: ask every question that can be answered before the first upload, for every
    // package, and fail the whole release if any of them has a problem. A release that stops
    // half-way is the failure this exists to prevent.
    console.log(`Preflight: checking ${packages.length} package(s)${tag ? ` for tag [${tag}]` : ""}...`);

    assertPublishable(packages, tag, probe, resume);

    if (preflightOnly) {
      console.log("Preflight passed. Nothing published (--dry-run).");
    } else {
      // Phase two: upload. On a resume the packages that already went out are skipped, so the run
      // completes the release instead of failing on them.
      const pending: Array<PublishPackage> = resume ? selectUnpublishedPackages(packages, probe) : packages;

      if (resume && pending.length !== packages.length) {
        console.log(
          `Resuming: ${packages.length - pending.length} package(s) already published, ${pending.length} left.`
        );
      }

      publishPackages(pending, tag);

      writeGithubActionPublishSummary(pending, tag);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
