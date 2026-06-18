/**
 * Well-known global key the devtools hook lives under. Hardcoded (not imported from
 * `@wirestate/core`) so the backend stays dependency-free and reads whatever copy of Wirestate the
 * inspected page bundled. This string is the public contract (`DEVTOOLS_HOOK_KEY`).
 */
export const HOOK_KEY: string = "__WIRESTATE_DEVTOOLS_HOOK__";

/**
 * Protocol version stamped on a hook this backend creates (pre-seed path).
 */
export const FALLBACK_PROTOCOL_VERSION: number = 1;

/**
 * Upper bound on buffered events replayed to a late-attaching / reconnecting panel.
 */
export const BACKEND_BUFFER_SIZE: number = 500;
