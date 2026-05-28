import {
  Container,
  deprovisionContainer,
  unbindAll,
  type ProvisionLifecycle as CoreProvisionLifecycle,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Maybe } from "../types/general";

/**
 * Tracks provider lifecycle state for containers owned by React providers.
 *
 * @group Provision
 * @internal
 */
export interface ProvisionLifecycle {
  /**
   * Containers waiting for delayed destruction after React cleanup.
   */
  readonly pendingDestruction: Map<Container, ReturnType<typeof setTimeout>>;

  /**
   * Services resolved for provider lifecycle hooks by container.
   */
  readonly provisionedServices: CoreProvisionLifecycle;
}

/**
 * Cancels delayed destruction for a container that survived a React effect cleanup.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to retain.
 * @param lifecycle - Provider lifecycle state.
 */
export function retainContainer(container: Container, lifecycle: ProvisionLifecycle): void {
  const timeout: Maybe<ReturnType<typeof setTimeout>> = lifecycle.pendingDestruction.get(container);

  if (timeout) {
    dbg.info(prefix(__filename), "Retaining container:", { container });

    clearTimeout(timeout);
    lifecycle.pendingDestruction.delete(container);
  }
}

/**
 * Schedules container disposal after React has had a chance to recommit the same container.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to dispose if it is not retained.
 * @param lifecycle - Provider lifecycle state.
 */
export function scheduleContainerDestruction(container: Container, lifecycle: ProvisionLifecycle): void {
  if (lifecycle.pendingDestruction.has(container)) {
    return;
  }

  deprovisionContainer(container, lifecycle.provisionedServices);

  dbg.info(prefix(__filename), "Scheduling container destruction:", { container });

  lifecycle.pendingDestruction.set(
    container,
    setTimeout(() => {
      dbg.info(prefix(__filename), "Destroying container:", { container });

      lifecycle.pendingDestruction.delete(container);
      unbindAll(container);
    }, 0)
  );
}
