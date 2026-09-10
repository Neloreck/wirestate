import { type ContainerConfig, Container } from "@wirestate/core";

import { type Optional } from "../types/general";

/**
 * Builds a managed container from provider config, activating every binding unless the config
 * says otherwise.
 *
 * @remarks
 * Also the `create` step of a development hot swap, so a rebuilt container follows the same rule.
 *
 * @group Provision
 * @internal
 *
 * @param config - Config the provider mounted with, or its hot-remapped equivalent.
 * @returns A new container the provider owns.
 */
export function createManagedContainer(config: ContainerConfig): Container {
  return new Container({ ...config, activate: config.activate ?? true });
}

/**
 * Managed containers waiting for deferred destruction after a React effect cleanup, keyed by container.
 *
 * @remarks
 * React (notably in StrictMode) unmounts and remounts effects synchronously, and a hot swap commits a
 * replacement while the previous container is still winding down. Destroying immediately in cleanup
 * would tear down a container the very next effect setup reuses, so destruction is deferred by one
 * tick and cancelled when the same container is provisioned again in between.
 *
 * @group Provision
 * @internal
 */
export type PendingDestructions = Map<Container, ReturnType<typeof setTimeout>>;

/**
 * Cancels the deferred destruction of a container that React committed again.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to keep alive.
 * @param pending - Containers scheduled for deferred destruction.
 */
export function retainContainer(container: Container, pending: PendingDestructions): void {
  const timeout: Optional<ReturnType<typeof setTimeout>> = pending.get(container);

  if (timeout !== undefined) {
    clearTimeout(timeout);
    pending.delete(container);
  }
}

/**
 * Deprovisions a managed container now and destroys it once React has had a chance to recommit it.
 *
 * @remarks
 * Idempotent while the destruction is pending: a second call for the same container changes nothing.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to dispose unless it is retained first.
 * @param pending - Containers scheduled for deferred destruction.
 */
export function scheduleContainerDestruction(container: Container, pending: PendingDestructions): void {
  if (pending.has(container)) {
    return;
  }

  container.deprovision();

  pending.set(
    container,
    setTimeout(() => {
      pending.delete(container);
      container.destroy();
    }, 0)
  );
}
