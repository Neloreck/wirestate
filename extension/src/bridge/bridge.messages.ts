import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "#/devtools";

/**
 * Tag stamped on every `window.postMessage` between the MAIN-world backend and the
 * ISOLATED-world relay, so each side ignores unrelated page traffic.
 */
export const BRIDGE_SOURCE = "wirestate-devtools" as const;

/**
 * Port name the ISOLATED relay opens to the background worker.
 */
export const CONTENT_PORT = "wirestate-content" as const;

/**
 * Port-name prefix the panel opens to the background worker (suffixed with the inspected tab id).
 */
export const PANEL_PORT_PREFIX = "wirestate-panel:" as const;

/**
 * One level of a dehydrated instance value, returned by `inspect`. Objects/arrays expose their
 * children's keys/length so the panel can lazily request the next level. A `service` node marks a
 * field whose value is itself another container-managed instance, carrying enough to jump to it.
 * `unsupported` means the inspected page's wirestate build predates on-demand inspection.
 */
export type InspectNode =
  | { readonly kind: "primitive"; readonly value: string | number | boolean | null }
  | { readonly kind: "leaf"; readonly preview: string }
  | { readonly kind: "object"; readonly preview: string; readonly keys: ReadonlyArray<string> }
  | { readonly kind: "array"; readonly preview: string; readonly length: number }
  | {
      readonly kind: "service";
      readonly preview: string;
      readonly className: string;
      readonly containerId: number;
      readonly instanceId: number;
    }
  | { readonly kind: "unsupported" };

/**
 * Lazily reads one level of an instance's state at a path. Resolves over the bridge.
 */
export type InspectFn = (
  rootId: number,
  instanceId: number,
  path: ReadonlyArray<string | number>
) => Promise<InspectNode>;

/**
 * Lazily reads one level of a `Value` binding's value at a path. Resolves over the bridge. The
 * binding-side counterpart of {@link InspectFn}, keyed by `bindingId` instead of `instanceId`.
 */
export type InspectBindingFn = (
  rootId: number,
  bindingId: number,
  path: ReadonlyArray<string | number>
) => Promise<InspectNode>;

/**
 * A message the panel receives on its background port.
 *
 * @remarks
 * `roots` are already normalized to clone-safe primitives by the protocol.
 * In `event`, a `message` delta's `payload`/`source` have been dehydrated by the backend
 * so they survive structured clone across the bridge.
 */
export type BackendToPanelPayload =
  | {
      readonly type: "init";
      readonly protocolVersion: number;
      readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
      readonly events: ReadonlyArray<DevtoolsEvent>;
    }
  | { readonly type: "snapshot"; readonly roots: ReadonlyArray<DevtoolsRootSnapshot> }
  | { readonly type: "event"; readonly event: DevtoolsEvent }
  | { readonly type: "inspectResult"; readonly requestId: number; readonly node: InspectNode }
  | { readonly type: "page-connected" };

/**
 * A message the panel sends toward the backend.
 */
export type PanelToBackendPayload =
  | { readonly type: "attach" }
  | { readonly type: "refresh" }
  | {
      readonly type: "inspect";
      readonly requestId: number;
      readonly rootId: number;
      readonly instanceId: number;
      readonly path: ReadonlyArray<string | number>;
    }
  | {
      readonly type: "inspectBinding";
      readonly requestId: number;
      readonly rootId: number;
      readonly bindingId: number;
      readonly path: ReadonlyArray<string | number>;
    };

/**
 * Envelope carried over `window.postMessage` between the two content-script worlds.
 */
export type PageMessage =
  | { readonly source: typeof BRIDGE_SOURCE; readonly dir: "to-content"; readonly payload: BackendToPanelPayload }
  | { readonly source: typeof BRIDGE_SOURCE; readonly dir: "to-page"; readonly payload: PanelToBackendPayload };
