import { type Nullable } from "../types/general";

/**
 * Matches an `@Injectable(...)` decorator that starts its own line, with no indentation.
 *
 * @remarks
 * Anchoring to the start of a line keeps the footer to classes declared at module scope.
 * A decorated class nested inside a function or block is indented, and registering it would
 * emit a reference to a binding that does not exist at module scope.
 */
const INJECTABLE_DECORATOR: RegExp = /^@Injectable\s*\(/gm;

/**
 * Matches the first class declaration name after a decorator occurrence.
 */
const CLASS_DECLARATION: RegExp = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)/;

/**
 * Longest allowed distance between an `@Injectable()` decorator and its class keyword.
 *
 * Bounds the search so a decorator-looking string far away from any class does not
 * pick up an unrelated declaration.
 */
const CLASS_SEARCH_WINDOW: number = 600;

/**
 * Finds the names of classes declared with an `@Injectable()` decorator.
 *
 * @remarks
 * A lightweight lexical scan rather than a parse: it runs on every module of a
 * development server, and a false negative only means a service misses hot reload
 * while a false positive only registers a class that never binds. Anonymous classes,
 * decorated expressions, and classes declared inside functions or blocks are ignored.
 *
 * @group Transform
 *
 * @param code - Module source code before compilation.
 * @returns Unique class names in declaration order.
 */
export function findInjectableClassNames(code: string): Array<string> {
  const names: Set<string> = new Set();

  INJECTABLE_DECORATOR.lastIndex = 0;

  for (let match = INJECTABLE_DECORATOR.exec(code); match; match = INJECTABLE_DECORATOR.exec(code)) {
    const window: string = code.slice(match.index, match.index + CLASS_SEARCH_WINDOW);
    const declaration: ReturnType<string["match"]> = window.match(CLASS_DECLARATION);

    if (declaration?.[1]) {
      names.add(declaration[1]);
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
 */
export function transformHotModule(code: string, moduleId: string): Nullable<string> {
  if (!code.includes("@Injectable")) {
    return null;
  }

  const classNames: Array<string> = findInjectableClassNames(code);

  if (classNames.length === 0) {
    return null;
  }

  return code + createHotFooter(moduleId, classNames);
}
