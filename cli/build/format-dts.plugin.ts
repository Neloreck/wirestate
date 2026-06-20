import { type Plugin } from "rolldown";

const REGION_MARKER = /^\/\/#(?:end)?region.*\r?\n?/gm;

/**
 * Inserts a blank line before each JSDoc block, which rolldown otherwise packs directly onto the
 * previous declaration. Skips blocks already preceded by a blank line and the first member of a
 * `{` body, so opening braces stay tight to their first member.
 *
 * @param code - Bundled dts source.
 * @returns The source with a blank line inserted before each JSDoc block.
 */
function spaceBeforeJsdoc(code: string): string {
  const lines = code.split("\n");
  const out: Array<string> = [];

  for (const line of lines) {
    if (/^\s*\/\*\*/.test(line)) {
      const prev = out[out.length - 1];

      if (prev !== undefined && prev.trim() !== "" && !prev.trimEnd().endsWith("{")) {
        out.push("");
      }
    }

    out.push(line);
  }

  return out.join("\n");
}

/**
 * Post-processes generated dts for readability. Strips rolldown's `//#region`/`//#endregion`
 * module-boundary markers (no rolldown option disables them) and spaces out JSDoc blocks. The JS
 * bundles are reformatted by `swcStripCommentsPlugin`, but the dts output has no such pass.
 *
 * @returns A rolldown plugin that reformats the dts in `renderChunk`.
 */
export function formatDts(): Plugin {
  return {
    name: "format-dts",
    renderChunk(code: string): { code: string } {
      return { code: spaceBeforeJsdoc(code.replace(REGION_MARKER, "")) };
    },
  };
}
