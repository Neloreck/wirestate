import { Container } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Maybe } from "../types/general";

/**
 * Containers waiting for delayed destruction after React cleanup, keyed by container.
 *
 * @remarks
 * React (notably in StrictMode) unmounts and remounts effects synchronously. The
 * delay gives React a chance to recommit the same container before it is torn
 * down, so a strict-mode double effect does not destroy a container that is
 * about to be reused.
 *
 * @group Provision
 * @internal
 */
export type ReactContainerProvisionLifecycle = Map<Container, ReturnType<typeof setTimeout>>;

/**
 * Cancels delayed destruction for a container that survived a React effect cleanup.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to retain.
 * @param pendingDestruction - Containers scheduled for delayed destruction.
 */
export function retainContainer(container: Container, pendingDestruction: ReactContainerProvisionLifecycle): void {
  const timeout: Maybe<ReturnType<typeof setTimeout>> = pendingDestruction.get(container);

  if (timeout) {
    dbg.info(prefix(__filename), "Retaining container:", { container });

    clearTimeout(timeout);
    pendingDestruction.delete(container);
  }
}

/**
 * Schedules container disposal after React has had a chance to recommit the same container.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to dispose if it is not retained.
 * @param pendingDestruction - Containers scheduled for delayed destruction.
 */
export function scheduleContainerDestruction(
  container: Container,
  pendingDestruction: ReactContainerProvisionLifecycle
): void {
  if (pendingDestruction.has(container)) {
    return;
  }

  container.deprovision();

  dbg.info(prefix(__filename), "Scheduling container destruction:", { container });

  pendingDestruction.set(
    container,
    setTimeout(() => {
      dbg.info(prefix(__filename), "Destroying container:", { container });

      pendingDestruction.delete(container);
      container.unbindAll();
    }, 0)
  );
}
