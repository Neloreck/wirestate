import type { ContainerKernel } from "../container/container-kernel";
import type { ActivationRecord } from "../container/container-storage";
import type { Optional, Maybe } from "../types/general";

/**
 * Participates in the full instance lifecycle for one container.
 *
 * @remarks
 * The composition root ({@link Container}) installs an adapter that layers
 * Wirestate instance lifecycle - instance/container tracking, `WireStatus`,
 * `@OnActivation` / `@OnDeactivation` hooks, and messaging registration - on top
 * of the pure-DI kernel. A bare {@link ContainerKernel} with no adapter performs
 * construction and caching only.
 *
 * The kernel invokes these hooks for instance bindings: `activate` after the
 * instance is constructed (before it is committed), `deactivate` before a
 * committed instance is dropped on unbind, and `rollback` when activation fails.
 *
 * @internal
 */
export interface ActivationAdapter {
  /**
   * Runs after a service instance is constructed, before it is committed.
   *
   * @param container - Container resolving the instance binding.
   * @param record - Activation record carrying the constructed instance.
   */
  activate(container: ContainerKernel, record: ActivationRecord): void;

  /**
   * Runs before a committed service instance is dropped on `unbind`/`unbindAll`.
   *
   * @param container - Container that owns the activation record.
   * @param record - Activation record of the instance being deactivated.
   */
  deactivate(container: ContainerKernel, record: ActivationRecord): void;

  /**
   * Runs when activation fails, to unwind a partial activation.
   *
   * @param container - Container whose activation failed.
   * @param record - Activation record of the instance that failed to activate.
   */
  rollback(container: ContainerKernel, record: ActivationRecord): void;
}

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
 * @internal
 *
 * @param container - Container whose activations the adapter participates in.
 * @param adapter - Adapter to install.
 */
export function setActivationAdapter(container: ContainerKernel, adapter: ActivationAdapter): void {
  ACTIVATION_ADAPTERS.set(container, adapter);
}

/**
 * Returns the nearest activation adapter up the parent chain.
 *
 * @remarks
 * The parent walk lets child containers constructed directly from a composed
 * parent keep participating in instance lifecycle without their own installation.
 *
 * @internal
 *
 * @param container - Container being activated against.
 * @returns The nearest installed adapter, or `undefined`.
 */
export function getActivationAdapter(container: ContainerKernel): Optional<ActivationAdapter> {
  let current: Maybe<ContainerKernel> = container;

  while (current) {
    const adapter: Maybe<ActivationAdapter> = ACTIVATION_ADAPTERS.get(current);

    if (adapter) {
      return adapter;
    }

    current = current.parent;
  }

  return undefined;
}
