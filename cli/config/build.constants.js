import * as path from "node:path";

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
export const TARGET_ROOT = path.resolve(PROJECT_ROOT, "./target");
export const PKG_ROOT = path.resolve(TARGET_ROOT, "./pkg");

export const DIST_ROOT = path.resolve(TARGET_ROOT, "./dist");
export const PORTABLE_ROOT = path.resolve(DIST_ROOT, "./portable");
export const PORTABLE_DEBUG_ROOT = path.resolve(DIST_ROOT, "./portable-debug");
export const STATS_ROOT = path.resolve(DIST_ROOT, "./stats");

export const TS_GLOBAL_CONFIG = path.resolve(PROJECT_ROOT, "./tsconfig.json");
export const TS_BUILD_CONFIG = path.resolve(__dirname, "./tsconfig.build.json");
export const TS_PORTABLE_CONFIG = path.resolve(__dirname, "./tsconfig.portable.json");

export const SRC_PATH = path.resolve(PROJECT_ROOT, "./src");

export const PORTABLE_ENTRY = path.resolve(SRC_PATH, "./wirestate-portable/index.ts");

// Kept for portable build.
export const WS_ROOT = path.resolve(SRC_PATH, "./wirestate-core");
export const MOBX_ENTRY = path.resolve(SRC_PATH, "wirestate-react-mobx/index.ts");
export const SIGNALS_ENTRY = path.resolve(SRC_PATH, "wirestate-react-signals/index.ts");
