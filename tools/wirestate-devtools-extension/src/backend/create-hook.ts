import type {
  DevtoolsContainerId,
  DevtoolsEvent,
  DevtoolsHook,
  DevtoolsInstanceId,
  DevtoolsListener,
  DevtoolsRoot,
  DevtoolsRootId,
  DevtoolsRootRegister,
} from "@wirestate/core/devtools";

import type { Optional } from "@/types/general";

/**
 * Well-known global key the devtools hook lives under. Hardcoded (not imported from
 * `@wirestate/core`) so the backend stays dependency-free and reads whatever copy of Wirestate the
 * inspected page bundled. This string is the public contract (`DEVTOOLS_HOOK_KEY`).
 */
export const HOOK_KEY: string = "__WIRESTATE_DEVTOOLS_HOOK__";

/**
 *  Protocol version stamped on a hook this backend creates (pre-seed path).
 */
export const FALLBACK_PROTOCOL_VERSION: number = 1;

/**
 * Pre-seeds the devtools hook, or reuses one already present — the first-writer-wins handshake from
 * the backend side: win the race and the app's plugin reuses our hook; lose it and we attach to the
 * plugin's. Either way every plugin/library-copy on the page converges on one hook.
 *
 * @returns The devtools hook shared across every Wirestate copy on the page.
 */
export function ensureHook(): DevtoolsHook {
  const host: Record<string, unknown> = globalThis as Record<string, unknown>;
  const existing: Optional<DevtoolsHook> = host[HOOK_KEY] as Optional<DevtoolsHook>;

  if (existing) {
    return existing;
  }

  const hook: DevtoolsHook = createHook();

  host[HOOK_KEY] = hook;

  return hook;
}

/**
 * Mirrors the library's `createDevtoolsHook` so a pre-seeded hook is interchangeable.
 *
 * @returns A fresh devtools hook implementing the v1 protocol.
 */
function createHook(): DevtoolsHook {
  const roots: Map<DevtoolsRootId, DevtoolsRootRegister> = new Map();
  const listeners: Set<DevtoolsListener> = new Set();
  const containerIds: WeakMap<object, DevtoolsContainerId> = new WeakMap();
  const instanceIds: WeakMap<object, DevtoolsInstanceId> = new WeakMap();

  let nextRootId: DevtoolsRootId = 1;
  let nextContainerId: DevtoolsContainerId = 1;
  let nextInstanceId: DevtoolsInstanceId = 1;

  return {
    protocolVersion: FALLBACK_PROTOCOL_VERSION,
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
