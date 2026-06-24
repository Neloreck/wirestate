import { REPOSITORY_URL } from "../config/build.constants";
import { STABLE_PACKAGE_VERSION_PATTERN } from "../config/packages";

export const TAG_PREFIX = "v";
export const UNRELEASED_LABEL = "Unreleased";

/**
 * Keep Changelog category headers, seeded empty into every [Unreleased] block.
 */
export const CHANGELOG_CATEGORIES: ReadonlyArray<string> = ["Added", "Changed", "Fixed", "Removed"];

const LINK_DEFINITION_PATTERN: RegExp = /^\[([^\]]+)\]:\s+(\S.*)$/;
const VERSION_HEADING_PATTERN: RegExp = /^## \[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/;
const CATEGORY_HEADING_PATTERN: RegExp = /^### (.+)$/;

export interface ChangelogSection {
  label: string;
  date: string | null;
  heading: string;
  body: string;
}

export interface ParsedChangelog {
  preamble: string;
  sections: Array<ChangelogSection>;
  links: Map<string, string>;
}

export function isStableVersion(version: string): boolean {
  return STABLE_PACKAGE_VERSION_PATTERN.test(version);
}

/**
 * A fresh [Unreleased] body with every category header present and empty.
 *
 * @returns Seeded section body.
 */
export function createUnreleasedBody(): string {
  return CHANGELOG_CATEGORIES.map((category) => `### ${category}`).join("\n\n");
}

export function parseChangelog(source: string): ParsedChangelog {
  const links = new Map<string, string>();
  const content: Array<string> = [];

  for (const line of source.split("\n")) {
    const linkMatch = line.match(LINK_DEFINITION_PATTERN);

    if (linkMatch) {
      links.set(linkMatch[1], linkMatch[2].trim());
    } else {
      content.push(line);
    }
  }

  const sections: Array<ChangelogSection> = [];
  const preamble: Array<string> = [];

  let current: ChangelogSection | null = null;
  let currentBody: Array<string> = [];

  const flush = (): void => {
    if (current) {
      current.body = currentBody.join("\n").trim();
      sections.push(current);
    }
  };

  for (const line of content) {
    const headingMatch = line.match(VERSION_HEADING_PATTERN);

    if (headingMatch) {
      flush();
      current = { label: headingMatch[1], date: headingMatch[2] ?? null, heading: line, body: "" };
      currentBody = [];
    } else if (current === null) {
      preamble.push(line);
    } else {
      currentBody.push(line);
    }
  }

  flush();

  return { preamble: preamble.join("\n").trim(), sections, links };
}

/**
 * Drop category subsections that carry no entries from a released section.
 *
 * @param body Section body to prune.
 * @returns Body without empty categories.
 */
export function pruneEmptyCategories(body: string): string {
  const blocks: Array<{ heading: string; lines: Array<string> }> = [];
  let current: { heading: string; lines: Array<string> } | null = null;

  for (const line of body.split("\n")) {
    if (CATEGORY_HEADING_PATTERN.test(line)) {
      if (current) {
        blocks.push(current);
      }

      current = { heading: line, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    blocks.push(current);
  }

  return blocks
    .map((block) => ({ heading: block.heading, entries: block.lines.join("\n").trim() }))
    .filter((block) => block.entries.length > 0)
    .map((block) => `${block.heading}\n\n${block.entries}`)
    .join("\n\n");
}

function serializeChangelog(preamble: string, sections: Array<ChangelogSection>, links: Map<string, string>): string {
  const body = sections.map((section) => `${section.heading}\n\n${section.body.trim()}`).join("\n\n");

  const linkLines = sections
    .map((section) => {
      const url = links.get(section.label);

      return url ? `[${section.label}]: ${url}` : null;
    })
    .filter((line): line is string => line !== null);

  return `${[preamble.trim(), body, linkLines.join("\n")].filter((part) => part.length > 0).join("\n\n")}\n`;
}

/**
 * Cut the [Unreleased] section into a dated, released version section.
 *
 * @param source Current changelog contents.
 * @param version Stable version being released.
 * @param date Release date in YYYY-MM-DD form.
 * @returns Updated changelog contents.
 */
export function finalizeChangelog(source: string, version: string, date: string): string {
  if (!isStableVersion(version)) {
    throw new Error(`Refusing to finalize the changelog for prerelease version "${version}". Stable x.y.z only.`);
  }

  const parsed = parseChangelog(source);
  const unreleasedIndex = parsed.sections.findIndex((section) => section.label.toLowerCase() === "unreleased");

  if (unreleasedIndex === -1) {
    throw new Error("CHANGELOG.md is missing an [Unreleased] section.");
  }

  const releasedBody = pruneEmptyCategories(parsed.sections[unreleasedIndex].body);

  if (releasedBody.trim().length === 0) {
    throw new Error("No [Unreleased] entries to release. Add changelog entries before cutting a stable version.");
  }

  const previousStable = parsed.sections.find(
    (section) => section.label.toLowerCase() !== "unreleased" && isStableVersion(section.label)
  );

  const newUnreleased: ChangelogSection = {
    label: UNRELEASED_LABEL,
    date: null,
    heading: `## [${UNRELEASED_LABEL}]`,
    body: createUnreleasedBody(),
  };
  const released: ChangelogSection = {
    label: version,
    date,
    heading: `## [${version}] - ${date}`,
    body: releasedBody,
  };

  const sections = [newUnreleased, released, ...parsed.sections.filter((_, index) => index !== unreleasedIndex)];

  const links = new Map(parsed.links);

  links.set(UNRELEASED_LABEL, `${REPOSITORY_URL}/compare/${TAG_PREFIX}${version}...HEAD`);
  links.set(
    version,
    previousStable
      ? `${REPOSITORY_URL}/compare/${TAG_PREFIX}${previousStable.label}...${TAG_PREFIX}${version}`
      : `${REPOSITORY_URL}/releases/tag/${TAG_PREFIX}${version}`
  );

  return serializeChangelog(parsed.preamble, sections, links);
}

/**
 * Slice a single version's notes out of the changelog, for a GitHub release body.
 *
 * @param source Changelog contents to read.
 * @param version Version label to extract.
 * @returns Section body without the version heading.
 */
export function extractReleaseNotes(source: string, version: string): string {
  const section = parseChangelog(source).sections.find((entry) => entry.label === version);

  if (!section) {
    throw new Error(`CHANGELOG.md has no section for version ${version}.`);
  }

  return section.body.trim();
}
