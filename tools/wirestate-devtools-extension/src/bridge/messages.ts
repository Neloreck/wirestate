import type { DevtoolsEvent, DevtoolsRootSnapshot } from "@wirestate/core/devtools";

/**
 * Tag stamped on every `window.postMessage` between the MAIN-world backend and the
 * ISOLATED-world relay, so each side ignores unrelated page traffic.
 */
export const BRIDGE_SOURCE = "wirestate-devtools" as const;

/** Port name the ISOLATED relay opens to the background worker. */
export const CONTENT_PORT = "wirestate-content" as const;

/** Port-name prefix the panel opens to the background worker (suffixed with the inspected tab id). */
export const PANEL_PORT_PREFIX = "wirestate-panel:" as const;

/**
 * A message the backend sends toward the panel.
 *
 * @remarks
 * `roots` are already normalized to clone-safe primitives by the protocol. In `event`, a
 * `message` delta's `payload`/`source` have been **dehydrated** by the backend (see
 * {@link "../backend/dehydrate"}) so they survive structured clone across the bridge.
 */
export type BackendToPanel =
  | {
      readonly type: "init";
      readonly protocolVersion: number;
      readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
      readonly events: ReadonlyArray<DevtoolsEvent>;
    }
  | { readonly type: "snapshot"; readonly roots: ReadonlyArray<DevtoolsRootSnapshot> }
  | { readonly type: "event"; readonly event: DevtoolsEvent };

/** A message the panel sends toward the backend. */
export type PanelToBackend = { readonly type: "attach" } | { readonly type: "refresh" };

/** Envelope carried over `window.postMessage` between the two content-script worlds. */
export type PageMessage =
  | { readonly source: typeof BRIDGE_SOURCE; readonly dir: "to-content"; readonly payload: BackendToPanel }
  | { readonly source: typeof BRIDGE_SOURCE; readonly dir: "to-page"; readonly payload: PanelToBackend };
