import { type Nullable } from "../types/general";

/**
 * Byte order mark some editors prepend to source files. The header goes after it.
 */
const BYTE_ORDER_MARK: string = "﻿";

/**
 * Builds the statement prepended to a module declaring injectable classes.
 *
 * @remarks
 * The statement opens the module in the Wirestate hot runtime, so `@Injectable()`
 * attributes every class decorated while the body evaluates to this module id.
 * It uses the namespace import declared by {@link createHotFooter}: import bindings
 * are initialized before any module statement runs, so the order in source is free.
 * It ends without a line break to keep the original line numbers intact.
 *
 * @group Transform
 *
 * @param moduleId - Stable module identifier, usually the root-relative path.
 * @returns JavaScript statement, without a trailing newline.
 */
export function createHotHeader(moduleId: string): string {
  return `if (import.meta.hot) __wirestate_hot__.openHotModule(${JSON.stringify(moduleId)});`;
}

/**
 * Builds the hot-reload footer appended to a module declaring injectable classes.
 *
 * @remarks
 * The footer closes the module in the Wirestate hot runtime, which registers the
 * classes collected since the header under stable ids derived from the module id. When
 * the module declares, or previously declared, such classes it also self-accepts hot
 * updates so an edit stops propagating up the import graph, and the accept callback
 * asks the runtime to swap the containers still holding older generations.
 *
 * @group Transform
 *
 * @returns JavaScript footer, starting with a newline.
 */
export function createHotFooter(): string {
  return [
    "",
    ';import * as __wirestate_hot__ from "@wirestate/core/hot";',
    "if (import.meta.hot && __wirestate_hot__.closeHotModule()) {",
    "  import.meta.hot.accept(() => __wirestate_hot__.requestHotSwap());",
    "}",
    "",
  ].join("\n");
}

/**
 * Wraps a module in hot-reload markers when it may declare injectable classes.
 *
 * @group Transform
 *
 * @param code - Module source code before compilation.
 * @param moduleId - Stable module identifier, usually the root-relative path.
 * @returns Transformed code, or `null` when the module cannot declare injectable classes.
 */
export function transformHotModule(code: string, moduleId: string): Nullable<string> {
  if (!code.includes("Injectable")) {
    return null;
  }

  const header: string = createHotHeader(moduleId);
  const footer: string = createHotFooter();

  return code.startsWith(BYTE_ORDER_MARK)
    ? BYTE_ORDER_MARK + header + code.slice(BYTE_ORDER_MARK.length) + footer
    : header + code + footer;
}
