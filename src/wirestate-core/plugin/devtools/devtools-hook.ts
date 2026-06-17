import type { Optional } from "../../types/general";

import type {
  DevtoolsContainerId,
  DevtoolsEvent,
  DevtoolsInstanceId,
  DevtoolsListener,
  DevtoolsRoot,
  DevtoolsRootId,
  DevtoolsRootRegister,
} from "./devtools-hook.types";

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
   * Allocates (or returns) the stable id for a service instance.
   *
   * @param instance - Instance to identify; keyed by object identity, so copies from any library
   *   version share one allocator.
   * @returns The instance's stable id.
   */
  idForInstance(instance: object): DevtoolsInstanceId;

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
  const instanceIds: WeakMap<object, DevtoolsInstanceId> = new WeakMap();

  let nextRootId: DevtoolsRootId = 1;
  let nextContainerId: DevtoolsContainerId = 1;
  let nextInstanceId: DevtoolsInstanceId = 1;

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

    idForInstance(instance: object): DevtoolsInstanceId {
      let id: Optional<DevtoolsInstanceId> = instanceIds.get(instance);

      if (id === undefined) {
        id = nextInstanceId++;
        instanceIds.set(instance, id);
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
      return Array.from(roots, ([rootId, register]) => ({
        rootId,
        snapshot: register.snapshot,
        inspect: register.inspect,
      }));
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
