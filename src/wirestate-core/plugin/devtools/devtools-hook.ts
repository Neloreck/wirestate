import { type Optional } from "../../types/general";

import {
  type DevtoolsContainerId,
  type DevtoolsEvent,
  type DevtoolsHook,
  type DevtoolsInstanceId,
  type DevtoolsListener,
  type DevtoolsRoot,
  type DevtoolsRootId,
  type DevtoolsRootRegister,
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
        serviceRefOf: register.serviceRefOf,
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
