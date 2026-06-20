import { type Plugin } from "rolldown";

const REGION_MARKER = /^\/\/#(?:end)?region.*\r?\n?/gm;

/**
 * Strips rolldown's generated `//#region <module>` / `//#endregion` module-boundary markers from emitted chunks.
 *
 * @returns A rolldown plugin that removes the region markers in `renderChunk`.
 */
export function stripRegions(): Plugin {
  return {
    name: "strip-region-markers",
    renderChunk(code: string): { code: string } {
      return { code: code.replace(REGION_MARKER, "") };
    },
  };
}
