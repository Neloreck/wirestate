import {
  type ClassDeclaration,
  type ClassExpression,
  type ImportDeclaration,
  type Module,
  type ModuleItem,
  type ParseOptions,
  parseSync,
} from "@swc/core";

import { type Nullable } from "../types/general";

const DEFAULT_MODULE_ID: string = "module.ts";
const INJECTABLE_IMPORT_SOURCES: ReadonlySet<string> = new Set(["@wirestate/core", "wirestate"]);
const JAVASCRIPT_MODULE: RegExp = /\.(?:c|m)?jsx?$/i;
const JSX_MODULE: RegExp = /\.[jt]sx$/i;

/**
 * Finds named module-scope classes declared with an `@Injectable()` decorator.
 *
 * @remarks
 * The module is parsed before inspection, so decorator-looking text in comments,
 * strings, and templates is ignored. Classes nested inside functions or blocks are
 * not module-scoped and do not participate. `Injectable` must be imported from
 * `@wirestate/core` or `wirestate`; imported aliases from those entries are supported,
 * while imports through other modules are ignored.
 *
 * @group Transform
 *
 * @param code - Module source code before compilation.
 * @param moduleId - Module identifier used to select JavaScript, TypeScript, or JSX parsing.
 * @returns Unique class names in declaration order.
 * @throws When SWC cannot parse the module source.
 */
export function findInjectableClassNames(code: string, moduleId: string = DEFAULT_MODULE_ID): Array<string> {
  const module: Module = parseSync(code, createParseOptions(moduleId));
  const decoratorNames: ReadonlySet<string> = findInjectableDecoratorNames(module);
  const names: Set<string> = new Set();

  for (const item of module.body) {
    const declaration: Nullable<ClassDeclaration | ClassExpression> = getModuleClass(item);

    if (declaration?.identifier && hasInjectableDecorator(declaration.decorators, decoratorNames)) {
      names.add(declaration.identifier.value);
    }
  }

  return [...names];
}

/**
 * Builds the hot-reload footer appended to a module declaring injectable classes.
 *
 * @remarks
 * The footer registers every generation of the module's classes under stable ids
 * derived from the module path, and self-accepts hot updates so an edit stops
 * propagating up the import graph. The accept callback asks the Wirestate runtime
 * to swap the containers still holding older generations.
 *
 * @group Transform
 *
 * @param moduleId - Stable module identifier, usually the root-relative path.
 * @param classNames - Injectable class names declared by the module.
 * @returns JavaScript footer, starting with a newline.
 */
export function createHotFooter(moduleId: string, classNames: ReadonlyArray<string>): string {
  const registrations: string = classNames.join(", ");

  return [
    "",
    ';import * as __wirestate_hot__ from "@wirestate/core/hot";',
    "if (import.meta.hot) {",
    `  __wirestate_hot__.registerHotModule(${JSON.stringify(moduleId)}, { ${registrations} });`,
    "  import.meta.hot.accept(() => __wirestate_hot__.requestHotSwap());",
    "}",
    "",
  ].join("\n");
}

/**
 * Appends the hot-reload footer to a module when it declares injectable classes.
 *
 * @group Transform
 *
 * @param code - Module source code before compilation.
 * @param moduleId - Stable module identifier, usually the root-relative path.
 * @returns Transformed code, or `null` when the module declares no injectable classes.
 * @throws When SWC cannot parse a candidate module.
 */
export function transformHotModule(code: string, moduleId: string): Nullable<string> {
  if (!code.includes("Injectable")) {
    return null;
  }

  const classNames: Array<string> = findInjectableClassNames(code, moduleId);

  if (classNames.length === 0) {
    return null;
  }

  return code + createHotFooter(moduleId, classNames);
}

function createParseOptions(moduleId: string): ParseOptions {
  const file: string = moduleId.split("?", 1)[0];
  const jsx: boolean = JSX_MODULE.test(file);

  return JAVASCRIPT_MODULE.test(file)
    ? { comments: false, decorators: true, jsx, syntax: "ecmascript", target: "es2022" }
    : { comments: false, decorators: true, syntax: "typescript", target: "es2022", tsx: jsx };
}

function findInjectableDecoratorNames(module: Module): ReadonlySet<string> {
  const names: Set<string> = new Set();

  for (const item of module.body) {
    if (item.type !== "ImportDeclaration" || item.typeOnly || !INJECTABLE_IMPORT_SOURCES.has(item.source.value)) {
      continue;
    }

    addInjectableImportNames(item, names);
  }

  return names;
}

function addInjectableImportNames(declaration: ImportDeclaration, names: Set<string>): void {
  for (const specifier of declaration.specifiers) {
    if (specifier.type !== "ImportSpecifier" || specifier.isTypeOnly) {
      continue;
    }

    const importedName: string = specifier.imported?.value ?? specifier.local.value;

    if (importedName === "Injectable") {
      names.add(specifier.local.value);
    }
  }
}

function getModuleClass(item: ModuleItem): Nullable<ClassDeclaration | ClassExpression> {
  if (item.type === "ClassDeclaration") {
    return item;
  }

  if (item.type === "ExportDeclaration" && item.declaration.type === "ClassDeclaration") {
    return item.declaration;
  }

  if (item.type === "ExportDefaultDeclaration" && item.decl.type === "ClassExpression") {
    return item.decl;
  }

  return null;
}

function hasInjectableDecorator(
  decorators: ClassDeclaration["decorators"],
  decoratorNames: ReadonlySet<string>
): boolean {
  return (
    decorators?.some(
      ({ expression }) =>
        expression.type === "CallExpression" &&
        expression.callee.type === "Identifier" &&
        decoratorNames.has(expression.callee.value)
    ) ?? false
  );
}
