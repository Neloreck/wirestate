import type { InstanceBindingDescriptor } from "../binding/binding";
import { callLifecycleHandler } from "../container/container-call-lifecycle-handler";
import type { ContainerKernel } from "../container/container-kernel";
import type { ActivationRecord } from "../container/container-storage";
import { getContainerProvisionStatus } from "../provision/provision-state";
import type { Definable, Maybe } from "../types/general";

import { getActivationAdapter } from "./activation-adapter";
import { getActivatedHandlerMetadata } from "./on-activated";
import { getDeactivationHandlerMetadata } from "./on-deactivation";
import { WireStatus } from "./wire-status";

/**
 * ContainerKernel-maintained mapping of activated service instances to their owning containers.
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
 * Activates a service instance for an instance binding.
 *
 * @remarks
 * Runs the Wirestate side of instance activation: tracks the instance to
 * container mapping, initializes {@link WireStatus}, runs the container's
 * activation adapter (the composition root installs messaging registration
 * there), and invokes the `@OnActivated` hook.
 *
 * Adapter cleanup callbacks are collected onto `record.disposers`, so a
 * failed activation can roll back with {@link rollbackInstanceActivation}.
 *
 * @param container - ContainerKernel resolving the instance binding.
 * @param record - Activation record carrying the constructed instance.
 * @internal
 */
export function activateInstance(container: ContainerKernel, record: ActivationRecord): void {
  const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
  const instance: object = record.instance as object;

  INSTANCE_CONTAINERS.set(instance, container);

  initializeInstanceStatus(container, instance);
  getActivationAdapter(container)?.(container, instance, record.disposers);

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
}

/**
 * Deactivates a service instance for an instance binding.
 *
 * @remarks
 * Invokes the `@OnDeactivation` hook, marks the {@link WireStatus} as
 * disposed, runs the collected handler disposers, and clears the instance to
 * container mapping.
 *
 * @param container - ContainerKernel that owns the activation record.
 * @param record - Activation record of the instance being deactivated.
 * @internal
 */
export function deactivateInstance(container: ContainerKernel, record: ActivationRecord): void {
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
      source: "instance-deactivation",
    });
  }

  unregisterInstanceStatus(instance);
  runDisposers(record);

  INSTANCE_CONTAINERS.delete(instance);
}

/**
 * Rolls back a failed instance activation.
 *
 * @remarks
 * Marks the {@link WireStatus} as disposed, runs the disposers collected
 * before the failure, and clears the instance to container mapping. The
 * container drops the activation record, so no partial registration survives.
 *
 * @param container - ContainerKernel whose activation failed.
 * @param record - Activation record of the instance that failed to activate.
 * @internal
 */
export function rollbackInstanceActivation(container: ContainerKernel, record: ActivationRecord): void {
  const instance: object = record.instance as object;

  unregisterInstanceStatus(instance);
  runDisposers(record);

  INSTANCE_CONTAINERS.delete(instance);
}

/**
 * Starts lifecycle tracking for an activated instance.
 *
 * @param container - Owning container.
 * @param instance - Activated instance.
 * @internal
 */
export function initializeInstanceStatus(container: ContainerKernel, instance: object): void {
  const status: WireStatus = WireStatus.for(instance, { initialize: true });

  status.isDisposed = false;

  const isProvisioned = getContainerProvisionStatus(container);

  status.isDeprovisioned = isProvisioned === undefined ? null : !isProvisioned;
  status.provisionId = null;
}

/**
 * Marks an instance as deactivated.
 *
 * @param instance - Deactivated instance.
 * @internal
 */
export function unregisterInstanceStatus(instance: object): void {
  const status: WireStatus = WireStatus.for(instance);

  status.isDisposed = true;
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
