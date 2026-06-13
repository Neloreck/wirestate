import type { InstanceBindingDescriptor } from "../binding/binding";
import { callLifecycleHandler } from "../container/container-call-lifecycle-handler";
import type { ContainerKernel } from "../container/container-kernel";
import type { ActivationRecord } from "../container/container-storage";
import { registerMessagingHandlers } from "../messaging/messaging-activation";
import { getContainerProvisionStatus } from "../provision/provision-state";
import type { Definable, Maybe } from "../types/general";

import type { ActivationAdapter } from "./activation-adapter";
import { getActivatedHandlerMetadata } from "./on-activated";
import { getDeactivationHandlerMetadata } from "./on-deactivation";
import { WireStatus } from "./wire-status";

/**
 * Kernel-maintained mapping of activated service instances to their owning containers.
 *
 * Written at the container's activation commit point and cleared on deactivation,
 * so lookups never observe a partially activated instance.
 */
const INSTANCE_CONTAINERS: WeakMap<object, ContainerKernel> = new WeakMap();

/**
 * Returns the container that activated a service instance.
 *
 * @param instance - Resolved service instance to look up.
 * @returns The owning container, or `undefined` when the instance is not active.
 */
export function getInstanceContainer(instance: object): Definable<ContainerKernel> {
  return INSTANCE_CONTAINERS.get(instance);
}

/**
 * The Wirestate instance lifecycle layered on the pure-DI kernel.
 *
 * @remarks
 * Installed by the {@link Container} composition root via `setActivationAdapter`.
 * It tracks the instance↔container mapping, initializes {@link WireStatus}
 * (including the container's current provision status), registers messaging
 * handlers, and invokes the `@OnActivated` / `@OnDeactivation` hooks. A bare
 * {@link ContainerKernel} without this adapter constructs and caches only.
 *
 * @internal
 */
export const wirestateActivationAdapter: ActivationAdapter = {
  activate(container: ContainerKernel, record: ActivationRecord): void {
    const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
    const instance: object = record.instance as object;

    INSTANCE_CONTAINERS.set(instance, container);

    initializeInstanceStatus(container, instance);
    registerMessagingHandlers(container, instance, record.disposers);

    const methodName: Maybe<string | symbol> = getActivatedHandlerMetadata(instance);

    if (methodName) {
      callLifecycleHandler({
        container,
        name: "@OnActivated",
        details: [binding.value.name, String(methodName)],
        instance,
        instanceName: binding.value.name,
        methodName,
        rethrowSync: true,
        source: "instance-activation",
      });
    }
  },

  deactivate(container: ContainerKernel, record: ActivationRecord): void {
    const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
    const instance: object = record.instance as object;

    const methodName: Maybe<string | symbol> = getDeactivationHandlerMetadata(instance);

    if (methodName) {
      callLifecycleHandler({
        container,
        name: "@OnDeactivation",
        details: [binding.value.name, String(methodName)],
        instance,
        instanceName: binding.value.name,
        methodName,
        rethrowSync: false,
        source: "instance-deactivation",
      });
    }

    finalizeInstanceStatus(instance);
    runDisposers(record);

    INSTANCE_CONTAINERS.delete(instance);
  },

  rollback(_container: ContainerKernel, record: ActivationRecord): void {
    const instance: object = record.instance as object;

    finalizeInstanceStatus(instance);
    runDisposers(record);

    INSTANCE_CONTAINERS.delete(instance);
  },
};

/**
 * Starts lifecycle tracking for an activated instance.
 *
 * @param container - Owning container.
 * @param instance - Activated instance.
 * @internal
 */
export function initializeInstanceStatus(container: ContainerKernel, instance: object): void {
  const status: WireStatus = WireStatus.for(instance, { initialize: true });

  status.isDeactivated = false;

  const isProvisioned: Definable<boolean> = getContainerProvisionStatus(container);

  status.isDeprovisioned = isProvisioned === undefined ? null : !isProvisioned;
  status.provisionId = null;
}

/**
 * Ends lifecycle tracking for a deactivated instance.
 *
 * @param instance - Deactivated instance.
 * @internal
 */
export function finalizeInstanceStatus(instance: object): void {
  const status: WireStatus = WireStatus.for(instance);

  status.isDeactivated = true;
  status.isDeprovisioned = true;
}

/**
 * Invokes and clears the disposers collected on an activation record.
 *
 * @param record - Activation record being deactivated or rolled back.
 */
function runDisposers(record: ActivationRecord): void {
  for (const dispose of record.disposers) {
    dispose();
  }

  record.disposers.length = 0;
}
