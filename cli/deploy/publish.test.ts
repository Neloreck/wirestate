import {
  type PublishPackage,
  type RegistryProbe,
  assertCanPublishPackageVersions,
  assertPublishable,
  buildPartialPublishReport,
  buildPublishSummary,
  collectPreflightIssues,
  detectDryRunFailure,
  publishPackages,
  resolvePublishTag,
  selectUnpublishedPackages,
} from "./publish.utils";

describe("publish package version guard", () => {
  function createPackage(name: string, version: string): PublishPackage {
    return {
      displayName: `@wirestate/${name}`,
      dir: `target/pkg/${name}`,
      name,
      version,
    };
  }

  it("allows stable package versions for a normal publish", () => {
    expect(() => assertCanPublishPackageVersions([createPackage("core", "1.2.3")])).not.toThrow();
  });

  it("rejects prerelease package versions for a normal publish", () => {
    expect(() =>
      assertCanPublishPackageVersions([createPackage("core", "1.2.3"), createPackage("react", "1.2.3-experimental.1")])
    ).toThrow("normal releases require stable x.y.z versions");
  });

  it("rejects prerelease package versions for an explicit latest publish", () => {
    expect(() => assertCanPublishPackageVersions([createPackage("core", "1.2.3-experimental.1")], "latest")).toThrow(
      "normal releases require stable x.y.z versions"
    );
  });

  it("allows prerelease package versions for an explicitly tagged publish", () => {
    expect(() =>
      assertCanPublishPackageVersions([createPackage("core", "1.2.3-experimental.1")], "experimental")
    ).not.toThrow();
  });

  it("rejects a missing publish tag value", () => {
    expect(() => resolvePublishTag(["--tag"])).toThrow("Missing publish tag after --tag.");
  });

  it("rejects publish tags with shell metacharacters", () => {
    expect(() => resolvePublishTag(["--tag", "experimental;echo injected"])).toThrow(
      "Publish tag must be 1-16 letters"
    );
  });

  it("rejects publish tags longer than 16 characters", () => {
    expect(() => resolvePublishTag(["--tag", "experimental-beta"])).toThrow("Publish tag must be 1-16 letters");
  });

  it("rejects unsafe tags passed directly to publish", () => {
    expect(() => publishPackages([], "experimental&&echo injected")).toThrow("Publish tag must be 1-16 letters");
  });
});

describe("publish summary report", () => {
  function createPackage(name: string, version: string): PublishPackage {
    return {
      displayName: `@wirestate/${name}`,
      dir: `target/pkg/${name}`,
      name,
      version,
    };
  }

  it("renders published packages with the default latest tag", () => {
    const summary = buildPublishSummary([createPackage("core", "1.2.3"), createPackage("react", "1.2.3")]);

    expect(summary).toContain("## NPM Publish Report");
    expect(summary).toContain("- **Packages**: ✅ **2 published**");
    expect(summary).toContain("- **Tag**: `latest`");
    expect(summary).toContain("| `@wirestate/core` | `1.2.3` |");
  });

  it("renders the explicit npm tag", () => {
    const summary = buildPublishSummary([createPackage("core", "1.2.3-experimental.1")], "experimental");

    expect(summary).toContain("- **Tag**: `experimental`");
    expect(summary).toContain("- **Packages**: ✅ **1 published**");
  });
});

describe("publish preflight", () => {
  function createPackage(name: string, version: string): PublishPackage {
    return {
      displayName: `@wirestate/${name}`,
      dir: `target/pkg/${name}`,
      name,
      version,
    };
  }

  interface ProbeOptions {
    published?: Array<string>;
    dryRunFailures?: Record<string, string>;
  }

  function createProbe(options: ProbeOptions = {}): RegistryProbe & { dryRunCalls: Array<string> } {
    const dryRunCalls: Array<string> = [];

    return {
      dryRunCalls,
      isVersionPublished: (pkg) => (options.published ?? []).includes(pkg.displayName),
      dryRunPublish: (pkg) => {
        dryRunCalls.push(pkg.displayName);

        return options.dryRunFailures?.[pkg.displayName];
      },
    };
  }

  const packages: Array<PublishPackage> = [
    createPackage("core", "1.2.3"),
    createPackage("react", "1.2.3"),
    createPackage("lit", "1.2.3"),
  ];

  it("reports nothing when every package can be published", () => {
    expect(collectPreflightIssues(packages, undefined, createProbe())).toEqual([]);
  });

  it("dry-runs every package before anything is published", () => {
    const probe = createProbe();

    collectPreflightIssues(packages, undefined, probe);

    expect(probe.dryRunCalls).toEqual(["@wirestate/core", "@wirestate/react", "@wirestate/lit"]);
  });

  it("collects every failing package rather than stopping at the first", () => {
    const issues = collectPreflightIssues(
      packages,
      undefined,
      createProbe({ dryRunFailures: { "@wirestate/core": "ENEEDAUTH", "@wirestate/lit": "EBADENGINE" } })
    );

    expect(issues.map((issue) => issue.displayName)).toEqual(["@wirestate/core", "@wirestate/lit"]);
  });

  it("rejects a version that is already published", () => {
    const issues = collectPreflightIssues(packages, undefined, createProbe({ published: ["@wirestate/react"] }));

    expect(issues).toEqual([{ displayName: "@wirestate/react", reason: expect.stringContaining("already published") }]);
  });

  it("accepts an already-published version when resuming", () => {
    expect(collectPreflightIssues(packages, undefined, createProbe({ published: ["@wirestate/react"] }), true)).toEqual(
      []
    );
  });

  it("fails the release with every problem listed at once", () => {
    expect(() =>
      assertPublishable(
        packages,
        undefined,
        createProbe({ dryRunFailures: { "@wirestate/core": "ENEEDAUTH", "@wirestate/lit": "EBADENGINE" } })
      )
    ).toThrow("Preflight failed for 2 of 3 package(s). Nothing was published.");
  });

  it("keeps the version guard ahead of any registry call", () => {
    const probe = createProbe();

    expect(() => assertPublishable([createPackage("core", "1.2.3-experimental.1")], "latest", probe)).toThrow(
      "normal releases require stable x.y.z versions"
    );
    expect(probe.dryRunCalls).toEqual([]);
  });

  it("selects only the packages still missing from the registry when resuming", () => {
    const pending = selectUnpublishedPackages(
      packages,
      createProbe({ published: ["@wirestate/core", "@wirestate/react"] })
    );

    expect(pending.map((pkg) => pkg.displayName)).toEqual(["@wirestate/lit"]);
  });
});

describe("partial publish report", () => {
  function createPackage(name: string): PublishPackage {
    return { displayName: `@wirestate/${name}`, dir: `target/pkg/${name}`, name, version: "1.2.3" };
  }

  it("names what went out, what failed, and what was never attempted", () => {
    const packages = [createPackage("core"), createPackage("react"), createPackage("lit")];
    const report = buildPartialPublishReport(
      [packages[0]],
      packages,
      packages[1],
      "experimental",
      new Error("ETIMEDOUT")
    );

    expect(report).toContain("Publishing @wirestate/react failed: ETIMEDOUT");
    expect(report).toContain("- Published: @wirestate/core");
    expect(report).toContain("- Failed: @wirestate/react");
    expect(report).toContain("- Not attempted: @wirestate/lit");
    expect(report).toContain("pnpm tsx cli/deploy/publish.ts --tag experimental --resume");
  });

  it("reports an empty publish set when the first package fails", () => {
    const packages = [createPackage("core"), createPackage("react")];
    const report = buildPartialPublishReport([], packages, packages[0], undefined, new Error("ENEEDAUTH"));

    expect(report).toContain("- Published: none");
    expect(report).toContain("pnpm tsx cli/deploy/publish.ts --resume");
  });
});

describe("publish dry run outcome", () => {
  it("passes a clean dry run", () => {
    expect(detectDryRunFailure(true, "npm notice Publishing to https://registry.npmjs.org (dry-run)")).toBeUndefined();
  });

  it("reports a failing dry run", () => {
    expect(detectDryRunFailure(false, "npm error code E404")).toContain("E404");
  });

  it("falls back to a message when a failing dry run printed nothing", () => {
    expect(detectDryRunFailure(false, "")).toBe("npm publish --dry-run failed.");
  });

  // `npm publish` throws ENEEDAUTH for missing credentials, but under `--dry-run` it downgrades
  // that to a warning and exits 0. Under trusted publishing this is the only signal available
  // before the upload that a package has no working publisher configuration, so the exit code
  // cannot be the whole answer.
  it("fails a dry run that warned about credentials despite exiting cleanly", () => {
    const failure = detectDryRunFailure(
      true,
      "npm warn This command requires you to be logged in to https://registry.npmjs.org (dry-run)"
    );

    expect(failure).toContain("no usable credentials");
    expect(failure).toContain("trusted publisher");
    expect(failure).toContain("id-token: write");
  });
});
