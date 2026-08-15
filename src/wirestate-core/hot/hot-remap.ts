import {
  type Binding,
  type BindingDescriptor,
  type InstanceBindingDescriptor,
  type ServiceToken,
} from "../binding/binding";
import { type Container, type ContainerConfig } from "../container/container";
import { type Optional } from "../types/general";

import { getLatestHotClass } from "./hot-registry";

/**
 * Remaps one binding onto the newest generations of its classes.
 *
 * @internal
 *
 * @param binding - Possibly stale binding.
 * @returns Binding with class token and instance implementation remapped.
 */
export function remapHotBinding(binding: Binding): Binding {
  if (typeof binding === "function") {
    return getLatestHotClass(binding);
  }

  // Malformed bindings pass through untouched so registration validation reports its own error.
  if (binding === null || typeof binding !== "object") {
    return binding;
  }

  const token: ServiceToken = getLatestHotClass(binding.token);
  const value: Optional<unknown> = (binding as InstanceBindingDescriptor).value;

  // Only instance descriptors carry a class in `value`. Factory closures and plain
  // values cannot be remapped: they live in config modules, and editing those goes
  // through the ordinary provider remount path instead.
  if (binding.type === "Instance" && typeof value === "function") {
    const implementation: unknown = getLatestHotClass(value);

    if (token !== binding.token || implementation !== value) {
      return { ...(binding as InstanceBindingDescriptor), token, value: implementation } as Binding;
    }

    return binding;
  }

  return token === binding.token ? binding : ({ ...(binding as BindingDescriptor), token } as Binding);
}

/**
 * Returns whether any class referenced by the config has a newer generation.
 *
 * @internal
 *
 * @param config - Config the live container was constructed from.
 * @returns Whether a swap would construct a different container.
 */
export function isHotConfigOutdated(config: ContainerConfig): boolean {
  return (config.bindings ?? []).some((binding) => remapHotBinding(binding) !== binding);
}

/**
 * Rebuilds a container config around the newest class generations.
 *
 * @internal
 *
 * @param config - Original construction config.
 * @param parent - Replacement parent when the parent container was itself swapped.
 * @returns Config safe to construct a replacement container from.
 */
export function remapHotConfig(config: ContainerConfig, parent: Optional<Container>): ContainerConfig {
  return {
    ...config,
    activate: Array.isArray(config.activate)
      ? config.activate.map((token) => getLatestHotClass(token))
      : config.activate,
    bindings: config.bindings?.map(remapHotBinding),
    parent: parent ?? config.parent,
  };
}
