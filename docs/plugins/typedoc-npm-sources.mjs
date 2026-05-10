/*
 * TypeDoc plugin that rewrites "Defined in:" source references for symbols originating in
 * node_modules (e.g. re-exported types from peer dependencies) so they link to the package
 * page on npm instead of exposing the raw node_modules file path.
 *
 * Example transformation:
 *   node_modules/.pnpm/@inversifyjs+core@10.0.1_.../node_modules/@inversifyjs/core/lib/...d.ts
 *   -> https://www.npmjs.com/package/@inversifyjs/core
 */

import { Converter, ReflectionKind } from "typedoc";

const NODE_MODULES = "node_modules/";

/**
 * Extracts the npm package name from a file path, or null if the path is not inside node_modules.
 *
 * @param filePath - Full path to the file.
 * @returns Optional package name.
 */
function extractPackageName(filePath) {
  // Use the last node_modules/ to skip pnpm virtual store prefix
  const idx = filePath.lastIndexOf(NODE_MODULES);

  if (idx === -1) return null;

  const after = filePath.slice(idx + NODE_MODULES.length);
  const match = after.match(/^(@[^/]+\/[^/]+|[^/@][^/]*)/); // scoped (@scope/name) or unscoped (name)

  return match ? match[1] : null;
}

/**
 * @param application - TSDoc application instance to hook into.
 */
export function load(application) {
  application.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context) => {
    for (const reflection of context.project.getReflectionsByKind(ReflectionKind.All)) {
      if (!reflection.sources?.length) {
        continue;
      }

      for (const source of reflection.sources) {
        const pkg = extractPackageName(source.fileName);

        if (!pkg) {
          continue;
        }

        source.url = `https://www.npmjs.com/package/${pkg}`;
        source.fileName = pkg;
        source.line = "";
        source.character = "";
      }
    }
  });
}
