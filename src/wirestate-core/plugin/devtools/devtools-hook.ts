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
 * Upper bound on the recent-event backlog retained for replay to late subscribers.
 */
const MAX_REPLAY_EVENTS = 1024;

/**
 * In-page host implementing the devtools hook: owns the registered roots, the subscriber listeners,
 * and the stable id allocators. One instance is created by {@link installDevtoolsHook} and shared by
 * every Wirestate copy on the page (so ids stay consistent across library versions).
 *
 * @group DevTools
 */
class DevtoolsHookHost implements DevtoolsHook {
  public readonly protocolVersion: number = DEVTOOLS_PROTOCOL_VERSION;

  private readonly roots: Map<DevtoolsRootId, DevtoolsRootRegister> = new Map();
  private readonly listeners: Set<DevtoolsListener> = new Set();
  private readonly recent: Array<DevtoolsEvent> = [];
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
    this.recent.push(event);

    if (this.recent.length > MAX_REPLAY_EVENTS) {
      this.recent.shift();
    }

    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public subscribe(listener: DevtoolsListener): () => void {
    for (const event of [...this.recent]) {
      listener(event);
    }

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
  } else {
    const hook: DevtoolsHook = new DevtoolsHookHost();

    host[DEVTOOLS_HOOK_KEY] = hook;

    return hook;
  }
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
