import {
  createUnreleasedBody,
  extractReleaseNotes,
  finalizeChangelog,
  isStableVersion,
  parseChangelog,
  pruneEmptyCategories,
} from "./changelog.utils";

const SEED_CHANGELOG = [
  "# Changelog",
  "",
  "Intro paragraph.",
  "",
  "## [Unreleased]",
  "",
  "### Added",
  "",
  "- **react:** new injection helper.",
  "",
  "### Changed",
  "",
  "### Removed",
  "",
  "### Fixed",
  "",
  "- **core:** reconnect no longer reads stale status.",
  "",
  "[Unreleased]: https://github.com/Neloreck/wirestate/commits/main",
  "",
].join("\n");

describe("changelog version detection", () => {
  it("treats plain x.y.z as stable and prerelease suffixes as not stable", () => {
    expect(isStableVersion("1.0.0")).toBe(true);
    expect(isStableVersion("1.0.0-experimental.12")).toBe(false);
    expect(isStableVersion("2.3.4-rc.1")).toBe(false);
  });
});

describe("changelog finalization", () => {
  it("cuts the first stable release with a tag link and prunes empty categories", () => {
    const result = finalizeChangelog(SEED_CHANGELOG, "1.0.0", "2026-06-25");

    expect(result).toContain("## [1.0.0] - 2026-06-25");
    expect(result).toContain("- **react:** new injection helper.");
    expect(result).toContain("- **core:** reconnect no longer reads stale status.");

    const parsed = parseChangelog(result);
    const released = parsed.sections.find((section) => section.label === "1.0.0");

    expect(released?.body).toContain("### Added");
    expect(released?.body).toContain("### Fixed");
    expect(released?.body).not.toContain("### Removed");

    // A fresh, empty [Unreleased] block is reseeded above the release.
    const unreleased = parsed.sections.find((section) => section.label === "Unreleased");

    expect(unreleased?.body).toBe(createUnreleasedBody());
    expect(parsed.sections[0].label).toBe("Unreleased");

    // First release links to its tag (no prior stable to compare against).
    expect(parsed.links.get("1.0.0")).toBe("https://github.com/Neloreck/wirestate/releases/tag/v1.0.0");
    expect(parsed.links.get("Unreleased")).toBe("https://github.com/Neloreck/wirestate/compare/v1.0.0...HEAD");
  });

  it("links a subsequent release to a compare range against the previous stable", () => {
    const firstRelease = finalizeChangelog(SEED_CHANGELOG, "1.0.0", "2026-06-25");
    const withEntry = firstRelease.replace("### Added", "### Added\n\n- **lit:** new overview docs.");
    const secondRelease = finalizeChangelog(withEntry, "1.1.0", "2026-07-01");

    expect(parseChangelog(secondRelease).links.get("1.1.0")).toBe(
      "https://github.com/Neloreck/wirestate/compare/v1.0.0...v1.1.0"
    );
  });

  it("refuses to finalize a prerelease version", () => {
    expect(() => finalizeChangelog(SEED_CHANGELOG, "1.0.0-experimental.12", "2026-06-25")).toThrow(/prerelease/);
  });

  it("refuses to finalize when there are no unreleased entries", () => {
    const empty = SEED_CHANGELOG.replace("- **react:** new injection helper.", "").replace(
      "- **core:** reconnect no longer reads stale status.",
      ""
    );

    expect(() => finalizeChangelog(empty, "1.0.0", "2026-06-25")).toThrow(/No \[Unreleased] entries/);
  });
});

describe("changelog release notes extraction", () => {
  it("returns the body of a released version section", () => {
    const released = finalizeChangelog(SEED_CHANGELOG, "1.0.0", "2026-06-25");
    const notes = extractReleaseNotes(released, "1.0.0");

    expect(notes).toContain("### Added");
    expect(notes).toContain("- **react:** new injection helper.");
    expect(notes).not.toContain("## [1.0.0]");
  });

  it("throws when the version section is absent", () => {
    expect(() => extractReleaseNotes(SEED_CHANGELOG, "9.9.9")).toThrow(/no section for version 9.9.9/);
  });
});

describe("pruneEmptyCategories", () => {
  it("keeps only categories that carry entries", () => {
    const pruned = pruneEmptyCategories(["### Added", "", "- one.", "", "### Fixed", "", "### Security"].join("\n"));

    expect(pruned).toBe("### Added\n\n- one.");
  });
});
