import * as fs from "node:fs";

import * as ts from "typescript";

function sorted(names: Iterable<string>): Array<string> {
  return Array.from(new Set(names)).sort();
}

export interface EntryExportSets {
  /**
   * Value exports — `function`/`class`/`const`/`enum` declarations and value re-export specifiers.
   */
  readonly values: Array<string>;

  /**
   * Type-only exports — `interface`/`type` declarations and any `type`-marked re-export specifier,
   * all erased at runtime under `verbatimModuleSyntax`.
   */
  readonly types: Array<string>;
}

function rejectUnsupportedExport(entryPath: string, form: string): never {
  throw new Error(
    `${entryPath}: \`${form}\` is not supported by the AST export classifier — a leaf barrel must ` +
      `enumerate its exports explicitly. A barrel that needs star re-exports is an aggregator and ` +
      `must use assertAggregatedApi instead.`
  );
}

export function describeEntryExports(entryPath: string): EntryExportSets {
  const text = fs.readFileSync(entryPath, "utf8");
  const scriptKind = entryPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(entryPath, text, ts.ScriptTarget.Latest, false, scriptKind);

  const values: Array<string> = [];
  const types: Array<string> = [];

  for (const statement of source.statements) {
    // `export { ... }`, `export { ... } from "..."`, `export type { ... }`
    if (ts.isExportDeclaration(statement)) {
      // `export *` (no clause) and `export * as ns` (NamespaceExport) carry no enumerable names here.
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
        rejectUnsupportedExport(entryPath, statement.exportClause ? "export * as ns" : "export *");
      }

      for (const specifier of statement.exportClause.elements) {
        const isTypeOnly = statement.isTypeOnly || specifier.isTypeOnly;

        (isTypeOnly ? types : values).push(specifier.name.text);
      }

      continue;
    }

    // `export = x` and `export default <expression>`
    if (ts.isExportAssignment(statement)) {
      rejectUnsupportedExport(entryPath, statement.isExportEquals ? "export =" : "export default");
    }

    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;

    if (!modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      // Imports (including side-effect imports) and any non-exported statement.
      continue;
    }

    if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
      rejectUnsupportedExport(entryPath, "export default");
    }

    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      types.push(statement.name.text);
    } else if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (!statement.name) {
        rejectUnsupportedExport(entryPath, "anonymous export");
      }

      values.push(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          rejectUnsupportedExport(entryPath, "destructuring export");
        }

        values.push(declaration.name.text);
      }
    } else {
      rejectUnsupportedExport(entryPath, ts.SyntaxKind[statement.kind]);
    }
  }

  return { values: sorted(values), types: sorted(types) };
}

export interface ExpectedExports {
  /**
   * Value exports — `function`/`class`/`const`/`enum` and value re-export specifiers.
   */
  readonly values: Array<string>;

  /**
   * Type-only exports — `type`-marked specifiers and `interface`/`type` declarations.
   */
  readonly types: Array<string>;
}

export function assertExportedApi(entryPath: string, expected: ExpectedExports): void {
  const { values, types } = describeEntryExports(entryPath);

  expect(values).toEqual(sorted(expected.values));
  expect(types).toEqual(sorted(expected.types));
}
