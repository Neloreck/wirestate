import * as path from "path";

export const EEnvironment = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
};

export const ENV = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = ENV === "production";

export const EXTERNAL_DEPENDENCIES = [
  "react",
  "inversify",
  "mobx",
  "mobx-react-lite",
  "@preact/signals-react",
  "tslib",
];

export const PROJECT_ROOT = path.resolve(__dirname, "../..");
export const WS_ROOT = path.resolve(PROJECT_ROOT, "./src/wirestate");
export const TARGET_ROOT = path.resolve(PROJECT_ROOT, "./target");
export const PKG_ROOT = path.resolve(TARGET_ROOT, "./pkg");

export const DIST_ROOT = path.resolve(TARGET_ROOT, "./dist");
export const ESM_ROOT = path.resolve(DIST_ROOT, "./esm");
export const PORTABLE_ROOT = path.resolve(DIST_ROOT, "./portable");
export const PORTABLE_DEBUG_ROOT = path.resolve(DIST_ROOT, "./portable-debug");
export const CJS_ROOT = path.resolve(DIST_ROOT, "./cjs");
export const TYPES_ROOT = path.resolve(DIST_ROOT, "./dts");
export const STATS_ROOT = path.resolve(DIST_ROOT, "./stats");

export const TS_GLOBAL_CONFIG = path.resolve(PROJECT_ROOT, "./tsconfig.json");
export const TS_BUILD_CONFIG = path.resolve(__dirname, "./tsconfig.build.json");
export const TS_PORTABLE_CONFIG = path.resolve(__dirname, "./tsconfig.portable.json");

export const CORE_ENTRY = path.resolve(WS_ROOT, "./index.ts");
export const PORTABLE_ENTRY = path.resolve(PROJECT_ROOT, "./src/wirestate-portable/index.ts");
export const TEST_UTILS_ENTRY = path.resolve(WS_ROOT, "./test-utils.ts");
export const MOBX_ENTRY = path.resolve(WS_ROOT, "./mobx.ts");
export const SIGNALS_ENTRY = path.resolve(WS_ROOT, "./signals.ts");

export const SRC_PATH = path.resolve(PROJECT_ROOT, "./src");
