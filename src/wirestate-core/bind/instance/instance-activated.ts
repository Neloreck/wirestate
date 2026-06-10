import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, Newable } from "../../base";
import { callLifecycleHandler } from "../../lifecycle/call-lifecycle-handler";
import { ACTIVE_INSTANCES_BY_CONTAINER, CONTAINER_REFS_BY_INSTANCE } from "../../registry";
import { Maybe } from "../../types/general";
import { BindOptions } from "../bind";

import { unregisterInstanceHandlers, registerInstanceHandlers } from "./instance-handlers";
import { unregisterInstanceStatus, initializeInstanceStatus } from "./instance-status";
import { getActivatedHandlerMetadata } from "./on-activated";

interface CreateInstanceActivationHandlerOptions<T extends object> {
  readonly binding: Newable<T>;
  readonly container: Container;
  readonly options?: BindOptions;
}

/**
 * Creates the container activation hook for a Wirestate instance binding.
 *
 * @internal
 *
 * @template T - Instance type.
 *
 * @param handlerOptions - Activated handler options.
 * @returns Provider activation handler.
 */
export function createInstanceActivatedHandler<T extends object>(
  handlerOptions: CreateInstanceActivationHandlerOptions<T>
): (instance: T) => T {
  const { binding, container, options } = handlerOptions;

  return (instance: T): T => {
    dbg.info(prefix(__filename), "Activating instance:", {
      name: binding.name,
      container,
      binding,
      instance,
      options,
    });

    try {
      let instances: Maybe<Set<object>> = ACTIVE_INSTANCES_BY_CONTAINER.get(container);

      if (!instances) {
        instances = new Set();
        ACTIVE_INSTANCES_BY_CONTAINER.set(container, instances);
      }

      instances.add(instance);

      CONTAINER_REFS_BY_INSTANCE.set(instance, container);

      initializeInstanceStatus(container, instance);
      registerInstanceHandlers(container, instance);

      if (options?.skipActivationHooks) {
        dbg.info(prefix(__filename), "Skip @OnActivated method:", {
          name: binding.name,
          container,
          binding,
          instance,
          options,
        });
      } else {
        onInstanceActivated(container, binding, instance);
      }

      return instance;
    } catch (error) {
      unregisterInstanceStatus(instance);
      unregisterInstanceHandlers(instance);

      const instances: Maybe<Set<object>> = ACTIVE_INSTANCES_BY_CONTAINER.get(container);

      if (instances) {
        instances?.delete(instance);

        if (instances.size === 0) {
          ACTIVE_INSTANCES_BY_CONTAINER.delete(container);
        }
      }

      CONTAINER_REFS_BY_INSTANCE.delete(instance);

      throw error;
    }
  };
}

function onInstanceActivated<T extends object>(container: Container, binding: Newable<T>, instance: T): void {
  const methodName: Maybe<string | symbol> = getActivatedHandlerMetadata(instance);

  if (!methodName) {
    return;
  }

  callLifecycleHandler({
    container,
    name: "@OnActivated",
    details: [binding.name, String(methodName)],
    instance,
    instanceName: binding.name,
    methodName,
    rethrowSync: true,
    source: "instance-activation",
  });
}
