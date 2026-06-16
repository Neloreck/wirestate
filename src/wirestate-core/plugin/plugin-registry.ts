import type { ServiceToken } from "../binding/binding";
import type { Container } from "../container/container";
import type { ContainerKernel } from "../container/container-kernel";
import type { Maybe } from "../types/general";

import type { WirestatePlugin } from "./plugin";

/**
 * Plugins registered directly on a container (its own `config.plugins`).
 *
 * @remarks
 * The effective set for a container is its own plugins unioned with every
 * ancestor's, resolved by walking the parent chain, mirroring the
 * activation adapter's parent walk.
 *
 * @internal
 */
const CONTAINER_PLUGINS: WeakMap<ContainerKernel, ReadonlyArray<WirestatePlugin>> = new WeakMap();

/**
 * Stores the plugins a container is registered with.
 *
 * @internal
 *
 * @param container - Container registering the plugins.
 * @param plugins - Plugins from `config.plugins`.
 */
export function setContainerPlugins(container: ContainerKernel, plugins: ReadonlyArray<WirestatePlugin>): void {
  CONTAINER_PLUGINS.set(container, plugins);
}

/**
 * Returns the plugins registered directly on a container (ignoring ancestors).
 *
 * @internal
 *
 * @param container - Container to inspect.
 * @returns The container's own plugins, or an empty array.
 */
export function getOwnPlugins(container: ContainerKernel): ReadonlyArray<WirestatePlugin> {
  return CONTAINER_PLUGINS.get(container) ?? [];
}

/**
 * Resolves the effective plugin set for a container: its own plugins unioned with
 * every ancestor's, nearest first, each plugin instance appearing once.
 *
 * @internal
 *
 * @param container - Container being dispatched against.
 * @returns Effective plugins, nearest container first.
 */
export function getEffectivePlugins(container: ContainerKernel): ReadonlyArray<WirestatePlugin> {
  const result: Array<WirestatePlugin> = [];
  const seen: Set<WirestatePlugin> = new Set();
  const claimedKinds: Set<symbol> = new Set();

  let current: Maybe<ContainerKernel> = container;

  while (current) {
    for (const plugin of CONTAINER_PLUGINS.get(current) ?? []) {
      if (seen.has(plugin)) {
        continue;
      }

      const kinds: Maybe<ReadonlyArray<symbol>> = plugin.handles;

      if (kinds && kinds.length > 0 && kinds.every((kind: symbol) => claimedKinds.has(kind))) {
        continue;
      }

      seen.add(plugin);
      result.push(plugin);

      if (kinds) {
        for (const kind of kinds) {
          claimedKinds.add(kind);
        }
      }
    }

    current = current.parent;
  }

  return result;
}

/**
 * Runs `install` for the container's own plugins, once, at registration.
 *
 * @remarks
 * Inheriting children do not re-install an ancestor's plugin. A setup phase: a
 * throw propagates and fails container construction.
 *
 * @internal
 *
 * @param container - Container the plugins are registered on.
 */
export function installOwnPlugins(container: Container): void {
  for (const plugin of getOwnPlugins(container)) {
    plugin.install?.(container);
  }
}

/**
 * Returns whether any effective plugin participates in (force-activates) a token.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 * @param token - Binding token to inspect.
 * @returns Whether some plugin claims the token as a participant.
 */
export function isPluginParticipant(container: ContainerKernel, token: ServiceToken): boolean {
  for (const plugin of getEffectivePlugins(container)) {
    if (plugin.participates?.(token)) {
      return true;
    }
  }

  return false;
}

/**
 * Dispatches `onActivate` to the effective plugins (setup: may throw, atomic).
 *
 * @internal
 *
 * @param container - Container that activated the instance.
 * @param instance - The activated instance.
 */
export function dispatchPluginActivate(container: ContainerKernel, instance: object): void {
  for (const plugin of getEffectivePlugins(container)) {
    plugin.onActivate?.(instance, container as Container);
  }
}

/**
 * Dispatches `onDeactivate` to the effective plugins in reverse (teardown: failsafe).
 *
 * @internal
 *
 * @param container - Container that owns the instance.
 * @param instance - The instance being deactivated.
 */
export function dispatchPluginDeactivate(container: ContainerKernel, instance: object): void {
  for (const plugin of reversed(getEffectivePlugins(container))) {
    runFailsafe(() => plugin.onDeactivate?.(instance, container as Container));
  }
}

/**
 * Dispatches `onProvision` to the effective plugins (setup: may throw, atomic).
 *
 * @internal
 *
 * @param container - Container being provisioned.
 * @param instance - The provisioned instance.
 * @param addDisposer - Registers a teardown callback for this provision cycle.
 */
export function dispatchPluginProvision(
  container: ContainerKernel,
  instance: object,
  addDisposer: (dispose: () => void) => void
): void {
  for (const plugin of getEffectivePlugins(container)) {
    plugin.onProvision?.(instance, container as Container, addDisposer);
  }
}

/**
 * Dispatches `onDeprovision` to the effective plugins in reverse (teardown: failsafe).
 *
 * @internal
 *
 * @param container - Container being deprovisioned.
 * @param instance - The instance being deprovisioned.
 */
export function dispatchPluginDeprovision(container: ContainerKernel, instance: object): void {
  for (const plugin of reversed(getEffectivePlugins(container))) {
    runFailsafe(() => plugin.onDeprovision?.(instance, container as Container));
  }
}

/**
 * Dispatches `onContainerProvision` to the effective plugins (setup: may throw).
 *
 * @internal
 *
 * @param container - Container being provisioned.
 */
export function dispatchPluginContainerProvision(container: ContainerKernel): void {
  for (const plugin of getEffectivePlugins(container)) {
    plugin.onContainerProvision?.(container as Container);
  }
}

/**
 * Dispatches `onContainerDeprovision` to the effective plugins in reverse (teardown: failsafe).
 *
 * @internal
 *
 * @param container - Container being deprovisioned.
 */
export function dispatchPluginContainerDeprovision(container: ContainerKernel): void {
  for (const plugin of reversed(getEffectivePlugins(container))) {
    runFailsafe(() => plugin.onContainerDeprovision?.(container as Container));
  }
}

/**
 * Returns a shallow-reversed copy of the plugins for teardown dispatch.
 *
 * @param plugins - Effective plugins in setup (registration) order.
 * @returns The plugins reversed for teardown order.
 */
function reversed(plugins: ReadonlyArray<WirestatePlugin>): ReadonlyArray<WirestatePlugin> {
  return [...plugins].reverse();
}

/**
 * Runs a teardown callback, swallowing any error so teardown never aborts.
 *
 * @param run - Teardown callback to run.
 */
function runFailsafe(run: () => void): void {
  try {
    run();
  } catch {
    // Failsafe: teardown errors are swallowed so teardown never aborts.
  }
}
