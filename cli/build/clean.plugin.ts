import * as fs from "node:fs";

import { type Plugin } from "rolldown";

/**
 * Wipes a single output directory at build start. Replaces `rollup-plugin-clear`; scoped to one
 * format dir per package so the esm/cjs/dts passes don't clobber each other's output under target/dist.
 *
 * @param dir - Absolute path of the output directory to remove before the build writes to it.
 * @returns A rolldown plugin that clears `dir` on `buildStart`.
 */
export function clean(dir: string): Plugin {
  return {
    name: "clean-output-dir",
    buildStart(): void {
      fs.rmSync(dir, { force: true, recursive: true });
    },
  };
}
