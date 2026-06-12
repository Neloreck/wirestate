import type { ContainerKernel } from "./container-kernel";

/**
 * Participates in instance Activation for one container.
 *
 * @remarks
 * Runs between {@link WireStatus} initialization and `@OnActivated`, for every
 * non-transient instance binding the container activates. Cleanup integrates by
 * pushing onto `disposers` immediately as resources are acquired — disposers
 * pushed before a mid-adapter throw still run during activation rollback. A
 * synchronous throw aborts the activation: the kernel rolls back and rethrows.
 *
 * @internal
 */
export type ActivationAdapter = (container: ContainerKernel, instance: object, disposers: Array<() => void>) => void;

/**
 * Internal storage for the activation adapter installed per container.
 */
const ACTIVATION_ADAPTERS: WeakMap<ContainerKernel, ActivationAdapter> = new WeakMap();

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
export function setActivationAdapter(container: ContainerKernel, adapter: ActivationAdapter): void {
  ACTIVATION_ADAPTERS.set(container, adapter);
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
export function getActivationAdapter(container: ContainerKernel): ActivationAdapter | undefined {
  let current: ContainerKernel | undefined = container;

  while (current) {
    const adapter: ActivationAdapter | undefined = ACTIVATION_ADAPTERS.get(current);

    if (adapter) {
      return adapter;
    }

    current = current.parent;
  }

  return undefined;
}
