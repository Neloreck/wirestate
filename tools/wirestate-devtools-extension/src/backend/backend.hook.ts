import {
  DEVTOOLS_HOOK_KEY,
  type DevtoolsContainerId,
  type DevtoolsEvent,
  type DevtoolsHook,
  type DevtoolsInstanceId,
  type DevtoolsListener,
  type DevtoolsRoot,
  type DevtoolsRootId,
  type DevtoolsRootRegister,
} from "@wirestate/core/devtools";

import { FALLBACK_PROTOCOL_VERSION } from "@/backend/backend.config";
import { type Optional } from "@/types/general";

/**
 * Mirrors core's `DevtoolsHookHost` so a hook this backend pre-seeds is interchangeable with the one
 * the app's `DevToolsPlugin` would install. Kept structurally parallel to core's class so any drift
 * from the protocol is obvious on review.
 */
class BackendHookHost implements DevtoolsHook {
  public readonly protocolVersion: number = FALLBACK_PROTOCOL_VERSION;

  private readonly roots: Map<DevtoolsRootId, DevtoolsRootRegister> = new Map();
  private readonly listeners: Set<DevtoolsListener> = new Set();
  private readonly containerIds: WeakMap<object, DevtoolsContainerId> = new WeakMap();
  private readonly instanceIds: WeakMap<object, DevtoolsInstanceId> = new WeakMap();

  private nextRootId: DevtoolsRootId = 1;
  private nextContainerId: DevtoolsContainerId = 1;
  private nextInstanceId: DevtoolsInstanceId = 1;

  public registerRoot(register: DevtoolsRootRegister): DevtoolsRootId {
    const rootId: DevtoolsRootId = this.nextRootId++;

    this.roots.set(rootId, register);

    return rootId;
  }

  public deregisterRoot(rootId: DevtoolsRootId): void {
    this.roots.delete(rootId);
  }

  public idForContainer(container: object): DevtoolsContainerId {
    let id: Optional<DevtoolsContainerId> = this.containerIds.get(container);

    if (id === undefined) {
      id = this.nextContainerId++;
      this.containerIds.set(container, id);
    }

    return id;
  }

  public idForInstance(instance: object): DevtoolsInstanceId {
    let id: Optional<DevtoolsInstanceId> = this.instanceIds.get(instance);

    if (id === undefined) {
      id = this.nextInstanceId++;
      this.instanceIds.set(instance, id);
    }

    return id;
  }

  public emit(event: DevtoolsEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public subscribe(listener: DevtoolsListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getRoots(): ReadonlyArray<DevtoolsRoot> {
    return Array.from(this.roots, ([rootId, register]) => ({
      rootId,
      snapshot: register.snapshot,
      inspect: register.inspect,
      serviceRefOf: register.serviceRefOf,
    }));
  }
}

/**
 * Pre-seeds the devtools hook, or reuses one already present — the first-writer-wins handshake from
 * the backend side: win the race and the app's plugin reuses our hook; lose it and we attach to the
 * plugin's. Either way every plugin/library-copy on the page converges on one hook.
 *
 * @returns The devtools hook shared across every Wirestate copy on the page.
 */
export function ensureHook(): DevtoolsHook {
  const host: Record<string, unknown> = globalThis as Record<string, unknown>;
  const existing: Optional<DevtoolsHook> = host[DEVTOOLS_HOOK_KEY] as Optional<DevtoolsHook>;

  if (existing) {
    return existing;
  }

  const hook: DevtoolsHook = new BackendHookHost();

  host[DEVTOOLS_HOOK_KEY] = hook;

  return hook;
}
