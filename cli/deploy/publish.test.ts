import {
  type PublishPackage,
  assertCanPublishPackageVersions,
  buildPublishSummary,
  publishPackages,
  resolvePublishTag,
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
