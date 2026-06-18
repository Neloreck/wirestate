import * as path from "node:path";

import * as ts from "typescript";

import { PROJECT_ROOT } from "../config/build.constants";

/**
 * Test infrastructure for asserting the public export surface of a package entry point.
 *
 * @packageDocumentation
 */

const TSCONFIG_PATH: string = path.resolve(PROJECT_ROOT, "tsconfig.json");

let cachedCompilerOptions: ts.CompilerOptions | undefined;

// Loads the project's compiler options once so `paths` (the `@wirestate/*` aliases the aggregator
// barrels re-export through) and `moduleResolution: bundler` are honoured when we resolve a source
// entry's import graph.
function compilerOptions(): ts.CompilerOptions {
  if (cachedCompilerOptions) {
    return cachedCompilerOptions;
  }

  const parsed = ts.getParsedCommandLineOfConfigFile(
    TSCONFIG_PATH,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    }
  );

  if (!parsed) {
    throw new Error(`Could not parse ${TSCONFIG_PATH}`);
  }

  cachedCompilerOptions = parsed.options;

  return cachedCompilerOptions;
}

function sorted(names: Iterable<string>): Array<string> {
  return Array.from(new Set(names)).sort();
}

// Every export the type system sees for `entryPath` — values *and* type-only names. A scoped
// `Program` lazily pulls just this entry's reachable import graph; we never run a diagnostics pass,
// so this stays cheap.
function fullExportsOf(entryPath: string): Array<string> {
  const program = ts.createProgram([entryPath], compilerOptions());
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryPath);

  if (!source) {
    throw new Error(`Could not load source file for ${entryPath}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(source);

  if (!moduleSymbol) {
    throw new Error(`No module symbol for ${entryPath} — is it a module (does it export anything)?`);
  }

  return sorted(checker.getExportsOfModule(moduleSymbol).map((symbol) => symbol.name));
}

// The names actually present on the emitted module at runtime — i.e. the value exports.
function runtimeExportsOf(entryPath: string): Array<string> {
  return sorted(Object.keys(require(entryPath) as Record<string, unknown>));
}

export interface EntryExportSets {
  /**
   * Names present on the module at runtime (value exports).
   */
  readonly runtime: Array<string>;
  /**
   * Every export the type system reports (values + type-only).
   */
  readonly full: Array<string>;
  /**
   * Exports that erase at runtime under `verbatimModuleSyntax` (`full \ runtime`).
   */
  readonly typeOnly: Array<string>;
}

// Computes the runtime, full, and derived type-only export sets for an entry. Exposed so a one-off
// harvesting pass can print the lists that seed the expectations in the test files.
export function describeEntryExports(entryPath: string): EntryExportSets {
  const runtime = runtimeExportsOf(entryPath);
  const full = fullExportsOf(entryPath);
  const typeOnly = full.filter((name) => !runtime.includes(name));

  return { runtime, full, typeOnly };
}

export interface ExpectedExports {
  /**
   * Value exports — present at runtime via `Object.keys`.
   */
  readonly values: Array<string>;

  /**
   * Type-only exports — erased at runtime, read from the compiler.
   */
  readonly types: Array<string>;
}

// Asserts a leaf entry point exports exactly `expected.values` at runtime and exactly
// `expected.types` as type-only names. Set-equality on both halves means any unlisted export —
// value or type — fails the test, so accidental leaks of internal names are caught.
export function assertExportedApi(entryPath: string, expected: ExpectedExports): void {
  const { runtime, full, typeOnly } = describeEntryExports(entryPath);

  // Sanity: every runtime value must be something the compiler also reports as an export.
  expect(runtime.filter((name) => !full.includes(name))).toEqual([]);

  expect(runtime).toEqual(sorted(expected.values));
  expect(typeOnly).toEqual(sorted(expected.types));
}

// Asserts an aggregator barrel (e.g. `wirestate` re-exporting `@wirestate/core` + `@wirestate/react`)
// forwards its children faithfully: its full and runtime surfaces equal the union of the children's.
// No curated list to drift — when a child gains an export, the barrel follows automatically.
export function assertAggregatedApi(entryPath: string, childPaths: Array<string>): void {
  const childFull = sorted(childPaths.flatMap(fullExportsOf));
  const childRuntime = sorted(childPaths.flatMap(runtimeExportsOf));

  expect(fullExportsOf(entryPath)).toEqual(childFull);
  expect(runtimeExportsOf(entryPath)).toEqual(childRuntime);
}
