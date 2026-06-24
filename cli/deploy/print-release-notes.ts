import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";

import { PROJECT_ROOT } from "../config/build.constants";

import { extractReleaseNotes } from "./changelog.utils";

function readRootVersion(): string {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(PROJECT_ROOT, "package.json"), "utf8")) as {
    version?: unknown;
  };

  if (typeof manifest.version !== "string") {
    throw new Error("Root package.json is missing a string version field.");
  }

  return manifest.version;
}

if (require.main === module) {
  try {
    const version = process.argv[2] ?? readRootVersion();
    const source = fs.readFileSync(path.resolve(PROJECT_ROOT, "CHANGELOG.md"), "utf8");

    process.stdout.write(`${extractReleaseNotes(source, version)}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
