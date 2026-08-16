/**
 * Vite plugin entrypoint for Wirestate hot reload: appends a self-accepting HMR footer
 * to modules declaring `@Injectable()` classes, so a service edit swaps the affected
 * containers in place instead of remounting (or silently rebuilding) the React tree.
 *
 * @packageDocumentation
 */

import { transformHotModule } from "./transform/hot-transform";
import { type Nullable } from "./types/general";

/**
 * Options for {@link wirestate}.
 *
 * @group Vite
 */
export interface WirestateVitePluginOptions {
  /**
   * Files eligible for the hot-reload transform.
   *
   * @remarks
   * Defaults to plain script modules (`.ts`, `.mts`, `.js`, `.mjs`). Component
   * modules (`.tsx`, `.jsx`) are excluded by default: they belong to React Fast
   * Refresh, and services co-located with components would create two competing
   * HMR boundaries in one module.
   */
  readonly include?: RegExp;

  /**
   * Files excluded from the transform even when {@link WirestateVitePluginOptions.include} matches.
   */
  readonly exclude?: RegExp;
}

/**
 * Structural subset of Vite's resolved config used by the plugin.
 *
 * @group Vite
 */
interface ViteResolvedConfigLike {
  readonly root: string;
}

/**
 * Structural subset of the Vite plugin contract produced by {@link wirestate}.
 *
 * @remarks
 * Structural on purpose: the plugin needs no Vite APIs beyond these fields, and a
 * structural type keeps `vite` out of this package's dependencies. Assignable to
 * Vite's own `Plugin` type at the call site.
 *
 * @group Vite
 */
export interface WirestateVitePlugin {
  readonly name: string;
  readonly apply: "serve";
  readonly enforce: "pre";
  configResolved(config: ViteResolvedConfigLike): void;
  transform(code: string, id: string, options?: ViteTransformOptionsLike): Nullable<{ code: string; map: null }>;
}

/**
 * Structural subset of the per-transform options Vite passes.
 *
 * @group Vite
 */
interface ViteTransformOptionsLike {
  readonly ssr?: boolean;
}

/**
 * Default transform eligibility: plain script modules, skipping declaration files.
 */
const DEFAULT_INCLUDE: RegExp = /\.(?:ts|mts|js|mjs)$/;

/**
 * Default exclusions: declaration files and test modules.
 */
const DEFAULT_EXCLUDE: RegExp = /\.(?:d\.ts|test\.[tj]sx?|spec\.[tj]sx?)$/;

/**
 * Creates the Wirestate hot-reload plugin for Vite.
 *
 * @remarks
 * Development-only (`apply: "serve"`): production builds are never transformed.
 * Requires `@wirestate/core` to be resolvable from the application, since the
 * injected footer imports `@wirestate/core/hot`.
 *
 * @group Vite
 *
 * @param options - Plugin options.
 * @returns Vite plugin instance.
 *
 * @example
 * ```typescript
 * import { wirestate } from "@wirestate/dev/vite";
 * import { defineConfig } from "vite";
 *
 * export default defineConfig({
 *   plugins: [wirestate(), react()],
 * });
 * ```
 */
export function wirestate(options: WirestateVitePluginOptions = {}): WirestateVitePlugin {
  const include: RegExp = options.include ?? DEFAULT_INCLUDE;
  const exclude: RegExp = options.exclude ?? DEFAULT_EXCLUDE;

  let root: string = "";

  return {
    name: "wirestate:hot",
    apply: "serve",
    enforce: "pre",
    configResolved(config: ViteResolvedConfigLike): void {
      root = config.root;
    },
    transform(code: string, id: string, options?: ViteTransformOptionsLike): Nullable<{ code: string; map: null }> {
      const [file] = id.split("?", 1);

      // Server modules are skipped: the footer wires a browser hot-update boundary, and there is
      // no rendered tree on the server holding a container to swap.
      if (options?.ssr || file.includes("/node_modules/") || !matches(include, file) || matches(exclude, file)) {
        return null;
      }

      const transformed: Nullable<string> = transformHotModule(code, toModuleId(file, root));

      // Footer is appended after the original code, so existing line mappings stay valid without a map.
      return transformed === null ? null : { code: transformed, map: null };
    },
  };
}

/**
 * Derives a stable module id from a file path.
 *
 * @param file - Absolute file path as reported by Vite.
 * @param root - Vite project root.
 * @returns Root-relative module id when possible, the absolute path otherwise.
 */
function toModuleId(file: string, root: string): string {
  if (!root) {
    return file;
  }

  const rootPrefix: string = root.endsWith("/") ? root : `${root}/`;

  return file.startsWith(rootPrefix) ? file.slice(rootPrefix.length) : file;
}

/**
 * Matches a file path without changing caller-owned regular expression state.
 *
 * @param expression - Regular expression supplied by the plugin or caller.
 * @param value - File path to test.
 * @returns Whether the expression matches the file path.
 */
function matches(expression: RegExp, value: string): boolean {
  const lastIndex: number = expression.lastIndex;

  expression.lastIndex = 0;

  try {
    return expression.test(value);
  } finally {
    expression.lastIndex = lastIndex;
  }
}

export default wirestate;
