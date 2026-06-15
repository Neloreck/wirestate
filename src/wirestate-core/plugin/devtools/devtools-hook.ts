import type { Nullable, Optional } from "../../types/general";

/**
 * Global key the in-page inspector backend reads to find the devtools hook.
 *
 * @remarks
 * The property is added to `globalThis` **only** when a {@link DevToolsPlugin} is
 * installed (see {@link installDevtoolsHook}). An application that never registers
 * the plugin never touches `globalThis`.
 *
 * @group DevTools
 */
export const DEVTOOLS_HOOK_KEY = "__WIRESTATE_DEVTOOLS_HOOK__" as const;

/**
 * Version of the normalized devtools protocol the hook speaks.
 *
 * @group DevTools
 */
export const DEVTOOLS_PROTOCOL_VERSION = 1 as const;

/**
 * Identifier for one registered root (one installed {@link DevToolsPlugin}).
 *
 * @group DevTools
 */
export type DevtoolsRootId = number;

/**
 * Identifier for one container within a root's subtree. Stable for a container's
 * lifetime and shared across roots that observe the same container.
 *
 * @group DevTools
 */
export type DevtoolsContainerId = number;

/**
 * Normalized, display-ready description of a binding token.
 *
 * @group DevTools
 */
export interface DevtoolsToken {
  /**
   * Human-readable token label (class name, symbol description, or token string).
   */
  readonly name: string;

  /**
   * Underlying token category, for icon/grouping in the panel.
   */
  readonly kind: "class" | "string" | "symbol" | "injectionToken";
}

/**
 * Normalized description of one binding registered on a container.
 *
 * @group DevTools
 */
export interface DevtoolsBinding {
  /**
   * Token the binding is registered under.
   */
  readonly token: DevtoolsToken;

  /**
   * Construction strategy.
   */
  readonly type: "Value" | "Instance" | "Factory";

  /**
   * Lifetime scope.
   */
  readonly scope: "Singleton" | "Transient";

  /**
   * Implementation class name for instance bindings; absent otherwise.
   */
  readonly implementation: Optional<string>;
}

/**
 * Normalized snapshot of a service instance's lifecycle status.
 *
 * @group DevTools
 */
export interface DevtoolsInstanceStatus {
  /**
   * Whether the instance was deactivated and removed from its container.
   */
  readonly isDeactivated: boolean;

  /**
   * Provider-ownership state: `null` not yet provisioned, `false` owned, `true` deprovisioned.
   */
  readonly isDeprovisioned: Nullable<boolean>;

  /**
   * Whether the instance's lifecycle has ended (derived).
   */
  readonly isInactive: boolean;

  /**
   * Current provider provision-cycle id, or `null` outside a cycle.
   */
  readonly provisionId: Nullable<number>;
}

/**
 * Normalized description of one active service instance.
 *
 * @group DevTools
 */
export interface DevtoolsInstance {
  /**
   * Token the instance was resolved under.
   */
  readonly token: DevtoolsToken;

  /**
   * Concrete class name of the instance.
   */
  readonly className: string;

  /**
   * Lifecycle status, or `undefined` when the instance is not tracked.
   */
  readonly status: Optional<DevtoolsInstanceStatus>;
}

/**
 * Normalized description of one plugin registered on a container.
 *
 * @group DevTools
 */
export interface DevtoolsPluginInfo {
  /**
   * Plugin class name (for example `"EventsPlugin"` or `"DevToolsPlugin"`).
   */
  readonly name: string;

  /**
   * Messaging-handler kind descriptions the plugin owns; empty for pure observers.
   */
  readonly handles: ReadonlyArray<string>;
}

/**
 * Normalized snapshot of one container.
 *
 * @group DevTools
 */
export interface DevtoolsContainerSnapshot {
  /**
   * Stable id of this container.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Parent container's id, or `null` for a root container.
   */
  readonly parentContainerId: Nullable<DevtoolsContainerId>;

  /**
   * Bindings registered directly on this container, in registration order.
   */
  readonly bindings: ReadonlyArray<DevtoolsBinding>;

  /**
   * Active service instances this container constructed, in creation order.
   */
  readonly instances: ReadonlyArray<DevtoolsInstance>;

  /**
   * Plugins registered directly on this container (own, not inherited).
   */
  readonly plugins: ReadonlyArray<DevtoolsPluginInfo>;
}

/**
 * Full snapshot of one root: every container observed under it.
 *
 * @group DevTools
 */
export interface DevtoolsRootSnapshot {
  /**
   * The root this snapshot belongs to.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Protocol version the snapshot was produced with.
   */
  readonly protocolVersion: number;

  /**
   * Every container observed under this root, root container first.
   */
  readonly containers: ReadonlyArray<DevtoolsContainerSnapshot>;
}

/**
 * Lifecycle phase a {@link DevtoolsEvent} reports.
 *
 * @group DevTools
 */
export type DevtoolsLifecyclePhase =
  | "containerProvision"
  | "containerDeprovision"
  | "activate"
  | "deactivate"
  | "provision"
  | "deprovision";

/**
 * One lifecycle delta emitted to listening backends.
 *
 * @group DevTools
 */
export interface DevtoolsEvent {
  /**
   * Root the event originated from.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Container the event applies to.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Which lifecycle phase fired.
   */
  readonly phase: DevtoolsLifecyclePhase;

  /**
   * The instance the event applies to, or `undefined` for container-boundary phases.
   */
  readonly instance: Optional<DevtoolsInstance>;
}

/**
 * What a plugin hands the hook to register a root: a way to snapshot the root's
 * tree on demand.
 *
 * @group DevTools
 */
export interface DevtoolsRootRegister {
  /**
   * Produces the current snapshot of the root's whole observed subtree.
   */
  snapshot(): DevtoolsRootSnapshot;
}

/**
 * A registered root, as seen by a backend.
 *
 * @group DevTools
 */
export interface DevtoolsRoot extends DevtoolsRootRegister {
  /**
   * The root's id.
   */
  readonly rootId: DevtoolsRootId;
}

/**
 * Backend listener invoked for each lifecycle delta.
 *
 * @group DevTools
 */
export type DevtoolsListener = (event: DevtoolsEvent) => void;

/**
 * The in-page meeting point between installed {@link DevToolsPlugin}s and an
 * inspector backend.
 *
 * @remarks
 * Created lazily on `globalThis` by the first plugin to install and shared by every
 * later plugin (including ones from other library copies on the page). The plugin
 * registers a root and emits lifecycle deltas; the backend snapshots current roots
 * on attach and subscribes for deltas thereafter.
 *
 * @group DevTools
 */
export interface DevtoolsHook {
  /**
   * Protocol version this hook speaks.
   */
  readonly protocolVersion: number;

  /**
   * Registers a root and returns its allocated id.
   *
   * @param register - How to snapshot the root's tree.
   * @returns The new root's id.
   */
  registerRoot(register: DevtoolsRootRegister): DevtoolsRootId;

  /**
   * Removes a root registration.
   *
   * @param rootId - Root to remove.
   */
  deregisterRoot(rootId: DevtoolsRootId): void;

  /**
   * Allocates (or returns) the stable id for a container.
   *
   * @param container - Container to identify; keyed by object identity, so copies
   *   from any library version share one allocator.
   * @returns The container's stable id.
   */
  idForContainer(container: object): DevtoolsContainerId;

  /**
   * Emits a lifecycle delta to all subscribed backends.
   *
   * @param event - The delta to broadcast.
   */
  emit(event: DevtoolsEvent): void;

  /**
   * Subscribes a backend listener.
   *
   * @param listener - Invoked for each emitted event.
   * @returns A function that removes the listener.
   */
  subscribe(listener: DevtoolsListener): () => void;

  /**
   * Returns the currently registered roots, so a late-attaching backend can
   * snapshot existing state before subscribing for deltas.
   *
   * @returns The registered roots.
   */
  getRoots(): ReadonlyArray<DevtoolsRoot>;
}

/**
 * Builds a fresh devtools hook.
 *
 * @returns A new, empty hook.
 */
function createDevtoolsHook(): DevtoolsHook {
  const roots: Map<DevtoolsRootId, DevtoolsRootRegister> = new Map();
  const listeners: Set<DevtoolsListener> = new Set();
  const containerIds: WeakMap<object, DevtoolsContainerId> = new WeakMap();

  let nextRootId: DevtoolsRootId = 1;
  let nextContainerId: DevtoolsContainerId = 1;

  return {
    protocolVersion: DEVTOOLS_PROTOCOL_VERSION,

    registerRoot(register: DevtoolsRootRegister): DevtoolsRootId {
      const rootId: DevtoolsRootId = nextRootId++;

      roots.set(rootId, register);

      return rootId;
    },

    deregisterRoot(rootId: DevtoolsRootId): void {
      roots.delete(rootId);
    },

    idForContainer(container: object): DevtoolsContainerId {
      let id: Optional<DevtoolsContainerId> = containerIds.get(container);

      if (id === undefined) {
        id = nextContainerId++;
        containerIds.set(container, id);
      }

      return id;
    },

    emit(event: DevtoolsEvent): void {
      for (const listener of listeners) {
        listener(event);
      }
    },

    subscribe(listener: DevtoolsListener): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    getRoots(): ReadonlyArray<DevtoolsRoot> {
      return Array.from(roots, ([rootId, register]) => ({ rootId, snapshot: register.snapshot }));
    },
  };
}

/**
 * Returns the existing devtools hook on `globalThis`, or installs a fresh one.
 *
 * @remarks
 * The **only** place that writes to `globalThis`. Called from a plugin's `install`,
 * never by core, so the global appears exactly when (and only when) a
 * {@link DevToolsPlugin} is registered. First-installer wins; later plugins reuse it.
 *
 * @group DevTools
 *
 * @returns The shared devtools hook.
 */
export function installDevtoolsHook(): DevtoolsHook {
  const host: Record<string, unknown> = globalThis as Record<string, unknown>;
  const existing: Optional<DevtoolsHook> = host[DEVTOOLS_HOOK_KEY] as Optional<DevtoolsHook>;

  if (existing) {
    return existing;
  }

  const hook: DevtoolsHook = createDevtoolsHook();

  host[DEVTOOLS_HOOK_KEY] = hook;

  return hook;
}

/**
 * Returns the devtools hook if one is installed, without creating it.
 *
 * @remarks
 * For backends and tests that must not cause the global to appear as a side effect.
 *
 * @group DevTools
 *
 * @returns The installed hook, or `undefined` when none is present.
 */
export function getDevtoolsHook(): Optional<DevtoolsHook> {
  return (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY] as Optional<DevtoolsHook>;
}
