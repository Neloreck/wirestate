import { type InstanceBindingDescriptor } from "../binding/binding";
import { type Container } from "../container/container";
import { type ContainerKernel } from "../container/container-kernel";
import { type ActivationRecord } from "../container/container-storage";
import { reportWirestateError } from "../error/wirestate-error-handler";
import { callLifecycleHandler } from "../lifecycle/call-lifecycle-handler";
import { dispatchPluginActivate, dispatchPluginDeactivate } from "../plugin/plugin-registry";
import { deprovisionContainerInstance } from "../provision/provision-lifecycle";
import { type ProvisionPhase, getProvisionPhase } from "../provision/provision-state";
import { type Maybe, type Nullable, type Optional } from "../types/general";

import { type ActivationAdapter } from "./activation-adapter";
import { getActivationHandlerMetadata } from "./on-activation";
import { getDeactivationHandlerMetadata } from "./on-deactivation";
import { type MutableWireStatus, getMutableStatus, trackMutableStatus } from "./wire-status";

/**
 * The Wirestate instance lifecycle layered on the pure-DI kernel.
 *
 * @remarks
 * Installed by the {@link Container} composition root via `setActivationAdapter`.
 * It tracks the instance-container mapping, initializes {@link WireStatus}
 * (including the container's current provision status), and invokes the
 * `@OnActivation` / `@OnDeactivation` hooks. Activation is render-safe: it opens
 * no subscriptions or resources. Messaging handlers subscribe during provision.
 *
 * @internal
 */
export const wirestateActivationAdapter: ActivationAdapter = {
  activate(container: ContainerKernel, record: ActivationRecord): void {
    const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
    const instance: object = record.instance as object;

    initializeInstanceStatus(container, instance);

    // Plugins (framework layer) observe/extend activation before the user's
    // @OnActivation. A throw here is atomic: the kernel rolls the activation back.
    dispatchPluginActivate(container, instance);

    try {
      const methodName: Maybe<string | symbol> = getActivationHandlerMetadata(instance);

      if (methodName) {
        callLifecycleHandler({
          container: container as Container,
          name: "@OnActivation",
          details: [binding.value.name, String(methodName)],
          instance,
          instanceName: binding.value.name,
          methodName,
          rethrowSync: true,
          source: "instance-activation",
        });
      }
    } catch (error) {
      // The plugin setup phase completed, so user activation failure owes every plugin its
      // matching teardown. Teardown is failsafe and the original activation error still wins.
      dispatchPluginDeactivate(container, instance);

      throw error;
    }
  },

  deactivate(container: ContainerKernel, record: ActivationRecord): void {
    const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
    const instance: object = record.instance as object;

    // Whole-container teardown has already released the cycle by the time it deactivates, so this
    // only does work for an instance dropped on its own while the container stays provisioned.
    deprovisionContainerInstance(container, instance);

    try {
      const methodName: Maybe<string | symbol> = getDeactivationHandlerMetadata(instance);

      if (methodName) {
        callLifecycleHandler({
          container: container as Container,
          name: "@OnDeactivation",
          details: [binding.value.name, String(methodName)],
          instance,
          instanceName: binding.value.name,
          methodName,
          rethrowSync: false,
          source: "instance-deactivation",
        });
      }
    } catch (error) {
      reportWirestateError({
        container: container as Container,
        details: [binding.value.name],
        error,
        instance,
        instanceName: binding.value.name,
        message: "@OnDeactivation failed",
        source: "instance-deactivation",
      });
    }

    // Plugins (framework layer) tear down after the user's @OnDeactivation, in reverse order, failsafe.
    dispatchPluginDeactivate(container, instance);

    finalizeInstanceStatus(instance);
  },

  rollback(_container: ContainerKernel, record: ActivationRecord): void {
    finalizeInstanceStatus(record.instance as object);
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
  const status: MutableWireStatus = trackMutableStatus(instance);

  status.container = container;
  status.isDeactivated = false;
  status.isDeprovisioned = isDeprovisionedInPhase(getProvisionPhase(container));
  status.provisionId = null;
}

/**
 * Ends lifecycle tracking for a deactivated instance.
 *
 * @param instance - Deactivated instance.
 * @internal
 */
export function finalizeInstanceStatus(instance: object): void {
  const status: MutableWireStatus = getMutableStatus(instance);

  status.isDeactivated = true;
  status.isDeprovisioned = true;

  // Release the container ref so a user-held deactivated instance does not pin it.
  status.container = undefined;
}

/**
 * Derives the provider-ownership flag of an instance activated in a given container phase.
 *
 * @remarks
 * An instance activated inside a provisioned container is provider-owned right away. One activated
 * while a cycle is still wiring is in flight, and the cycle stamps it when it completes. One
 * activated after the container was released is deprovisioned. A container that never entered
 * provider lifecycle leaves the flag unset.
 *
 * @param phase - Provider ownership phase of the container, or `undefined` when it has none.
 * @returns The initial `isDeprovisioned` flag.
 */
function isDeprovisionedInPhase(phase: Optional<ProvisionPhase>): Nullable<boolean> {
  switch (phase) {
    case "provisioned":
      return false;
    case "idle":
      return true;
    default:
      return null;
  }
}
