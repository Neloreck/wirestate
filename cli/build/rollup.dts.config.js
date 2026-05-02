import { default as clear } from "rollup-plugin-clear";
import { default as dts } from "rollup-plugin-dts";

import { default as tsconfig } from "../../tsconfig.json";
import {
  EXTERNAL_DEPENDENCIES,
  CORE_ENTRY,
  TEST_UTILS_ENTRY,
  MOBX_ENTRY,
  SIGNALS_ENTRY,
  TYPES_ROOT,
} from "../config/build.constants";

export const DTS_CONFIG = {
  external: EXTERNAL_DEPENDENCIES,
  input: [CORE_ENTRY, TEST_UTILS_ENTRY, MOBX_ENTRY, SIGNALS_ENTRY],
  output: {
    chunkFileNames: "lib.d.ts",
    dir: TYPES_ROOT,
    format: "es",
    sourcemap: false,
  },
  plugins: [
    dts.default({
      compilerOptions: {
        baseUrl: tsconfig.compilerOptions.baseUrl,
        paths: tsconfig.compilerOptions.paths,
        rootDir: tsconfig.compilerOptions.rootDir,
        sourceMap: false,
      },
    }),
    clear({
      targets: [TYPES_ROOT],
    }),
  ],
};

export default [DTS_CONFIG];
