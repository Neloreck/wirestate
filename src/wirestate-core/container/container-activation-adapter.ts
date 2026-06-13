import type { Maybe } from "../types/general";

import type { ContainerKernel } from "./container-kernel";

/**
 * Participates in instance Activation for one container.
 *
 * @internal
 */
export type ContainerActivationAdapter = (
  container: ContainerKernel,
  instance: object,
  disposers: Array<() => void>
) => void;

/**
 * Internal storage for the activation adapter installed per container.
 */
const CONTAINER_ACTIVATION_ADAPTERS: WeakMap<ContainerKernel, ContainerActivationAdapter> = new WeakMap();

/**
 * Installs the activation adapter for a container. Last write wins.
 *
 * @remarks
 * Composition roots install the adapter during container construction, before
 * any binding is activated.
 *
 * @param container - Container whose activations the adapter participates in.
 * @param adapter - Adapter to install.
 * @internal
 */
export function setContainerActivationAdapter(container: ContainerKernel, adapter: ContainerActivationAdapter): void {
  CONTAINER_ACTIVATION_ADAPTERS.set(container, adapter);
}

/**
 * Returns the nearest activation adapter up the parent chain.
 *
 * @remarks
 * The parent walk lets child containers constructed directly from a composed
 * parent keep participating in messaging without their own installation.
 *
 * @param container - Container being activated against.
 * @returns The nearest installed adapter, or `undefined`.
 * @internal
 */
export function getContainerActivationAdapter(container: ContainerKernel): Maybe<ContainerActivationAdapter> {
  let current: Maybe<ContainerKernel> = container;

  while (current) {
    const adapter: Maybe<ContainerActivationAdapter> = CONTAINER_ACTIVATION_ADAPTERS.get(current);

    if (adapter) {
      return adapter;
    }

    current = current.parent;
  }

  return null;
}
